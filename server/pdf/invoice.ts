import {
  newDoc, bandHeader, waveFooter, titleBlock, renderToBuffer, micro, hr, eur, pdfSafe, watermark,
  GOLD, NIGHT, INK, MUT, HAIR, type BrandContact, DEFAULT_CONTACT,
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

const NICE_TITLES: Record<string, string> = {
  'FACTURE': 'Facture', 'DEVIS': 'Devis', 'BON DE COMMANDE': 'Bon de commande',
};

/** Facture / devis / bon de commande — papier de maison noir & or, Cormorant. */
export async function buildInvoice(d: InvoiceData): Promise<Buffer> {
  const doc = newDoc();
  const vat = d.vatRate ?? 0.10;
  const rawTitle = d.title ?? 'FACTURE';
  const title = NICE_TITLES[rawTitle] ?? rawTitle;
  const isQuote = rawTitle === 'DEVIS';

  let y = bandHeader(doc, d.logo ?? null, d.contact ?? DEFAULT_CONTACT);
  watermark(doc, d.logo ?? null);

  // ————— Titre + méta —————
  y = titleBlock(doc, title, [
    ['N° document', d.number],
    ['Date', d.date],
    ['Référence', d.reference],
  ], y + 6);

  // ————— Client —————
  y += 10;
  micro(doc, "À l'attention de", 48, y);
  doc.fillColor(INK).font('Display').fontSize(17).text(pdfSafe(d.clientName), 48, y + 10, { width: 300 });
  let cy = doc.y + 2;
  doc.fillColor(MUT).fontSize(8).font('Helvetica');
  if (d.clientPhone) { doc.text(d.clientPhone, 48, cy); cy += 11; }
  if (d.clientEmail) { doc.text(d.clientEmail, 48, cy); cy += 11; }

  // ————— Tableau des prestations —————
  y = cy + 18;
  const L = 48, R = 547;
  const cols = { unit: 350, qty: 445, total: 480 };

  hr(doc, L, R, y, GOLD, 1.1);
  micro(doc, 'Prestation', L, y + 8, { color: MUT });
  micro(doc, 'Prix unit.', cols.unit - 60, y + 8, { color: MUT, width: 120, align: 'right' });
  micro(doc, 'Qté', cols.qty - 40, y + 8, { color: MUT, width: 60, align: 'right' });
  micro(doc, 'Montant', cols.total, y + 8, { color: MUT, width: R - cols.total, align: 'right' });
  hr(doc, L, R, y + 21, HAIR);
  y += 21;

  let subtotal = 0;
  d.lines.forEach((l) => {
    const label = pdfSafe(l.label);
    const sub = l.sub ? pdfSafe(l.sub) : undefined;
    doc.font('Display').fontSize(12.5);
    const labelH = doc.heightOfString(label, { width: 285 });
    doc.font('Helvetica').fontSize(7.5);
    const subH = sub ? doc.heightOfString(sub, { width: 285 }) : 0;
    const rowH = Math.max(30, 9 + labelH + (sub ? subH + 3 : 0) + 9);

    doc.fillColor(INK).font('Display').fontSize(12.5).text(label, L, y + 8, { width: 285 });
    if (sub) doc.fillColor(MUT).font('Helvetica').fontSize(7.5).text(sub, L, y + 8 + labelH + 3, { width: 285 });

    const lineTotal = l.qty * l.unit;
    subtotal += lineTotal;
    doc.fillColor(MUT).font('Helvetica').fontSize(9);
    doc.text(eur(l.unit), cols.unit - 60, y + 11, { width: 120, align: 'right' });
    doc.text(String(l.qty), cols.qty - 40, y + 11, { width: 60, align: 'right' });
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.2)
      .text(eur(lineTotal), cols.total, y + 11, { width: R - cols.total, align: 'right' });

    y += rowH;
    hr(doc, L, R, y, HAIR);
  });

  // ————— Règlement & conditions (gauche) / Totaux (droite) —————
  const ttc = subtotal;
  const ht = ttc / (1 + vat);
  const tva = ttc - ht;

  let py = y + 18;
  micro(doc, 'Règlement', L, py);
  doc.fillColor(INK).fontSize(8.2).font('Helvetica')
    .text('Virement  ·  Carte bancaire  ·  Lien de paiement', L, py + 10);
  py += 32;
  micro(doc, 'Conditions & notes', L, py);
  doc.fillColor(MUT).fontSize(7.6).font('Helvetica')
    .text(pdfSafe(d.footNote ?? `TVA sur le transport de personnes : ${Math.round(vat * 100)} %. Document généré électroniquement — valable sans signature.`),
      L, py + 10, { width: 252, lineGap: 1.5 });

  let ty = y + 16;
  const totalRow = (label: string, value: string) => {
    doc.fillColor(MUT).fontSize(8.4).font('Helvetica').text(label, 340, ty, { width: 120, align: 'right' });
    doc.fillColor(INK).fontSize(8.8).font('Helvetica-Bold').text(value, 465, ty, { width: 82, align: 'right' });
    ty += 16;
  };
  totalRow('Sous-total HT', eur(ht));
  totalRow(`TVA (${Math.round(vat * 100)} %)`, eur(tva));
  ty += 5;

  // Total — cartouche nuit, montant Cormorant
  doc.rect(320, ty, 227, 38).fill(NIGHT);
  doc.rect(320, ty, 2.4, 38).fill(GOLD);
  micro(doc, isQuote ? 'Estimation TTC' : 'Total TTC', 334, ty + 15, { color: GOLD, size: 7 });
  doc.fillColor('#ffffff').font('Display-Bold').fontSize(17)
    .text(eur(ttc), 400, ty + 9, { width: 137, align: 'right' });

  waveFooter(doc, isQuote ? 'Merci pour votre demande' : 'Merci de votre confiance');
  return renderToBuffer(doc);
}
