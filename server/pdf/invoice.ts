import {
  newDoc, bandHeader, waveFooter, renderToBuffer,
  GOLD, NIGHT, INK, MUT, PAPER, type BrandContact, DEFAULT_CONTACT,
} from './pdfBase.js';

export interface DocLine {
  label: string;
  sub?: string;
  qty: number;
  unit: number;
}

export interface InvoiceData {
  number: string;
  reference: string;
  date: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  lines: DocLine[];
  currency?: string;
  logo?: Buffer | null;
  contact?: BrandContact;
  /** 'FACTURE' | 'DEVIS' | 'BON DE COMMANDE' */
  title?: string;
  vatRate?: number;       // 0.10 transport
  footNote?: string;
}

/** Facture / devis / bon de commande — mise en page inspirée du template fourni. */
export async function buildInvoice(d: InvoiceData): Promise<Buffer> {
  const doc = newDoc();
  const cur = d.currency ?? '€';
  const vat = d.vatRate ?? 0.10;
  const title = d.title ?? 'FACTURE';

  bandHeader(doc, d.logo ?? null, d.contact ?? DEFAULT_CONTACT);

  // Bloc client (À) — gauche
  let y = 128;
  doc.fillColor(MUT).fontSize(8).font('Helvetica-Bold').text('À', 48, y);
  doc.moveTo(48, y + 11).lineTo(200, y + 11).strokeColor('#dddddd').lineWidth(1).stroke();
  doc.fillColor(INK).fontSize(13).font('Helvetica-Bold').text(d.clientName, 48, y + 18, { width: 250 });
  doc.fillColor(MUT).fontSize(9).font('Helvetica');
  let cy = y + 36;
  if (d.clientPhone) { doc.text(`T. ${d.clientPhone}`, 48, cy); cy += 13; }
  if (d.clientEmail) { doc.text(`E. ${d.clientEmail}`, 48, cy); cy += 13; }

  // Titre + méta — droite (taille auto-ajustée pour tenir sur une ligne)
  doc.font('Helvetica-Bold');
  let titleSize = 30;
  while (titleSize > 14 && doc.fontSize(titleSize).widthOfString(title) > 227) titleSize -= 2;
  doc.fillColor(GOLD).fontSize(titleSize).text(title, 320, y - 4, { width: 227, align: 'right', lineBreak: false });
  const meta: [string, string][] = [
    ['Date', d.date],
    ['N° document', d.number],
    ['Réf. réservation', d.reference],
  ];
  let my = y - 4 + titleSize + 12;
  for (const [k, v] of meta) {
    doc.fillColor(MUT).fontSize(8.5).font('Helvetica').text(k, 330, my, { width: 110, align: 'right' });
    doc.fillColor(INK).fontSize(8.5).font('Helvetica-Bold').text(`:  ${v}`, 445, my, { width: 102 });
    my += 14;
  }

  // Tableau des lignes
  y = Math.max(cy, my) + 26;
  const cols = { desc: 48, unit: 320, qty: 420, total: 480, right: 547 };
  doc.rect(48, y, cols.right - 48, 24).fill(NIGHT);
  doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
  doc.text('DÉSIGNATION', cols.desc + 10, y + 8);
  doc.text('PRIX UNIT.', cols.unit, y + 8, { width: 90, align: 'right' });
  doc.text('QTÉ', cols.qty, y + 8, { width: 50, align: 'right' });
  doc.text('TOTAL', cols.total, y + 8, { width: 60, align: 'right' });
  y += 24;

  let subtotal = 0;
  d.lines.forEach((l, i) => {
    // Hauteur dynamique selon le libellé (les adresses longues ne débordent plus).
    doc.font('Helvetica-Bold').fontSize(9.5);
    const labelH = doc.heightOfString(l.label, { width: 255 });
    doc.font('Helvetica').fontSize(7.5);
    const subH = l.sub ? doc.heightOfString(l.sub, { width: 255 }) : 0;
    const rowH = Math.max(24, 7 + labelH + (l.sub ? subH + 3 : 0) + 7);
    if (i % 2 === 0) doc.rect(48, y, cols.right - 48, rowH).fill(PAPER);
    doc.fillColor(INK).fontSize(9.5).font('Helvetica-Bold').text(l.label, cols.desc + 10, y + 7, { width: 255 });
    if (l.sub) doc.fillColor(MUT).fontSize(7.5).font('Helvetica').text(l.sub, cols.desc + 10, y + 7 + labelH + 3, { width: 255 });
    const lineTotal = l.qty * l.unit;
    subtotal += lineTotal;
    doc.fillColor(INK).fontSize(9.5).font('Helvetica');
    doc.text(`${l.unit.toFixed(2)} ${cur}`, cols.unit, y + 7, { width: 90, align: 'right' });
    doc.text(String(l.qty), cols.qty, y + 7, { width: 50, align: 'right' });
    doc.font('Helvetica-Bold').text(`${lineTotal.toFixed(2)} ${cur}`, cols.total, y + 7, { width: 60, align: 'right' });
    y += rowH;
  });
  doc.moveTo(48, y).lineTo(cols.right, y).strokeColor('#dddddd').lineWidth(1).stroke();

  // Totaux — droite
  const ttc = subtotal;
  const ht = ttc / (1 + vat);
  const tva = ttc - ht;
  let ty = y + 16;
  const totalRow = (label: string, value: string, bold = false) => {
    doc.fillColor(bold ? INK : MUT).fontSize(9.5).font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .text(label, 330, ty, { width: 130, align: 'right' });
    doc.fillColor(INK).fontSize(9.5).font('Helvetica-Bold').text(value, 465, ty, { width: 82, align: 'right' });
    ty += 17;
  };
  totalRow('Sous-total HT', `${ht.toFixed(2)} ${cur}`);
  totalRow(`TVA (${Math.round(vat * 100)} %)`, `${tva.toFixed(2)} ${cur}`);
  ty += 4;
  doc.rect(320, ty, 227, 30).fill(GOLD);
  doc.fillColor(NIGHT).fontSize(11.5).font('Helvetica-Bold').text('TOTAL TTC :', 332, ty + 9);
  doc.fontSize(13).text(`${ttc.toFixed(2)} ${cur}`, 415, ty + 8, { width: 122, align: 'right' });

  // Paiement + conditions — gauche
  let py = y + 16;
  doc.fillColor(INK).fontSize(9).font('Helvetica-Bold').text('Règlement', 48, py); py += 13;
  doc.fillColor(GOLD).fontSize(8.5).font('Helvetica-Bold').text('Virement · Carte bancaire · Lien de paiement', 48, py); py += 18;
  doc.fillColor(GOLD).fontSize(8.5).font('Helvetica-Bold').text('Conditions & notes', 48, py); py += 12;
  doc.fillColor(MUT).fontSize(8).font('Helvetica')
    .text(d.footNote ?? `TVA sur le transport de personnes : ${Math.round(vat * 100)} %. Document généré électroniquement — valable sans signature.`,
      48, py, { width: 250 });

  waveFooter(doc, title === 'DEVIS' ? 'Merci pour votre demande' : 'Merci de votre confiance');
  return renderToBuffer(doc);
}
