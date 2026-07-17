import { newDoc, header, field, footer, renderToBuffer, INK, MUT } from './pdfBase.js';

export interface MissionData {
  reference: string;
  clientName: string;
  clientPhone?: string;
  driverName: string;
  vehicle: string;
  plate?: string;
  route: string;
  pickup: string;
  destination: string;
  date: string;
  time?: string;
  passengers: number;
  luggage?: number;
  flight?: string;
  meetGreet?: boolean;
  driverAmount?: number;
  notes?: string;
}

/** Fiche de mission chauffeur (PDF nominatif — consigne). */
export async function buildMissionSheet(d: MissionData): Promise<Buffer> {
  const doc = newDoc();
  header(doc, 'Fiche de Mission', `Réf. ${d.reference} · Chauffeur : ${d.driverName}`);

  let y = 175;
  const col = (label: string, value: string, x: number, yy: number) => {
    doc.fillColor(MUT).fontSize(8).font('Helvetica').text(label.toUpperCase(), x, yy);
    doc.fillColor(INK).fontSize(11).font('Helvetica-Bold').text(value || '—', x, yy + 12, { width: 230 });
  };

  col('Date', d.date, 48, y); col('Heure de prise en charge', d.time ?? '—', 310, y); y += 44;
  col('Client', d.clientName, 48, y); col('Téléphone client', d.clientPhone ?? '—', 310, y); y += 44;
  col('Départ', d.pickup, 48, y); col('Destination', d.destination, 310, y); y += 44;
  col('Véhicule', d.vehicle, 48, y); col('Immatriculation', d.plate ?? '—', 310, y); y += 44;
  col('Passagers', String(d.passengers), 48, y); col('Bagages', String(d.luggage ?? '—'), 310, y); y += 44;
  col('Vol', d.flight ?? '—', 48, y); col('Meet & Greeter', d.meetGreet ? 'Oui' : 'Non', 310, y); y += 44;

  if (d.driverAmount != null) { field(doc, 'Montant chauffeur', `${d.driverAmount} €`, y); y += 44; }
  if (d.notes) {
    doc.fillColor(MUT).fontSize(8).font('Helvetica').text('CONSIGNES', 48, y);
    doc.fillColor(INK).fontSize(11).font('Helvetica').text(d.notes, 48, y + 12, { width: 499 });
  }

  footer(doc);
  return renderToBuffer(doc);
}
