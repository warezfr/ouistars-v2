import {
  newDoc, bandHeader, waveFooter, titleBlock, renderToBuffer, micro, hr, pdfSafe,
  GOLD, NIGHT, INK, MUT, PAPER, HAIR,
} from './pdfBase.js';

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

/** Ordre de mission chauffeur + écran d'accueil nominatif (page 2, paysage). */
export async function buildMissionSheet(d: MissionData, logo?: Buffer | null): Promise<Buffer> {
  const doc = newDoc();
  let y = bandHeader(doc, logo ?? null);

  y = titleBlock(doc, 'Ordre de mission', [
    ['Référence', d.reference],
    ['Date', d.date],
    ['Chauffeur', d.driverName || 'Non assigné'],
  ], y + 6);

  // ————— Itinéraire — bloc mis en scène —————
  y += 12;
  const L = 48, R = 547;
  doc.rect(L, y, R - L, 64).fill(PAPER);
  doc.rect(L, y, 2.4, 64).fill(GOLD);
  micro(doc, 'Départ', L + 16, y + 11, { color: MUT });
  doc.fillColor(INK).font('Display').fontSize(13).text(pdfSafe(d.pickup) || '—', L + 16, y + 21, { width: 210 });
  // flèche vectorielle
  doc.save().strokeColor(GOLD).lineWidth(1.3);
  doc.moveTo(283, y + 32).lineTo(301, y + 32).stroke();
  doc.moveTo(296, y + 27.5).lineTo(301, y + 32).lineTo(296, y + 36.5).stroke();
  doc.restore();
  micro(doc, 'Destination', 316, y + 11, { color: MUT });
  doc.fillColor(INK).font('Display').fontSize(13).text(pdfSafe(d.destination) || '—', 316, y + 21, { width: 215 });
  y += 78;

  // ————— Grille de mission — 2 colonnes, filets crème —————
  const cell = (label: string, value: string, x: number, yy: number, w = 230) => {
    micro(doc, label, x, yy, { color: MUT });
    doc.fillColor(INK).font('Display').fontSize(13.5).text(pdfSafe(value) || '—', x, yy + 10, { width: w });
  };
  const rows: [string, string, string, string][] = [
    ['Date', d.date || '—', 'Heure de prise en charge', d.time || '—'],
    ['Client', d.clientName, 'Téléphone client', d.clientPhone || '—'],
    ['Véhicule', d.vehicle || '—', 'Immatriculation', d.plate || '—'],
    ['Passagers · Bagages', `${d.passengers} pax  ·  ${d.luggage ?? '—'} bagages`,
      'Vol', d.flight && d.flight !== 'No flight' ? d.flight : '—'],
  ];
  for (const [l1, v1, l2, v2] of rows) {
    cell(l1, v1, L, y);
    cell(l2, v2, 316, y);
    y += 42;
    hr(doc, L, R, y - 9, HAIR);
  }

  // Meet & Greet + montant chauffeur — chips
  let chipX = L;
  const chip = (text: string, dark = false) => {
    doc.font('Helvetica-Bold').fontSize(7);
    const w = doc.widthOfString(text.toUpperCase()) + 7 * 2 + (text.length * 1.1);
    doc.roundedRect(chipX, y, w + 8, 17, 8.5).fill(dark ? NIGHT : PAPER);
    doc.fillColor(dark ? GOLD : INK).text(text.toUpperCase(), chipX + 8, y + 5.5, { characterSpacing: 1.1, lineBreak: false });
    chipX += w + 18;
  };
  chip(d.meetGreet ? 'Meet & Greet : oui' : 'Meet & Greet : non', d.meetGreet);
  if (d.driverAmount != null) chip(`Montant chauffeur : ${d.driverAmount} €`, true);
  y += 30;

  // Consignes
  if (d.notes) {
    micro(doc, 'Consignes', L, y);
    doc.rect(L, y + 10, 2, 30).fill(GOLD);
    doc.fillColor(INK).fontSize(8.6).font('Helvetica').text(pdfSafe(d.notes), L + 12, y + 12, { width: R - L - 12, lineGap: 2 });
  }

  waveFooter(doc, 'Bonne route', 'Document interne — ordre de mission chauffeur');

  /* ————— Page 2 : écran d'accueil nominatif (paysage, tablette aéroport) ————— */
  doc.addPage({ size: 'A4', layout: 'landscape', margin: 0 });
  const W = 842, H = 595;
  doc.rect(0, 0, W, H).fill(NIGHT);
  doc.rect(0, 0, W, 5).fill(GOLD);
  doc.rect(0, H - 5, W, 5).fill(GOLD);
  // coins décoratifs
  doc.save().strokeColor(GOLD).lineWidth(1.2);
  doc.moveTo(36, 66).lineTo(36, 36).lineTo(66, 36).stroke();
  doc.moveTo(W - 66, 36).lineTo(W - 36, 36).lineTo(W - 36, 66).stroke();
  doc.moveTo(36, H - 66).lineTo(36, H - 36).lineTo(66, H - 36).stroke();
  doc.moveTo(W - 66, H - 36).lineTo(W - 36, H - 36).lineTo(W - 36, H - 66).stroke();
  doc.restore();

  // logo + marque
  if (logo) {
    try { doc.image(logo, W / 2 - 30, 52, { height: 60 }); } catch { /* texte seul */ }
  }
  doc.font('Display-Bold').fontSize(25);
  const wOui = doc.widthOfString('OUI', { characterSpacing: 3 });
  const wStars = doc.widthOfString('STARS', { characterSpacing: 3 });
  const bx = (W - (wOui + wStars)) / 2;
  const by = logo ? 124 : 90;
  doc.fillColor('#ffffff').text('OUI', bx, by, { characterSpacing: 3, lineBreak: false });
  doc.fillColor(GOLD).text('STARS', bx + wOui, by, { characterSpacing: 3, lineBreak: false });

  // WELCOME / BIENVENUE
  doc.fillColor(GOLD).fontSize(11).font('Helvetica-Bold')
    .text('WELCOME  ·  BIENVENUE', 0, 208, { width: W, align: 'center', characterSpacing: 5 });

  // Nom du client — Cormorant, taille auto-ajustée
  const name = d.clientName || 'Notre invité';
  let size = 92;
  doc.font('Display-Bold');
  while (size > 30 && doc.fontSize(size).widthOfString(name) > W - 140) size -= 4;
  doc.fillColor('#ffffff').fontSize(size).text(name, 70, 380 - size * 1.15, { width: W - 140, align: 'center' });

  // filet + pied
  doc.moveTo(W / 2 - 40, 402).lineTo(W / 2 + 40, 402).strokeColor(GOLD).lineWidth(1).stroke();
  doc.circle(W / 2, 402, 2.2).fill(GOLD);
  doc.fillColor('#c9c7c0').fontSize(12).font('Display-Italic')
    .text('Votre chauffeur vous attend  ·  Your chauffeur is waiting', 0, 420, { width: W, align: 'center' });
  doc.fillColor(GOLD).fontSize(8.5).font('Helvetica-Bold')
    .text(`RÉF. ${d.reference}${d.flight && d.flight !== 'No flight' ? '   ·   VOL ' + d.flight : ''}`, 0, 450, {
      width: W, align: 'center', characterSpacing: 2,
    });
  doc.fillColor('#63666f').fontSize(7.5).font('Helvetica-Bold')
    .text('PREMIUM MOBILITY  ·  DESTINATION MANAGEMENT  ·  EVENT SOLUTIONS', 0, H - 42, {
      width: W, align: 'center', characterSpacing: 2.4,
    });

  return renderToBuffer(doc);
}
