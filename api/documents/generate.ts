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

async function loadBooking(reference: string): Promise<BookingLike | null> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const db = createClient(url, key, { auth: { persistSession: false } });

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { reference, type, number } = (req.body ?? {}) as { reference?: string; type?: string; number?: string };
  if (!reference || !type) return res.status(400).json({ error: 'reference et type requis' });

  const booking = (await loadBooking(reference)) ?? { ...DEMO, reference };
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
    pdf = await buildInvoice({
      number: number ?? `FA-${booking.reference.replace(/^OS-?/, '')}`,
      reference: booking.reference,
      date: new Date().toISOString().slice(0, 10),
      clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone,
      lines: [line], logo,
      footNote: legalNote,
    });
  } else if (type === 'quote') {
    pdf = await buildInvoice({
      title: 'DEVIS',
      number: `DE-${booking.reference.replace(/^OS-?/, '')}`,
      reference: booking.reference,
      date: new Date().toISOString().slice(0, 10),
      clientName: booking.clientName, clientEmail: booking.clientEmail, clientPhone: booking.clientPhone,
      lines: [line], logo,
      footNote: 'Devis valable 30 jours. Prix TTC, TVA transport de personnes 10 % incluse.',
    });
  } else {
    pdf = await buildMissionSheet(booking, logo);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-${reference}.pdf"`);
  return res.status(200).send(pdf);
}
