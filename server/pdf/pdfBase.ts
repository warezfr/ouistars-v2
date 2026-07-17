import PDFDocument from 'pdfkit';

const GOLD = '#c9a227';
const GOLD_DEEP = '#a17e2f';
const NIGHT = '#14161c';
const INK = '#1a1a1a';
const MUT = '#666666';
const PAPER = '#f4f4f6';

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

/** Logo du site (PNG) chargé depuis le déploiement — null si injoignable. */
export async function fetchLogo(): Promise<Buffer | null> {
  const base = (process.env.PUBLIC_SITE_URL ?? 'https://ouistars-v2.vercel.app').replace(/\/$/, '');
  try {
    const r = await fetch(`${base}/logo-ouistars.png`, { signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    return Buffer.from(await r.arrayBuffer());
  } catch {
    return null;
  }
}

export interface BrandContact {
  phone: string;
  email: string;
  site: string;
}

export const DEFAULT_CONTACT: BrandContact = {
  phone: '+33 6 51 03 03 06',
  email: 'info@ouistars.com',
  site: 'ouistars.com',
};

/**
 * Bandeau d'en-tête sombre façon template : logo + marque à gauche,
 * contacts à droite. Retourne la position Y sous le bandeau.
 */
export function bandHeader(doc: PDFKit.PDFDocument, logo: Buffer | null, contact: BrandContact = DEFAULT_CONTACT): number {
  doc.save();
  doc.rect(0, 0, 595, 88).fill(NIGHT);
  if (logo) {
    try { doc.image(logo, 40, 20, { height: 48 }); } catch { /* repli texte */ }
    doc.fillColor('#ffffff').fontSize(17).font('Helvetica-Bold').text('OUI', 98, 30, { continued: true })
      .fillColor(GOLD).text('STARS');
    doc.fillColor('#9aa0aa').fontSize(6.6).font('Helvetica')
      .text('PREMIUM MOBILITY • DESTINATION MANAGEMENT', 98, 52);
  } else {
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('OUI', 40, 30, { continued: true })
      .fillColor(GOLD).text('STARS');
    doc.fillColor('#9aa0aa').fontSize(7).font('Helvetica')
      .text('PREMIUM MOBILITY • DESTINATION MANAGEMENT', 40, 56);
  }
  const cx = 350;
  doc.fillColor(GOLD).fontSize(7).font('Helvetica-Bold');
  doc.text('TÉLÉPHONE', cx, 24, { lineBreak: false });
  doc.text('E-MAIL', cx + 90, 24, { lineBreak: false });
  doc.text('SITE WEB', cx + 180, 24, { lineBreak: false });
  doc.fillColor('#e8e8ec').fontSize(7.5).font('Helvetica');
  doc.text(contact.phone, cx, 35, { lineBreak: false });
  doc.text(contact.email, cx + 90, 35, { lineBreak: false });
  doc.text(contact.site, cx + 180, 35, { lineBreak: false });
  doc.rect(0, 88, 595, 3).fill(GOLD);
  doc.restore();
  return 110;
}

/** Vague de pied de page (or + nuit) avec message — inspirée du template. */
export function waveFooter(doc: PDFKit.PDFDocument, message = 'Merci de votre confiance', sub = 'Oui Stars — Premium Chauffeur Service') {
  // Empêche pdfkit d'ajouter des pages : le pied se dessine sous la marge basse.
  doc.page.margins.bottom = 0;
  doc.save();
  doc.moveTo(0, 780).bezierCurveTo(160, 735, 380, 815, 595, 762)
    .lineTo(595, 842).lineTo(0, 842).closePath().fill(GOLD);
  doc.moveTo(0, 800).bezierCurveTo(200, 760, 400, 835, 595, 786)
    .lineTo(595, 842).lineTo(0, 842).closePath().fill(NIGHT);
  doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text(message, 48, 806);
  doc.fillColor('#9aa0aa').fontSize(7.5).font('Helvetica').text(sub, 48, 823);
  doc.restore();
}

/* ————— Primitives héritées (fiches internes) ————— */
export function header(doc: PDFKit.PDFDocument, title: string, subtitle: string) {
  doc.fillColor(INK).fontSize(22).font('Helvetica-Bold').text('OUI STARS', 48, 48);
  doc.fillColor(GOLD_DEEP).fontSize(9).font('Helvetica').text('PREMIUM MOBILITY • DESTINATION MANAGEMENT', 48, 74);
  doc.fillColor(INK).fontSize(16).font('Helvetica-Bold').text(title, 48, 108);
  doc.fillColor(MUT).fontSize(10).font('Helvetica').text(subtitle, 48, 130);
  doc.moveTo(48, 150).lineTo(547, 150).strokeColor(GOLD_DEEP).lineWidth(1).stroke();
  doc.moveDown(2);
}

export function field(doc: PDFKit.PDFDocument, label: string, value: string, y: number) {
  doc.fillColor(MUT).fontSize(8).font('Helvetica').text(label.toUpperCase(), 48, y);
  doc.fillColor(INK).fontSize(12).font('Helvetica-Bold').text(value || '—', 48, y + 12);
}

export function footer(doc: PDFKit.PDFDocument) {
  doc.page.margins.bottom = 0; // pas de saut de page pour le pied
  doc.fillColor(MUT).fontSize(8).font('Helvetica')
    .text('Oui Stars — 78 Av. des Champs-Élysées, 75008 Paris — info@ouistars.com — +33 6 51 03 03 06', 48, 790, { align: 'center', width: 499 });
}

export { GOLD, GOLD_DEEP, NIGHT, INK, MUT, PAPER };
