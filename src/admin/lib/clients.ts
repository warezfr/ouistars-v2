import { supabase } from '@/lib/supabase';

/**
 * Annuaire clients du back-office.
 * Fusionne les fiches réelles (table `clients`, migration 0009) avec les clients
 * agrégés depuis les réservations site, les commandes ETG et les devis.
 * Fournit aussi `ensureClient` : retrouve la fiche par e-mail/téléphone,
 * sinon la crée automatiquement (utilisé à l'émission d'un devis ou d'une facture).
 */

export interface ClientDraft {
  id?: string;        // uuid de la fiche si connue
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface DirectoryClient extends ClientDraft {
  key: string;
  bookings: number;
  total: number;
  lastDate: string;
  sources: string[];  // 'Fiche' | 'Site' | 'ETG' | 'Devis'
}

/** Téléphone normalisé pour comparaison : 9 derniers chiffres (ignore +33/0, espaces, points). */
export function normPhone(phone?: string | null): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits.length >= 9 ? digits.slice(-9) : digits;
}

/** Clé de dédoublonnage : e-mail (minuscules) > téléphone normalisé > nom. */
export function clientKey(c: { email?: string | null; phone?: string | null; name?: string | null }): string {
  const email = (c.email ?? '').trim().toLowerCase();
  if (email) return `e:${email}`;
  const phone = normPhone(c.phone);
  if (phone) return `p:${phone}`;
  return `n:${(c.name ?? '').trim().toLowerCase()}`;
}

/** Retrouve dans l'annuaire l'entrée correspondant à une saisie (e-mail puis téléphone). */
export function matchClient(list: DirectoryClient[], draft: ClientDraft): DirectoryClient | undefined {
  const email = (draft.email ?? '').trim().toLowerCase();
  if (email) {
    const hit = list.find((c) => (c.email ?? '').trim().toLowerCase() === email);
    if (hit) return hit;
  }
  const phone = normPhone(draft.phone);
  if (phone) {
    const hit = list.find((c) => normPhone(c.phone) === phone);
    if (hit) return hit;
  }
  return undefined;
}

interface Partial0 {
  id?: string; name: string; company?: string; email?: string; phone?: string; address?: string;
  amount?: number; date?: string; source: string;
}

function mergeInto(map: Map<string, DirectoryClient>, p: Partial0) {
  const key = clientKey(p);
  if (key === 'n:') return;
  const cur = map.get(key) ?? {
    key, name: p.name, bookings: 0, total: 0, lastDate: '', sources: [],
  };
  if (p.id) cur.id = p.id;                       // la fiche réelle prime
  if (p.id && p.name) cur.name = p.name;
  if (!cur.name && p.name) cur.name = p.name;
  if (!cur.email && p.email) cur.email = p.email;
  if (!cur.phone && p.phone) cur.phone = p.phone;
  if (!cur.company && p.company) cur.company = p.company;
  if (!cur.address && p.address) cur.address = p.address;
  if (p.amount != null) { cur.bookings += 1; cur.total += p.amount; }
  if (p.date && p.date > cur.lastDate) cur.lastDate = p.date;
  if (!cur.sources.includes(p.source)) cur.sources.push(p.source);
  map.set(key, cur);
}

/** Charge l'annuaire complet (fiches + agrégats). Tolère les tables absentes. */
export async function loadClientDirectory(): Promise<DirectoryClient[]> {
  if (!supabase) return [];
  const map = new Map<string, DirectoryClient>();

  const [fiches, site, etg, quotes] = await Promise.all([
    supabase.from('clients').select('*').limit(1000),
    supabase.from('website_bookings').select('first_name,last_name,email,phone,price_amount,created_at').limit(1000),
    supabase.from('etg_orders').select('main_passenger,price_amount,created_at').limit(1000),
    supabase.from('quotes').select('company,contact_name,email,phone,created_at').limit(500),
  ]);

  for (const f of fiches.data ?? []) {
    mergeInto(map, {
      id: f.id, name: f.name, company: f.company ?? undefined, email: f.email ?? undefined,
      phone: f.phone ?? undefined, address: f.address ?? undefined,
      date: (f.created_at ?? '').slice(0, 10), source: 'Fiche',
    });
  }
  for (const b of site.data ?? []) {
    mergeInto(map, {
      name: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || '—',
      email: b.email ?? undefined, phone: b.phone ?? undefined,
      amount: b.price_amount != null ? Number(b.price_amount) : 0,
      date: (b.created_at ?? '').slice(0, 10), source: 'Site',
    });
  }
  for (const o of etg.data ?? []) {
    const mp = (o.main_passenger ?? {}) as { first_name?: string; last_name?: string; phone_number?: string; email?: string };
    mergeInto(map, {
      name: [mp.first_name, mp.last_name].filter(Boolean).join(' ') || '—',
      email: mp.email, phone: mp.phone_number,
      amount: o.price_amount != null ? Number(o.price_amount) : 0,
      date: (o.created_at ?? '').slice(0, 10), source: 'ETG',
    });
  }
  for (const q of quotes.data ?? []) {
    mergeInto(map, {
      name: q.contact_name || q.company || '—', company: q.company ?? undefined,
      email: q.email ?? undefined, phone: q.phone ?? undefined,
      date: (q.created_at ?? '').slice(0, 10), source: 'Devis',
    });
  }

  return [...map.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
}

/**
 * Garantit l'existence d'une fiche client pour la saisie donnée :
 * - retrouvée par id, e-mail (insensible à la casse) ou téléphone → complétée si besoin ;
 * - absente → créée automatiquement.
 * Retourne l'uuid de la fiche, ou null si la table n'est pas migrée (non bloquant).
 */
export async function ensureClient(draft: ClientDraft): Promise<string | null> {
  if (!supabase || !draft.name?.trim()) return null;
  try {
    let row: { id: string; company?: string; email?: string; phone?: string; address?: string } | null = null;

    if (draft.id) {
      const r = await supabase.from('clients').select('*').eq('id', draft.id).maybeSingle();
      row = r.data ?? null;
    }
    const email = (draft.email ?? '').trim();
    if (!row && email) {
      const r = await supabase.from('clients').select('*').ilike('email', email).limit(1);
      row = r.data?.[0] ?? null;
    }
    if (!row && draft.phone) {
      const tail = normPhone(draft.phone);
      if (tail) {
        const r = await supabase.from('clients').select('*').not('phone', 'is', null).limit(500);
        row = (r.data ?? []).find((c) => normPhone(c.phone) === tail) ?? null;
      }
    }

    if (row) {
      // Complète les champs manquants de la fiche (sans écraser l'existant).
      const patch: Record<string, string> = {};
      if (!row.email && email) patch.email = email;
      if (!row.phone && draft.phone) patch.phone = draft.phone;
      if (!row.company && draft.company) patch.company = draft.company;
      if (!row.address && draft.address) patch.address = draft.address;
      if (Object.keys(patch).length) {
        patch.updated_at = new Date().toISOString();
        await supabase.from('clients').update(patch).eq('id', row.id);
      }
      return row.id;
    }

    const ins = await supabase.from('clients').insert({
      name: draft.name.trim(),
      company: draft.company?.trim() || null,
      email: email || null,
      phone: draft.phone?.trim() || null,
      address: draft.address?.trim() || null,
    }).select('id').single();
    if (ins.error) return null; // table absente (migration 0009 non exécutée) → non bloquant
    return ins.data?.id ?? null;
  } catch {
    return null;
  }
}
