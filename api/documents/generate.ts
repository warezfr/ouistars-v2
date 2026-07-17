import type { VercelRequest, VercelResponse } from '@vercel/node';
import { buildMissionSheet } from '../../server/pdf/missionSheet.js';
import { buildPurchaseOrder } from '../../server/pdf/purchaseOrder.js';

/**
 * Génère un document PDF chauffeur/client (consigne).
 * POST { reference, type: 'mission_sheet' | 'purchase_order' }
 * En production : charger la réservation depuis Supabase, générer, uploader (Storage)
 * et envoyer par e-mail au chauffeur en pièce jointe. Ici : génération + renvoi direct du PDF.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { reference, type } = (req.body ?? {}) as { reference?: string; type?: string };
  if (!reference || !type) return res.status(400).json({ error: 'reference et type requis' });

  // TODO production : SELECT depuis website_bookings/etg_orders via reference.
  const demo = {
    reference,
    clientName: 'M. Laurent',
    clientPhone: '+33 6 00 00 00 00',
    driverName: 'Pierre Martin',
    vehicle: 'Mercedes Classe S',
    plate: 'OS-003-S',
    route: 'CDG ⇄ Paris',
    pickup: 'Aéroport CDG — Terminal 2E',
    destination: '78 Av. des Champs-Élysées, Paris',
    date: '2026-07-20',
    time: '09:30',
    passengers: 2,
    luggage: 2,
    flight: 'AF1234',
    meetGreet: true,
    amount: 210,
    driverAmount: 130,
    notes: 'Accueil pancarte nominative. Eau à bord.',
  };

  let pdf: Buffer;
  if (type === 'purchase_order') {
    pdf = await buildPurchaseOrder({
      reference: demo.reference, clientName: demo.clientName, route: demo.route,
      date: demo.date, vehicle: demo.vehicle, amount: demo.amount, driverName: demo.driverName,
    });
  } else {
    pdf = await buildMissionSheet(demo);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${type}-${reference}.pdf"`);
  return res.status(200).send(pdf);
}
