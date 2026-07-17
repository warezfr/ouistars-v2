import { newDoc, header, field, footer, renderToBuffer, INK, MUT, GOLD, NIGHT } from './pdfBase.js';

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
export async function buildMissionSheet(d: MissionData, logo?: Buffer | null): Promise<Buffer> {
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

  /* ————— Page 2 : écran d'accueil nominatif (paysage, pour tablette aéroport) ————— */
  doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
  const W = 842, H = 595;
  doc.rect(0, 0, W, H).fill(NIGHT);
  // filets or haut/bas
  doc.rect(0, 0, W, 6).fill(GOLD);
  doc.rect(0, H - 6, W, 6).fill(GOLD);
  // coins décoratifs
  doc.save().strokeColor(GOLD).lineWidth(1.2);
  doc.moveTo(36, 66).lineTo(36, 36).lineTo(66, 36).stroke();
  doc.moveTo(W - 66, 36).lineTo(W - 36, 36).lineTo(W - 36, 66).stroke();
  doc.moveTo(36, H - 66).lineTo(36, H - 36).lineTo(66, H - 36).stroke();
  doc.moveTo(W - 66, H - 36).lineTo(W - 36, H - 36).lineTo(W - 36, H - 66).stroke();
  doc.restore();

  // logo + marque
  if (logo) {
    try { doc.image(logo, W / 2 - 32, 56, { height: 64 }); } catch { /* texte seul */ }
  }
  doc.font('Helvetica-Bold').fontSize(24);
  const wOui = doc.widthOfString('OUI');
  const wStars = doc.widthOfString('STARS');
  const bx = (W - (wOui + wStars)) / 2;
  const by = logo ? 132 : 90;
  doc.fillColor('#ffffff').text('OUI', bx, by, { lineBreak: false });
  doc.fillColor(GOLD).text('STARS', bx + wOui, by, { lineBreak: false });

  // WELCOME / BIENVENUE
  doc.fillColor(GOLD).fontSize(13).font('Helvetica')
    .text('W E L C O M E   ·   B I E N V E N U E', 0, 210, { width: W, align: 'center' });

  // Nom du client en pleine page (taille auto-ajustée)
  const name = (d.clientName || 'Notre invité').toUpperCase();
  let size = 84;
  doc.font('Helvetica-Bold');
  while (size > 30 && doc.fontSize(size).widthOfString(name) > W - 120) size -= 4;
  doc.fillColor('#ffffff').fontSize(size).text(name, 60, 268, { width: W - 120, align: 'center' });

  // filet + pied
  doc.moveTo(W / 2 - 90, 400).lineTo(W / 2 + 90, 400).strokeColor(GOLD).lineWidth(1.4).stroke();
  doc.fillColor('#9aa0aa').fontSize(11).font('Helvetica')
    .text('Votre chauffeur vous attend  ·  Your chauffeur is waiting', 0, 424, { width: W, align: 'center' });
  doc.fillColor(GOLD).fontSize(9)
    .text(`Réf. ${d.reference}${d.flight && d.flight !== 'No flight' ? '   ·   Vol ' + d.flight : ''}`, 0, 448, { width: W, align: 'center' });
  doc.fillColor('#6a6f7a').fontSize(8.5)
    .text('PREMIUM MOBILITY · DESTINATION MANAGEMENT · EVENT SOLUTIONS', 0, H - 40, { width: W, align: 'center' });

  return renderToBuffer(doc);
}
