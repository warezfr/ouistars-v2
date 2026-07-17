import { newDoc, header, field, footer, renderToBuffer, INK, MUT } from './pdfBase.js';

export interface InvoiceData {
  number: string;          // FA-XXXXXX
  reference: string;       // réf. réservation
  date: string;            // date d'émission
  clientName: string;
  clientEmail?: string;
  route: string;
  serviceDate: string;
  vehicle: string;
  amount: number;          // TTC
  currency?: string;
}

/** TVA transport de personnes (France) : 10 %. */
const VAT_RATE = 0.10;

/** Facture client (PDF). */
export async function buildInvoice(d: InvoiceData): Promise<Buffer> {
  const doc = newDoc();
  header(doc, 'Facture', `${d.number} · ${d.date}`);

  let y = 175;
  field(doc, 'Client', d.clientName + (d.clientEmail ? ` — ${d.clientEmail}` : ''), y); y += 44;
  field(doc, 'Référence réservation', d.reference, y); y += 44;
  field(doc, 'Prestation', `Transport avec chauffeur — ${d.route}`, y); y += 44;
  field(doc, 'Date de la prestation', d.serviceDate, y); y += 44;
  field(doc, 'Véhicule', d.vehicle, y); y += 44;

  const ttc = d.amount;
  const ht = Math.round((ttc / (1 + VAT_RATE)) * 100) / 100;
  const tva = Math.round((ttc - ht) * 100) / 100;
  const cur = d.currency ?? '€';

  doc.moveTo(48, y + 8).lineTo(547, y + 8).strokeColor('#ddd').lineWidth(1).stroke();
  doc.fillColor(MUT).fontSize(10).font('Helvetica')
    .text(`Total HT : ${ht.toFixed(2)} ${cur}`, 48, y + 20)
    .text(`TVA (10 %) : ${tva.toFixed(2)} ${cur}`, 48, y + 36);
  doc.fillColor(INK).fontSize(20).font('Helvetica-Bold')
    .text(`Total TTC : ${ttc.toFixed(2)} ${cur}`, 48, y + 56);

  doc.fillColor(MUT).fontSize(8.5).font('Helvetica')
    .text('TVA sur le transport de personnes : 10 %. Facture acquittée sauf mention contraire.', 48, y + 92);

  footer(doc);
  return renderToBuffer(doc);
}
