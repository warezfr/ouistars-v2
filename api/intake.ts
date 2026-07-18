import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { type VehicleClass } from '../src/data/pricing.js';
import { getLivePricing } from '../server/pricing/live.js';
import { sendMail, opsEmail } from '../server/email/mailer.js';

/**
 * Capture des leads du site : booking | quote | chauffeur | newsletter.
 * Durci : validation stricte (Zod), limite de débit par IP, honeypot anti-bot,
 * prix recalculé côté serveur depuis la grille (jamais celui du navigateur),
 * notifications e-mail client + ops (si RESEND_API_KEY).
 */

/* ————— Limite de débit (fenêtre glissante 1 min / IP) ————— */
const RATE_LIMIT = 20;
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const rec = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  rec.push(now);
  hits.set(ip, rec);
  if (hits.size > 5000) hits.clear();
  return rec.length > RATE_LIMIT;
}

/* ————— Schémas stricts (liste blanche de colonnes) ————— */
const BookingData = z.object({
  first_name: z.string().max(80).default(''),
  last_name: z.string().max(80).default(''),
  phone: z.string().max(40).default(''),
  email: z.string().email().max(160).optional().or(z.literal('')),
  pickup: z.string().max(300).default(''),
  destination: z.string().max(300).default(''),
  travel_date: z.string().max(20).optional().or(z.literal('')),
  travel_time: z.string().max(20).optional().or(z.literal('')),
  return_date: z.string().max(20).optional().or(z.literal('')),
  return_time: z.string().max(20).optional().or(z.literal('')),
  passengers: z.coerce.number().int().min(1).max(60).default(1),
  vehicle_class: z.enum(['E', 'V', 'S']).optional(),
  prefill: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  route_id: z.string().max(80).nullable().optional(),
}).strip();

const Pricing = z.object({
  mode: z.enum(['oneway', 'hourly']),
  roundTrip: z.coerce.boolean().optional(),
  routeId: z.string().max(80).nullable().optional(),
  distanceKm: z.coerce.number().min(0).max(3000).nullable().optional(),
  hours: z.coerce.number().min(1).max(72).nullable().optional(),
  vehicleClass: z.enum(['E', 'V', 'S']).default('E'),
}).strip();

const QuoteData = z.object({
  company: z.string().max(160).optional(),
  contact_name: z.string().max(160).optional(),
  email: z.string().email().max(160).optional().or(z.literal('')),
  phone: z.string().max(40).optional(),
  event_type: z.string().max(160).optional(),
  start_date: z.string().max(20).optional().or(z.literal('')),
  end_date: z.string().max(20).optional().or(z.literal('')),
  vehicles_count: z.coerce.number().int().min(1).max(200).optional(),
  details: z.string().max(4000).optional(),
}).strip();

const GreeterData = z.object({
  service_type: z.enum(['arrival', 'transit', 'departure']),
  airport_id: z.string().max(40).default('other'),
  airport_label: z.string().max(160).default(''),
  first_name: z.string().max(80).default(''),
  last_name: z.string().max(80).default(''),
  phone: z.string().max(40).default(''),
  email: z.string().email().max(160).optional().or(z.literal('')),
  travel_date: z.string().max(20).optional().or(z.literal('')),
  travel_time: z.string().max(20).optional().or(z.literal('')),
  flight_number: z.string().max(30).optional().or(z.literal('')),
  passengers: z.coerce.number().int().min(1).max(20).default(1),
  notes: z.string().max(2000).optional(),
}).strip();

/** Prix Meet & Greeter officiel — tarifs vivants du Salon de tarification. */
async function greeterPrice(airportId: string, passengers: number): Promise<number | null> {
  const { greeter } = await getLivePricing();
  const rate = greeter.find((r) => r.id === airportId);
  if (!rate || rate.base == null) return null;
  return rate.base + Math.max(0, passengers - rate.includedPax) * (rate.extraPaxSurcharge ?? 0);
}

const GREETER_LABELS: Record<string, string> = {
  arrival: 'Arrivée', transit: 'Transit', departure: 'Départ',
};

const ChauffeurData = z.object({
  first_name: z.string().max(80).optional(),
  last_name: z.string().max(80).optional(),
  phone: z.string().max(40).optional(),
  email: z.string().email().max(160).optional().or(z.literal('')),
  vtc_card: z.string().max(60).optional(),
  city: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
}).strip();

/** Prix officiel recalculé serveur — source de vérité : le Salon de
    tarification du back-office (repli : grille statique embarquée).
    Aller-retour = deux transferts distincts → prix × 2 (règle tarifaire). */
async function serverPrice(p: z.infer<typeof Pricing>): Promise<number | null> {
  const { routes, hourly, perKm, minHours } = await getLivePricing();
  const vc = (p.vehicleClass ?? 'E') as VehicleClass;
  if (p.mode === 'hourly') {
    const h = Math.max(p.hours ?? minHours, minHours);
    return h * hourly[vc];
  }
  const factor = p.roundTrip ? 2 : 1;
  if (p.routeId) {
    const r = routes.find((x) => x.id === p.routeId);
    if (r) return r.prices[vc] * factor;
  }
  if (p.distanceKm && p.distanceKm > 0) {
    return Math.max(100, Math.round((p.distanceKm * perKm[vc]) / 5) * 5) * factor;
  }
  return null;
}

/**
 * Insertion tolérante au schéma : si une colonne n'existe pas dans la table
 * (PostgREST PGRST204), on la retire et on réessaie. Rend l'API robuste aux
 * différences de schéma sans migration manuelle.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertResilient(
  db: any, table: string, row: Record<string, unknown>,
): Promise<{ error: { message: string } | null; dropped: string[] }> {
  const payload = { ...row };
  const dropped: string[] = [];
  for (let i = 0; i < 12; i++) {
    const { error } = await db.from(table).insert(payload);
    if (!error) return { error: null, dropped };
    const m = /Could not find the '([^']+)' column/.exec(error.message);
    if (error.code === 'PGRST204' && m && m[1] in payload) {
      delete payload[m[1]];
      dropped.push(m[1]);
      continue;
    }
    return { error, dropped };
  }
  return { error: { message: 'trop de colonnes manquantes' }, dropped };
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
    return res.status(200).json({ success: true, reference: 'OS-OK' });
  }

  const type = String(body.type ?? '');
  const channel = typeof body.channel === 'string' ? body.channel.slice(0, 40) : 'siteweb';
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

  const reference = `WEB-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;
  const ops = opsEmail();

  try {
    if (type === 'newsletter') {
      const email = z.string().email().max(160).parse(body.email);
      if (supabase) await supabase.from('newsletter_subscribers').insert({ email: email.toLowerCase().trim(), status: 'active' });
      return res.status(200).json({ success: true });
    }

    if (type === 'booking') {
      const data = BookingData.parse(body.data ?? {});
      const pricing = body.pricing ? Pricing.parse(body.pricing) : null;
      const amount = pricing ? await serverPrice(pricing) : null;

      if (supabase) {
        const { error } = await insertResilient(supabase, 'website_bookings', {
          reference, channel, ...data,
          email: data.email || null,
          price_amount: amount,
          route_id: pricing?.routeId ?? data.route_id ?? null,
        });
        if (error) throw error;
      }

      const summary = `${data.pickup} ${pricing?.roundTrip ? '⇄' : '→'} ${data.destination} · ${data.travel_date ?? ''} ${data.travel_time ?? ''}` +
        `${pricing?.roundTrip && data.return_date ? ` · retour ${data.return_date} ${data.return_time ?? ''}` : ''}` +
        ` · ${data.passengers} pax · Classe ${data.vehicle_class ?? '—'}${amount != null ? ` · ${amount} €${pricing?.roundTrip ? ' (A/R)' : ''}` : ''}`;

      if (data.email) {
        await sendMail({
          to: data.email,
          subject: `Votre demande de réservation ${reference} — Oui Stars`,
          html: `<p>Bonjour ${esc(data.first_name)},</p>
            <p>Nous avons bien reçu votre demande de réservation <strong>${reference}</strong> :</p>
            <p>${esc(summary)}</p>
            <p>Notre équipe la confirme dans les meilleurs délais (24/7).</p>
            <p>Oui Stars — Premium Chauffeur Service<br/>+33 6 51 03 03 06 · info@ouistars.com</p>`,
        });
      }
      if (ops) {
        await sendMail({
          to: ops,
          subject: `🚗 Nouvelle réservation ${reference}`,
          html: `<p><strong>${esc(data.first_name)} ${esc(data.last_name)}</strong> — ${esc(data.phone)} ${data.email ? '· ' + esc(data.email) : ''}</p>
            <p>${esc(summary)}</p><p>${esc(data.notes ?? '')}</p>
            <p><a href="https://ouistars-v2.vercel.app/admin/bookings">Ouvrir le back-office</a></p>`,
        });
      }
      return res.status(200).json({ success: true, reference, amount });
    }

    if (type === 'greeter') {
      const data = GreeterData.parse(body.data ?? {});
      const amount = await greeterPrice(data.airport_id, data.passengers);
      const ref = `GR-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;
      const svc = GREETER_LABELS[data.service_type] ?? data.service_type;
      const airport = data.airport_label ||
        (await getLivePricing()).greeter.find((r) => r.id === data.airport_id)?.airport || 'Aéroport';

      const notes = [
        `Meet & Greeter — ${svc}`,
        data.flight_number ? `Vol ${data.flight_number}` : '',
        amount == null ? 'Tarif : sur devis' : '',
        data.notes ?? '',
      ].filter(Boolean).join(' · ');

      if (supabase) {
        const { error } = await insertResilient(supabase, 'website_bookings', {
          reference: ref, channel,
          first_name: data.first_name, last_name: data.last_name,
          phone: data.phone, email: data.email || null,
          pickup: airport,
          destination: `Meet & Greeter (${svc})`,
          travel_date: data.travel_date || null,
          travel_time: data.travel_time || null,
          passengers: data.passengers,
          notes,
          price_amount: amount,
          route_id: `greeter-${data.airport_id}`,
        });
        if (error) throw error;
      }

      const summary = `Meet & Greeter ${svc} · ${airport}` +
        ` · ${data.travel_date ?? ''} ${data.travel_time ?? ''}` +
        `${data.flight_number ? ` · vol ${data.flight_number}` : ''}` +
        ` · ${data.passengers} pax · ${amount != null ? `${amount} €` : 'sur devis'}`;

      if (data.email) {
        await sendMail({
          to: data.email,
          subject: `Votre demande Meet & Greeter ${ref} — Oui Stars`,
          html: `<p>Bonjour ${esc(data.first_name)},</p>
            <p>Nous avons bien reçu votre demande Meet & Greeter <strong>${ref}</strong> :</p>
            <p>${esc(summary)}</p>
            <p><em>Le tarif du service Meet & Greeter n'inclut ni le véhicule ni le chauffeur ;
            le transport se réserve et se facture séparément.</em></p>
            <p>Notre équipe la confirme dans les meilleurs délais (24/7).</p>
            <p>Oui Stars — Premium Chauffeur Service<br/>+33 6 51 03 03 06 · info@ouistars.com</p>`,
        });
      }
      if (ops) {
        await sendMail({
          to: ops,
          subject: `🛬 Meet & Greeter ${ref} — ${svc} ${airport}`,
          html: `<p><strong>${esc(data.first_name)} ${esc(data.last_name)}</strong> — ${esc(data.phone)} ${data.email ? '· ' + esc(data.email) : ''} · canal ${esc(channel)}</p>
            <p>${esc(summary)}</p><p>${esc(data.notes ?? '')}</p>
            <p><a href="https://ouistars-v2.vercel.app/admin/bookings">Ouvrir le back-office</a></p>`,
        });
      }
      return res.status(200).json({ success: true, reference: ref, amount });
    }

    if (type === 'quote') {
      const data = QuoteData.parse(body.data ?? {});
      if (supabase) {
        const { error } = await insertResilient(supabase, 'quotes', { reference, channel, ...data, email: data.email || null });
        if (error) throw error;
      }
      if (data.email) {
        await sendMail({
          to: data.email,
          subject: `Votre demande de devis ${reference} — Oui Stars`,
          html: `<p>Bonjour,</p><p>Votre demande <strong>${reference}</strong> (${esc(data.event_type ?? 'événement')}) est bien reçue — réponse sous 24 h.</p><p>Oui Stars</p>`,
        });
      }
      if (ops) {
        await sendMail({
          to: ops,
          subject: `📋 Nouveau devis ${reference} — ${data.event_type ?? ''}`,
          html: `<p><strong>${esc(data.company ?? data.contact_name ?? '')}</strong> — ${esc(data.phone ?? '')} ${data.email ? '· ' + esc(data.email) : ''}</p>
            <p>${esc(data.details ?? '')}</p>
            <p><a href="https://ouistars-v2.vercel.app/admin/quotes">Ouvrir les devis</a></p>`,
        });
      }
      return res.status(200).json({ success: true, reference });
    }

    if (type === 'chauffeur') {
      const data = ChauffeurData.parse(body.data ?? {});
      if (supabase) {
        const { error } = await insertResilient(supabase, 'chauffeur_applications', { reference, ...data, email: data.email || null });
        if (error) throw error;
      }
      if (ops) {
        await sendMail({
          to: ops, subject: `🪪 Candidature chauffeur ${reference}`,
          html: `<p><strong>${esc(data.first_name)} ${esc(data.last_name)}</strong> — ${esc(data.city ?? '')} — ${esc(data.phone ?? '')}</p>`,
        });
      }
      return res.status(200).json({ success: true, reference });
    }

    return res.status(400).json({ error: 'type invalide' });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: 'Données invalides', details: e.issues[0]?.message });
    }
    console.error('[intake]', e);
    return res.status(500).json({ error: 'Échec enregistrement' });
  }
}
