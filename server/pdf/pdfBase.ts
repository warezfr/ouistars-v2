import PDFDocument from 'pdfkit';

const GOLD = '#a17e2f';
const INK = '#1a1a1a';
const MUT = '#666666';

/** Collecte un PDFDocument en Buffer. */
export function renderToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

export function newDoc(): PDFKit.PDFDocument {
  return new PDFDocument({ size: 'A4', margin: 48 });
}

export function header(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.fillColor(INK).fontSize(22).font('Helvetica-Bold').text('OUI STARS', 48, 48);
  doc.fillColor(GOLD).fontSize(9).font('Helvetica').text('PREMIUM MOBILITY • DESTINATION MANAGEMENT', 48, 74);
  doc.fillColor(INK).fontSize(16).font('Helvetica-Bold').text(title, 48, 108);
  doc.fillColor(MUT).fontSize(10).font('Helvetica').text(subtitle, 48, 130);
  doc.moveTo(48, 150).lineTo(547, 150).strokeColor(GOLD).lineWidth(1).stroke();
  doc.moveDown(2);
}

export function field(doc: PDFKit.PDFDocument, label: string, value: string, y: number) {
  doc.fillColor(MUT).fontSize(8).font('Helvetica').text(label.toUpperCase(), 48, y);
  doc.fillColor(INK).fontSize(12).font('Helvetica-Bold').text(value || '—', 48, y + 12);
}

export function footer(doc: PDFKit.PDFDocument) {
  doc.fillColor(MUT).fontSize(8).font('Helvetica')
    .text('Oui Stars — 78 Av. des Champs-Élysées, 75008 Paris — info@ouistars.com — +33 6 51 03 03 06', 48, 790, { align: 'center', width: 499 });
}

export { GOLD, INK, MUT };
