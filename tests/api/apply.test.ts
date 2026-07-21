import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { invoke } from '../helpers/vercel';

/**
 * /api/apply — candidature chauffeur en 3 temps (create → doc → finalize).
 * Vérifie surtout LE CONTRAT CENTRAL : les pièces obligatoires sont contrôlées
 * CÔTÉ SERVEUR — une candidature sans pièces ne peut pas être finalisée.
 */

/* ————— Fausse base : candidatures en mémoire + Storage journalisé ————— */
type Row = Record<string, unknown>;
const state = {
  rows: new Map<string, Row>(),
  uploads: [] as Array<{ bucket: string; path: string; size: number }>,
  bucketMissing: false, // simule l'absence du bucket `applications` (migration 0010 non exécutée)
};
let seq = 0;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const q: any = {
        _filters: {} as Record<string, unknown>,
        insert: (payload: Row) => ({
          select: () => ({
            single: async () => {
              const id = `11111111-1111-4111-8111-11111111100${++seq}`.slice(0, 36);
              state.rows.set(id, { id, ...payload });
              return { data: { id }, error: null };
            },
          }),
        }),
        select: () => q,
        eq: (k: string, v: unknown) => { q._filters[k] = v; return q; },
        maybeSingle: async () => {
          const row = [...state.rows.values()].find((r) =>
            Object.entries(q._filters).every(([k, v]) => r[k] === v));
          return { data: row ?? null };
        },
        update: (patch: Row) => ({
          eq: async (k: string, v: unknown) => {
            const row = [...state.rows.values()].find((r) => r[k] === v);
            if (row) Object.assign(row, patch);
            return { error: null };
          },
        }),
      };
      return q;
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string, buf: Buffer) => {
          if (bucket === 'applications' && state.bucketMissing) {
            return { error: { message: 'Bucket not found' } };
          }
          state.uploads.push({ bucket, path, size: buf.length });
          return { data: { path }, error: null };
        },
      }),
    },
  }),
}));

import applyHandler from '../../api/apply';

const APPLICANT = {
  first_name: 'Nadia', last_name: 'Bel', phone: '+33 6 00 00 00 00', email: 'nadia@ex.com',
  city: 'Paris', country: 'France', vtc_card: 'VTC-075-9001', vehicle_class: 'business',
};
const VEHICLE = { make: 'Mercedes', model: 'Classe E', plate: 'AB-123-CD', year: '2023', seats: 3 };
const PNG_B64 = Buffer.from('x'.repeat(400)).toString('base64');

let ipSeq = 0; // IP différente par requête — évite la limite de débit entre tests
const post = (body: Record<string, unknown>, ip?: string) =>
  invoke(applyHandler, { body, headers: { 'x-forwarded-for': ip ?? `10.9.${Math.floor(ipSeq / 200)}.${++ipSeq % 200}` } });

async function createFull(withVehicle = true) {
  const r = await post({ action: 'create', data: APPLICANT, vehicle: withVehicle ? VEHICLE : undefined });
  return r.body as { id: string; reference: string };
}
async function uploadDoc(id: string, reference: string, key: string) {
  return post({ action: 'doc', id, reference, key, name: `${key}.jpg`, contentType: 'image/jpeg', base64: PNG_B64 });
}

beforeAll(() => {
  process.env.SUPABASE_URL = 'https://fake.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key';
});
afterAll(() => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
});
beforeEach(() => { state.rows.clear(); state.uploads.length = 0; state.bucketMissing = false; });

describe('POST /api/apply', () => {
  it('create : candidature en brouillon, référence CA-', async () => {
    const r = await post({ action: 'create', data: APPLICANT, vehicle: VEHICLE });
    expect(r.status).toBe(200);
    const { id, reference } = r.body as { id: string; reference: string };
    expect(reference).toMatch(/^CA-/);
    const row = state.rows.get(id)!;
    expect(row.status).toBe('draft');
    expect((row.vehicle as { plate: string }).plate).toBe('AB-123-CD');
  });

  it('create : données invalides (carte VTC manquante) → 400 ; honeypot → faux succès', async () => {
    const bad = await post({ action: 'create', data: { ...APPLICANT, vtc_card: '' } });
    expect(bad.status).toBe(400);
    const bot = await post({ action: 'create', website: 'spam.io', data: APPLICANT });
    expect(bot.status).toBe(200);
    expect((bot.body as { reference: string }).reference).toBe('CA-OK');
    expect(state.rows.size).toBe(0); // rien n'est créé pour un bot
  });

  it('doc : pièce archivée dans le bucket privé applications + docs jsonb', async () => {
    const { id, reference } = await createFull();
    const r = await uploadDoc(id, reference, 'driving_licence');
    expect(r.status).toBe(200);
    expect(state.uploads[0]).toMatchObject({ bucket: 'applications', path: `${reference}/driving_licence.jpg` });
    const docs = state.rows.get(id)!.docs as Record<string, { path: string }>;
    expect(docs.driving_licence.path).toBe(`${reference}/driving_licence.jpg`);
  });

  it('doc : bucket applications absent → repli bucket cms (migration 0010 non exécutée)', async () => {
    state.bucketMissing = true;
    const { id, reference } = await createFull();
    const r = await uploadDoc(id, reference, 'profile_photo');
    expect(r.status).toBe(200);
    expect(state.uploads[0]).toMatchObject({ bucket: 'cms', path: `applications/${reference}/profile_photo.jpg` });
  });

  it('doc : candidature inconnue → 404 ; clé de pièce invalide → 400', async () => {
    const { reference } = await createFull();
    const bad = await post({ action: 'doc', id: '99999999-9999-4999-8999-999999999999', reference, key: 'profile_photo', contentType: 'image/jpeg', base64: PNG_B64 });
    expect(bad.status).toBe(404);
    const { id, reference: ref2 } = await createFull();
    const badKey = await post({ action: 'doc', id, reference: ref2, key: 'passeport_diplomatique', contentType: 'image/jpeg', base64: PNG_B64 });
    expect(badKey.status).toBe(400);
  });

  const BASE_DOCS = ['profile_photo', 'id_card', 'driving_licence', 'vtc_card_doc', 'kbis', 'rc_pro', 'rib'];
  const VEHICLE_DOCS = ['vehicle_photo', 'carte_grise', 'insurance', 'maintenance_control'];

  it('CONTRAT : finalize refuse tant que les pièces obligatoires manquent (11 avec véhicule)', async () => {
    const { id, reference } = await createFull(true);
    for (const k of BASE_DOCS) await uploadDoc(id, reference, k);
    const r = await post({ action: 'finalize', id, reference });
    expect(r.status).toBe(400);
    const missing = (r.body as { missing: string[] }).missing.sort();
    expect(missing).toEqual(['carte_grise', 'insurance', 'maintenance_control', 'vehicle_photo']);
    expect(state.rows.get(id)!.status).toBe('draft'); // toujours pas déposée
  });

  it('finalize : sans véhicule, les 7 pièces chauffeur suffisent → statut new', async () => {
    const { id, reference } = await createFull(false);
    for (const k of BASE_DOCS) await uploadDoc(id, reference, k);
    const r = await post({ action: 'finalize', id, reference });
    expect(r.status).toBe(200);
    expect(state.rows.get(id)!.status).toBe('new');
  });

  it('finalize : Kbis / RC pro / RIB / pièce d’identité aussi exigés (héritage ancien site)', async () => {
    const { id, reference } = await createFull(false);
    for (const k of ['profile_photo', 'driving_licence', 'vtc_card_doc']) await uploadDoc(id, reference, k);
    const r = await post({ action: 'finalize', id, reference });
    expect(r.status).toBe(400);
    expect((r.body as { missing: string[] }).missing.sort()).toEqual(['id_card', 'kbis', 'rc_pro', 'rib']);
  });

  it('finalize : avec véhicule et les 11 pièces → statut new', async () => {
    const { id, reference } = await createFull(true);
    for (const k of [...BASE_DOCS, ...VEHICLE_DOCS]) await uploadDoc(id, reference, k);
    const r = await post({ action: 'finalize', id, reference });
    expect(r.status).toBe(200);
    expect((r.body as { reference: string }).reference).toBe(reference);
    expect(state.rows.get(id)!.status).toBe('new');
  });

  it('GET → 405', async () => {
    const r = await invoke(applyHandler, { method: 'GET' });
    expect(r.status).toBe(405);
  });
});
