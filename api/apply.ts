import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { sendMail, opsEmail } from '../server/email/mailer.js';

/**
 * Candidature chauffeur complète (héritée de « Become a partner » de l'ancien site).
 * Dépôt en trois temps pour rester sous la limite de corps Vercel (~4,5 Mo) :
 *   1. action=create   → crée la candidature (statut draft), renvoie { id, reference }
 *   2. action=doc      → téléverse UNE pièce (base64) dans le bucket privé `applications`
 *   3. action=finalize → CONTRÔLE SERVEUR des pièces obligatoires puis statut `new`
 * Les pièces obligatoires sont donc infalsifiables côté navigateur.
 * Durci : Zod, honeypot, limite de débit, insertion tolérante au schéma.
 */

/* ————— Pièces demandées — liste de l'ancien site (Become a Chauffeur Partner) ————— */
/** Toujours obligatoires (le chauffeur). */
export const DOCS_BASE = ['profile_photo', 'id_card', 'driving_licence', 'vtc_card_doc', 'kbis', 'rc_pro', 'rib'] as const;
/** Obligatoires en plus si le candidat déclare un véhicule. */
export const DOCS_VEHICLE = ['vehicle_photo', 'carte_grise', 'insurance', 'maintenance_control'] as const;
const DOC_KEYS = [...DOCS_BASE, ...DOCS_VEHICLE, 'vehicle_photo_2'] as const;

export const DOC_LABELS: Record<string, string> = {
  profile_photo: 'Photo de profil',
  id_card: "Pièce d'identité / Passeport",
  driving_licence: 'Permis de conduire',
  vtc_card_doc: 'Carte VTC (recto/verso)',
  kbis: 'Extrait Kbis (moins de 3 mois)',
  rc_pro: 'Assurance RC professionnelle',
  rib: 'RIB (coordonnées bancaires)',
  vehicle_photo: 'Photo du véhicule',
  vehicle_photo_2: 'Photo du véhicule (2)',
  carte_grise: "Carte grise (certificat d'immatriculation)",
  insurance: 'Assurance du véhicule',
  maintenance_control: 'Contrôle technique',
};

/* ————— Limite de débit (fenêtre glissante 1 min / IP) ————— */
const RATE_LIMIT = 40; // plusieurs uploads par candidature
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const rec = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  rec.push(now);
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.length > RATE_LIMIT;
}

/* ————— Schémas ————— */
const ApplicantData = z.object({
  first_name: z.string().min(1).max(80),
  last_name: z.string().min(1).max(80),
  phone: z.string().min(5).max(40),
  email: z.string().email().max(160),
  city: z.string().max(120).optional().or(z.literal('')),
  country: z.string().max(80).optional().or(z.literal('')),
  vtc_card: z.string().min(2).max(60),
  vehicle_class: z.string().max(40).optional().or(z.literal('')),
  experience: z.string().max(200).optional().or(z.literal('')),
  languages: z.string().max(200).optional().or(z.literal('')),
  message: z.string().max(2000).optional().or(z.literal('')),
}).strip();

const VehicleData = z.object({
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.string().max(10).optional().or(z.literal('')),
  plate: z.string().min(2).max(20),
  seats: z.coerce.number().int().min(1).max(9).optional(),
  color: z.string().max(40).optional().or(z.literal('')),
}).strip();

const DocPayload = z.object({
  id: z.string().uuid(),
  reference: z.string().min(4).max(30),
  key: z.enum(DOC_KEYS),
  name: z.string().max(200).default('document'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  base64: z.string().min(50).max(4_600_000), // ~3,4 Mo de fichier
}).strip();

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf',
};

function getDb(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** Insertion tolérante au schéma (colonnes manquantes retirées) qui renvoie l'id. */
async function insertApplication(
  db: SupabaseClient, row: Record<string, unknown>,
): Promise<{ id: string | null; error: string | null; dropped: string[] }> {
  const payload = { ...row };
  const dropped: string[] = [];
  for (let i = 0; i < 12; i++) {
    const { data, error } = await db.from('chauffeur_applications').insert(payload).select('id').single();
    if (!error) return { id: (data as { id: string }).id, error: null, dropped };
    const m = /Could not find the '([^']+)' column/.exec(error.message);
    if (error.code === 'PGRST204' && m && m[1] in payload) {
      delete payload[m[1]];
      dropped.push(m[1]);
      continue;
    }
    return { id: null, error: error.message, dropped };
  }
  return { id: null, error: 'trop de colonnes manquantes', dropped };
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : (fwd ?? '')).split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'Trop de requêtes' });

  const body = (req.body ?? {}) as Record<string, unknown>;

  // Honeypot : un bot qui remplit « website » reçoit un faux succès.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return res.status(200).json({ success: true, id: '00000000-0000-0000-0000-000000000000', reference: 'CA-OK' });
  }

  const db = getDb();
  if (!db) return res.status(503).json({ error: 'Base indisponible' });
  const action = String(body.action ?? '');

  try {
    /* ————— 1. Création (statut draft) ————— */
    if (action === 'create') {
      const data = ApplicantData.parse(body.data ?? {});
      const vehicle = body.vehicle ? VehicleData.parse(body.vehicle) : null;
      const reference = `CA-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;
      const { id, error } = await insertApplication(db, {
        reference, status: 'draft', ...data,
        email: data.email || null,
        vehicle, docs: {},
      });
      if (error || !id) throw new Error(error ?? 'insertion impossible');
      return res.status(200).json({ id, reference });
    }

    /* ————— 2. Téléversement d'une pièce ————— */
    if (action === 'doc') {
      const p = DocPayload.parse(body);
      const { data: row } = await db.from('chauffeur_applications')
        .select('id, reference, docs').eq('id', p.id).eq('reference', p.reference).maybeSingle();
      if (!row) return res.status(404).json({ error: 'Candidature introuvable' });

      const buf = Buffer.from(p.base64, 'base64');
      if (buf.length < 100) return res.status(400).json({ error: 'Fichier vide' });
      const path = `${p.reference}/${p.key}.${EXT[p.contentType]}`;

      // Bucket privé `applications` (migration 0010) ; repli : bucket cms.
      let bucket = 'applications';
      let up = await db.storage.from(bucket).upload(path, buf, { upsert: true, contentType: p.contentType });
      if (up.error && /bucket/i.test(up.error.message)) {
        bucket = 'cms';
        up = await db.storage.from(bucket).upload(`applications/${path}`, buf, { upsert: true, contentType: p.contentType });
      }
      if (up.error) throw new Error(`téléversement : ${up.error.message}`);

      const docs = { ...((row.docs as Record<string, unknown>) ?? {}), [p.key]: {
        bucket, path: bucket === 'cms' ? `applications/${path}` : path,
        name: p.name.slice(0, 120), type: p.contentType, size: buf.length,
      } };
      const upd = await db.from('chauffeur_applications').update({ docs }).eq('id', p.id);
      // Colonne docs absente (migration 0010 non exécutée) → non bloquant, pièce archivée au Storage.
      const stored = !upd.error;
      return res.status(200).json({ ok: true, stored, path: docs[p.key] });
    }

    /* ————— 3. Finalisation — CONTRÔLE des pièces obligatoires ————— */
    if (action === 'finalize') {
      const id = z.string().uuid().parse(body.id);
      const reference = z.string().min(4).max(30).parse(body.reference);
      const { data: row } = await db.from('chauffeur_applications')
        .select('*').eq('id', id).eq('reference', reference).maybeSingle();
      if (!row) return res.status(404).json({ error: 'Candidature introuvable' });

      const docs = (row.docs ?? null) as Record<string, unknown> | null;
      if (docs !== null) { // colonne présente → contrôle strict
        const required: string[] = [...DOCS_BASE, ...(row.vehicle ? DOCS_VEHICLE : [])];
        const missing = required.filter((k) => !docs[k]);
        if (missing.length > 0) {
          return res.status(400).json({
            error: 'Pièces obligatoires manquantes',
            missing, missingLabels: missing.map((k) => DOC_LABELS[k] ?? k),
          });
        }
      }

      await db.from('chauffeur_applications').update({ status: 'new' }).eq('id', id);

      const ops = opsEmail();
      if (ops) {
        const v = row.vehicle as { make?: string; model?: string; plate?: string } | null;
        await sendMail({
          to: ops,
          subject: `🪪 Candidature chauffeur ${reference} — ${esc(row.first_name)} ${esc(row.last_name)}`,
          html: `<h2>Nouvelle candidature chauffeur</h2>
            <p><b>${esc(row.first_name)} ${esc(row.last_name)}</b> — ${esc(row.city ?? '')} ${esc(row.country ?? '')}</p>
            <p>Tél. ${esc(row.phone)} · ${esc(row.email ?? '')}<br/>Carte VTC : ${esc(row.vtc_card ?? '—')}</p>
            ${v ? `<p>Véhicule : ${esc(v.make)} ${esc(v.model)} — ${esc(v.plate)}</p>` : '<p>Sans véhicule personnel.</p>'}
            <p>Pièces jointes déposées : ${docs ? Object.keys(docs).map((k) => DOC_LABELS[k] ?? k).join(', ') : '—'}</p>
            <p>Réf. <b>${esc(reference)}</b> — à retrouver dans le back-office, section Candidatures.</p>`,
        }).catch(() => { /* notification best-effort */ });
      }
      return res.status(200).json({ success: true, reference });
    }

    return res.status(400).json({ error: 'action invalide' });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: e.issues.map((i) => i.path.join('.')).slice(0, 10) });
    }
    return res.status(500).json({ error: (e as Error).message });
  }
}
