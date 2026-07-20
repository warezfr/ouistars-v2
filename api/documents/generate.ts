import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { buildMissionSheet } from '../../server/pdf/missionSheet.js';
import { buildInvoice } from '../../server/pdf/invoice.js';
import { fetchLogo } from '../../server/pdf/pdfBase.js';

/**
 * Génère un document PDF lié à une réservation.
 * POST { reference, type: 'mission_sheet' | 'purchase_order' | 'invoice' }
 * Charge la réservation réelle (website_bookings puis etg_orders) ;
 * repli sur des données de démonstration si la base est absente.
 */

interface BookingLike {
  reference: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  driverName: string;
  vehicle: string;
  plate: string;
  route: string;
  pickup: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  luggage: number;
  flight: string;
  meetGreet: boolean;
  amount: number;
  driverAmount: number;
  notes: string;
}

const DEMO: BookingLike = {
  reference: 'OS-DEMO', clientName: 'M. Laurent', clientPhone: '+33 6 00 00 00 00',
  driverName: 'Pierre Martin', vehicle: 'Mercedes Classe S', plate: 'OS-003-S',
  route: 'CDG ⇄ Paris', pickup: 'Aéroport CDG — Terminal 2E',
  destination: '78 Av. des Champs-Élysées, Paris', date: '2026-07-20', time: '09:30',
  passengers: 2, luggage: 2, flight: 'AF1234', meetGreet: true,
  amount: 210, driverAmount: 130, notes: 'Accueil pancarte nominative. Eau à bord.',
};

function getDb() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function loadBooking(reference: string): Promise<BookingLike | null> {
  const db = getDb();
  if (!db) return null;

  const { data: b } = await db.from('website_bookings').select('*').eq('reference', reference).maybeSingle();
  if (b) {
    const driver = ((b.notes as string) ?? '').match(/\[chauffeur:(.+?)\]/)?.[1] ?? '';
    return {
      reference: b.reference,
      clientName: [b.first_name, b.last_name].filter(Boolean).join(' ') || b.email || 'Client',
      clientPhone: b.phone ?? '', clientEmail: b.email ?? undefined,
      driverName: driver, vehicle: b.vehicle_class ? `Classe ${b.vehicle_class}` : '—', plate: '',
      route: b.prefill || [b.pickup, b.destination].filter(Boolean).join(' → ') || '—',
      pickup: b.pickup ?? '', destination: b.destination ?? '',
      date: b.travel_date ?? '', time: b.travel_time ?? '',
      passengers: b.passengers ?? 1, luggage: 0, flight: '', meetGreet: false,
      amount: b.price_amount != null ? Number(b.price_amount) : 0,
      driverAmount: 0, notes: ((b.notes as string) ?? '').replace(/\s*\[chauffeur:.+?\]/, ''),
    };
  }

  const { data: o } = await db.from('etg_orders').select('*').eq('order_id', reference).maybeSingle();
  if (o) {
    const mp = (o.main_passenger ?? {}) as { first_name?: string; last_name?: string; phone_number?: string; email?: string };
    const sp = (o.search_payload ?? {}) as { start_point?: { iata?: string; address?: string }; end_point?: { iata?: string; address?: string } };
    return {
      reference: o.order_id,
      clientName: [mp.first_name, mp.last_name].filter(Boolean).join(' ') || 'Client ETG',
      clientPhone: mp.phone_number ?? '', clientEmail: mp.email ?? undefined,
      driverName: '', vehicle: o.transfer_category ?? '—', plate: '',
      route: `${sp.start_point?.iata ?? sp.start_point?.address ?? '—'} → ${sp.end_point?.iata ?? sp.end_point?.address ?? '—'}`,
      pickup: sp.start_point?.address ?? sp.start_point?.iata ?? '',
      destination: sp.end_point?.address ?? sp.end_point?.iata ?? '',
      date: ((o.start_time as string) ?? '').slice(0, 10), time: ((o.start_time as string) ?? '').slice(11, 16),
      passengers: o.passengers ?? 1, luggage: o.luggage_places ?? 0,
      flight: o.flight_number ?? '', meetGreet: true,
      amount: o.price_amount != null ? Number(o.price_amount) : 0,
      driverAmount: 0, notes: o.comment ?? '',
    };
  }
  return null;
}

interface DocLineIn { label: string; sub?: string; qty: number; unit: number }
interface ManualDoc {
  clientName: string; clientEmail?: string; clientPhone?: string;
  lines: DocLineIn[]; vatRate?: number; number?: string;
}

/** Facture émise au back-office (registre `invoices`) — lignes libres + TVA propre. */
async function loadManualInvoice(reference: string, number?: string): Promise<ManualDoc | null> {
  const db = getDb();
  if (!db) return null;
  let q = db.from('invoices').select('*').eq('reference', reference);
  if (number) q = db.from('invoices').select('*').eq('number', number);
  const { data: rows } = await q.limit(1);
  const inv = rows?.[0];
  if (!inv) return null;
  const items = (inv.items ?? null) as DocLineIn[] | null;
  return {
    clientName: inv.client_name ?? 'Client',
    clientEmail: inv.client_email ?? undefined,
    clientPhone: inv.client_phone ?? undefined,
    vatRate: inv.vat_rate != null ? Number(inv.vat_rate) : undefined,
    number: inv.number,
    lines: items?.length
      ? items.map((it) => ({ label: it.label, sub: it.sub, qty: Number(it.qty) || 1, unit: Number(it.unit) || 0 }))
      : [{
          label: `Transport avec chauffeur — ${inv.route ?? ''}`,
          sub: inv.service_date ?? undefined, qty: 1, unit: Number(inv.amount) || 0,
        }],
  };
}

/** Devis réel (table `quotes`) — demandes du site et devis créés au back-office. */
async function loadQuoteDoc(reference: string): Promise<ManualDoc | null> {
  const db = getDb();
  if (!db) return null;
  const { data: q } = await db.from('quotes').select('*').eq('reference', reference).maybeSingle();
  if (!q) return null;
  const dates = [q.start_date, q.end_date].filter(Boolean).join(' → ');
  return {
    clientName: q.contact_name || q.company || 'Client',
    clientEmail: q.email ?? undefined,
    clientPhone: q.phone ?? undefined,
    lines: [{
      label: `Prestation — ${q.event_type ?? 'Événement'}`,
      sub: [dates, q.vehicles_count ? `${q.vehicles_count} véhicule(s)` : '', (q.details ?? '').slice(0, 90)]
        .filter(Boolean).join('  ·  '),
      qty: 1,
      unit: q.amount_estimated != null ? Number(q.amount_estimated) : 0,
    }],
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { reference, type, number } = (req.body ?? {}) as { reference?: string; type?: string; number?: string };
  if (!reference || !type) return res.status(400).json({ error: 'reference et type requis' });

  // Réservation d'abord ; sinon documents réels du back-office :
  // facture du registre `invoices` (lignes libres) ou devis de la table `quotes`.
  const found = await loadBooking(reference);
  let manual: ManualDoc | null = null;
  if (!found && type === 'invoice') manual = await loadManualInvoice(reference, number);
  if (!found && type === 'quote') manual = await loadQuoteDoc(reference);
  const booking = found ?? { ...DEMO, reference };
  const logo = await fetchLogo();

  // Mentions légales depuis les Paramètres du site (si base joignable).
  let legal = '';
  {
    const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await db.from('cms_singletons').select('data').eq('key', 'settings').maybeSingle();
      const st = (data?.data ?? {}) as Record<string, string>;
      legal = [st.legalForm, st.legalAddress, st.siren ? `SIREN ${st.siren}` : '', st.vatNumber ? `TVA ${st.vatNumber}` : '']
        .filter(Boolean).join(' — ');
    }
  }
  const legalNote = legal
    ? `${legal}. TVA transport de personnes : 10 %. Pénalités de retard : 3× le taux légal ; indemnité forfaitaire de recouvrement : 40 €.`
    : undefined;
  const serviceDate = [booking.date, booking.time].filter(Boolean).join(' ');
  const line = {
    label: `Transport avec chauffeur — ${booking.route}`,
    sub: [serviceDate, booking.vehicle].filter(Boolean).join('  ·  '),
    qty: 1,
    unit: booking.amount,
  };

  let pdf: Buffer;
  if (type === 'purchase_order') {
    pdf = await buildInvoice({
      title: 'BON DE COMMANDE',
      number: `BC-${booking.reference.replace(/^OS-?/, '')}`,
      reference: booking.reference,
      date: new Date().toISOString().slice(0, 10),
      clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone,
      lines: [line], logo,
      footNote: booking.driverName ? `Chauffeur assigné : ${booking.driverName}.` : undefined,
    });
  } else if (type === 'invoice') {
    const vat = manual?.vatRate ?? 0.10;
    pdf = await buildInvoice({
      number: number ?? manual?.number ?? `FA-${booking.reference.replace(/^OS-?/, '')}`,
      reference,
      date: new Date().toISOString().slice(0, 10),
      clientName: manual?.clientName ?? booking.clientName,
      clientEmail: manual?.clientEmail ?? booking.clientEmail,
      clientPhone: manual?.clientPhone ?? booking.clientPhone,
      lines: manual?.lines ?? [line], logo,
      vatRate: vat,
      footNote: legal
        ? `${legal}. TVA : ${Math.round(vat * 100)} %. Pénalités de retard : 3× le taux légal ; indemnité forfaitaire de recouvrement : 40 €.`
        : legalNote,
    });
  } else if (type === 'quote') {
    pdf = await buildInvoice({
      title: 'DEVIS',
      number: `DE-${reference.replace(/^OS-?|^DEV-?/, '')}`,
      reference,
      date: new Date().toISOString().slice(0, 10),
      clientName: manual?.clientName ?? booking.clientName,
      clientEmail: manual?.clientEmail ?? booking.clientEmail,
      clientPhone: manual?.clientPhone ?? booking.clientPhone,
      lines: manual?.lines ?? [line], logo,
      footNote: 'Devis valable 30 jours. Prix TTC, TVA transport de personnes 10 % incluse.',
    });
  } else {
    pdf = await buildMissionSheet(booking, logo);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-${reference}.pdf"`);
  return res.status(200).send(pdf);
}
