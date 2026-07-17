import { newDoc, header, field, footer, renderToBuffer, INK, MUT } from './pdfBase.js';

export interface PurchaseOrderData {
  reference: string;
  clientName: string;
  route: string;
  date: string;
  vehicle: string;
  amount: number;
  currency?: string;
  driverName?: string;
}

/** Bon de commande (PDF nominatif au nom du client — consigne). */
export async function buildPurchaseOrder(d: PurchaseOrderData): Promise<Buffer> {
  const doc = newDoc();
  header(doc, 'Bon de Commande', `Réf. ${d.reference} · ${d.clientName}`);

  let y = 175;
  field(doc, 'Client', d.clientName, y); y += 44;
  field(doc, 'Trajet', d.route, y); y += 44;
  field(doc, 'Date', d.date, y); y += 44;
  field(doc, 'Véhicule', d.vehicle, y); y += 44;
  if (d.driverName) { field(doc, 'Chauffeur assigné', d.driverName, y); y += 44; }

  doc.moveTo(48, y + 8).lineTo(547, y + 8).strokeColor('#ddd').lineWidth(1).stroke();
  doc.fillColor(MUT).fontSize(10).font('Helvetica').text('Total TTC', 48, y + 20);
  doc.fillColor(INK).fontSize(20).font('Helvetica-Bold')
    .text(`${d.amount} ${d.currency ?? '€'}`, 48, y + 34);

  footer(doc);
  return renderToBuffer(doc);
}
