import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { invoke } from '../helpers/vercel';

/**
 * /api/documents/generate — documents créés au back-office :
 * facture manuelle (registre `invoices`, lignes libres + TVA propre) et
 * devis réel (table `quotes`). La référence n'existe dans aucune réservation :
 * le PDF doit être construit depuis les données réelles, pas la démo.
 * On espionne buildInvoice pour vérifier exactement les données transmises
 * (le flux PDF étant compressé, le texte n'y est pas lisible).
 */

const INVOICE = {
  id: 'inv-1', number: 'FA-2026-0042', reference: 'MAN-2026-A1B2C3',
  client_name: 'Société Lumière', client_email: 'compta@lumiere.fr', client_phone: '+33 6 00 11 22 33',
  route: 'Mise à disposition Fashion Week', service_date: '2026-09-28', amount: 1440,
  vat_rate: 0.20,
  items: [
    { label: 'Mise à disposition Classe V — journée', sub: '28/09 · 10 h', qty: 2, unit: 600 },
    { label: 'Heures supplémentaires', qty: 4, unit: 60 },
  ],
};
const QUOTE = {
  id: 'q-1', reference: 'DEV-2026-D4E5F6', company: 'Maison Blanche', contact_name: 'Iris Moreau',
  email: 'iris@maison.fr', phone: '+33 7 00 00 00 00', event_type: 'Mariage',
  start_date: '2026-08-14', end_date: '2026-08-15', vehicles_count: 3,
  details: 'Cortège 3 véhicules, décoration florale', amount_estimated: 2400, status: 'new',
};

/** Fausse base : seules `invoices` et `quotes` répondent, le reste est vide. */
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const q = {
        select: () => q, eq: () => q,
        limit: async () => ({ data: table === 'invoices' ? [INVOICE] : [] }),
        maybeSingle: async () => ({ data: table === 'quotes' ? QUOTE : null }),
      };
      return q;
    },
  }),
}));

/** Espion du constructeur PDF : capture les données, renvoie un pseudo-PDF. */
const built: Array<Record<string, unknown>> = [];
vi.mock('../../server/pdf/invoice.js', () => ({
  buildInvoice: vi.fn(async (d: Record<string, unknown>) => {
    built.push(d);
    return Buffer.from('%PDF-1.4 mock');
  }),
}));

import generateHandler from '../../api/documents/generate';

describe('POST /api/documents/generate — documents back-office', () => {
  const realFetch = globalThis.fetch;
  beforeAll(() => {
    process.env.SUPABASE_URL = 'https://fake.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'fake-key';
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch;
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it('facture manuelle : lignes multiples, TVA 20 %, numéro du registre', async () => {
    built.length = 0;
    const r = await invoke(generateHandler, {
      body: { reference: INVOICE.reference, type: 'invoice', number: INVOICE.number },
    });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('application/pdf');
    const d = built[0];
    expect(d).toMatchObject({
      number: 'FA-2026-0042',
      reference: 'MAN-2026-A1B2C3',
      clientName: 'Société Lumière',
      clientEmail: 'compta@lumiere.fr',
      vatRate: 0.20,
    });
    expect(d.lines).toEqual([
      { label: 'Mise à disposition Classe V — journée', sub: '28/09 · 10 h', qty: 2, unit: 600 },
      { label: 'Heures supplémentaires', sub: undefined, qty: 4, unit: 60 },
    ]);
  });

  it('devis : client + estimation réels depuis la table quotes, numéro DE- aligné', async () => {
    built.length = 0;
    const r = await invoke(generateHandler, { body: { reference: QUOTE.reference, type: 'quote' } });
    expect(r.status).toBe(200);
    const d = built[0];
    expect(d).toMatchObject({
      title: 'DEVIS',
      number: 'DE-2026-D4E5F6',       // ^DEV- retiré — aligné sur l'aperçu back-office
      clientName: 'Iris Moreau',
      clientEmail: 'iris@maison.fr',
    });
    const lines = d.lines as Array<{ label: string; sub?: string; qty: number; unit: number }>;
    expect(lines[0].label).toContain('Mariage');
    expect(lines[0].sub).toContain('2026-08-14 → 2026-08-15');
    expect(lines[0].sub).toContain('3 véhicule(s)');
    expect(lines[0].unit).toBe(2400);
  });
});
