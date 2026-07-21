import PDFDocument from 'pdfkit';
import { CG_MED, CG_SEMI, CG_BOLD, CG_ITALIC } from './fonts.js';

/**
 * Socle graphique des documents Oui Stars — « papier de maison » noir & or.
 * Typographie : Cormorant Garamond (display, embarquée) + Helvetica (labels/corps).
 * Composition : bandeau nuit, filets or, pied éditorial — cohérente avec le site.
 */

const GOLD = '#c9a24b';
const GOLD_DEEP = '#a17e2f';
const NIGHT = '#101218';
const INK = '#191b21';
const MUT = '#6d7078';
const PAPER = '#f7f5ef';   // fonds discrets (chips, cellules)
const HAIR = '#e4dfd2';    // filets crème

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
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.registerFont('Display', CG_SEMI);
  doc.registerFont('Display-Med', CG_MED);
  doc.registerFont('Display-Bold', CG_BOLD);
  doc.registerFont('Display-Italic', CG_ITALIC);
  return doc;
}

/** Remplace les glyphes absents des polices PDF (flèches…) par des équivalents sûrs. */
export function pdfSafe(s: string): string {
  return (s ?? '').replace(/\s*[→⟶↦]\s*/g, '  –  ').replace(/\s*[⇄↔⇌]\s*/g, '  ·  ');
}

/** Filigrane emblème très discret au centre de la page (habillage des pages courtes). */
export function watermark(doc: PDFKit.PDFDocument, logo: Buffer | null) {
  if (!logo) return;
  try {
    doc.save();
    doc.opacity(0.033);
    doc.image(logo, 197, 440, { width: 200 });
    doc.opacity(1);
    doc.restore();
  } catch { /* sans filigrane */ }
}

/** Montant au format français : 1 440,00 € (espace fine insécable). */
export function eur(n: number): string {
  const s = n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${s} €`.replace(/ /g, ' ');
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

/** Micro-label lettré (petites capitales espacées) — la signature éditoriale. */
export function micro(
  doc: PDFKit.PDFDocument, text: string, x: number, y: number,
  opts: { color?: string; size?: number; width?: number; align?: 'left' | 'right' | 'center' } = {},
) {
  doc.fillColor(opts.color ?? GOLD_DEEP).fontSize(opts.size ?? 6.6).font('Helvetica-Bold')
    .text(text.toUpperCase(), x, y, {
      characterSpacing: 1.6, lineBreak: false,
      ...(opts.width ? { width: opts.width, align: opts.align ?? 'left', lineBreak: true } : {}),
    });
}

/** Filet horizontal. */
export function hr(doc: PDFKit.PDFDocument, x1: number, x2: number, y: number, color = HAIR, w = 0.8) {
  doc.moveTo(x1, y).lineTo(x2, y).strokeColor(color).lineWidth(w).stroke();
}

/**
 * Papier à en-tête : bandeau nuit (logo + marque, contacts empilés à droite),
 * double filet or. Retourne la position Y sous le bandeau.
 */
export function bandHeader(doc: PDFKit.PDFDocument, logo: Buffer | null, contact: BrandContact = DEFAULT_CONTACT): number {
  doc.save();
  doc.rect(0, 0, 595, 96).fill(NIGHT);

  // Marque — logo + wordmark Cormorant espacé + devise
  let bx = 44;
  if (logo) {
    try { doc.image(logo, 44, 22, { height: 52 }); bx = 108; } catch { /* repli texte */ }
  }
  doc.font('Display-Bold').fontSize(21);
  doc.fillColor('#ffffff').text('OUI', bx, 28, { characterSpacing: 2.4, continued: true });
  doc.fillColor(GOLD).text('STARS', { characterSpacing: 2.4 });
  doc.fillColor('#8b8f99').fontSize(6.2).font('Helvetica-Bold')
    .text('PREMIUM MOBILITY  ·  DESTINATION MANAGEMENT', bx + 1, 58, { characterSpacing: 1.7 });

  // Contacts — trois lignes empilées, alignées à droite
  const rx = 547;
  const row = (label: string, value: string, y: number) => {
    doc.fillColor(GOLD).fontSize(5.8).font('Helvetica-Bold')
      .text(label, 330, y + 1.5, { width: 80, align: 'right', characterSpacing: 1.4 });
    doc.fillColor('#e9e7e0').fontSize(8).font('Helvetica')
      .text(value, 418, y, { width: rx - 418, align: 'right' });
  };
  row('TÉLÉPHONE', contact.phone, 26);
  row('E-MAIL', contact.email, 44);
  row('SITE', contact.site, 62);

  // Double filet or : trait fin + trait fort
  doc.rect(0, 96, 595, 2.2).fill(GOLD);
  doc.rect(0, 101.4, 595, 0.7).fill(GOLD_DEEP);
  doc.restore();
  return 122;
}

/**
 * Pied éditorial : filet or, remerciement en italique Cormorant centré,
 * ligne légale, ruban nuit en base de page.
 */
export function waveFooter(
  doc: PDFKit.PDFDocument,
  message = 'Merci de votre confiance',
  sub = 'Oui Stars — Premium Chauffeur Service',
) {
  doc.page.margins.bottom = 0; // pas de saut de page pour le pied
  doc.save();
  // filet or centré
  doc.moveTo(258, 764).lineTo(337, 764).strokeColor(GOLD).lineWidth(1).stroke();
  doc.circle(297.5, 764, 2.2).fill(GOLD);
  // remerciement en italique
  doc.fillColor(INK).font('Display-Italic').fontSize(16)
    .text(message, 48, 774, { width: 499, align: 'center' });
  doc.fillColor(MUT).fontSize(6.8).font('Helvetica')
    .text(sub, 48, 796, { width: 499, align: 'center', characterSpacing: 0.4 });
  // ruban nuit
  doc.rect(0, 816, 595, 26).fill(NIGHT);
  doc.rect(0, 816, 595, 1.2).fill(GOLD);
  doc.fillColor(GOLD).fontSize(6).font('Helvetica-Bold')
    .text('OUI STARS  ·  PREMIUM MOBILITY  ·  OUISTARS.COM', 48, 826, {
      width: 499, align: 'center', characterSpacing: 2.2,
    });
  doc.restore();
}

/**
 * Zone de titre commune : titre Cormorant à gauche (taille auto-ajustée),
 * méta empilées à droite. Retourne le Y sous la zone.
 */
export function titleBlock(
  doc: PDFKit.PDFDocument, title: string, meta: [string, string][], y: number,
): number {
  // Titre — Cormorant Bold, ajusté pour tenir sur 330 pt
  let size = 40;
  doc.font('Display-Bold');
  while (size > 22 && doc.fontSize(size).widthOfString(title) > 330) size -= 2;
  doc.fillColor(INK).fontSize(size).text(title, 48, y, { lineBreak: false });
  const titleBottom = y + size + 8;
  doc.rect(48, titleBottom, 44, 2).fill(GOLD);

  // Méta — label micro + valeur, alignés à droite
  let my = y + 6;
  for (const [k, v] of meta) {
    doc.fillColor(MUT).fontSize(6.2).font('Helvetica-Bold')
      .text(k.toUpperCase(), 330, my + 2, { width: 105, align: 'right', characterSpacing: 1.2 });
    doc.fillColor(INK).font('Display').fontSize(11.5)
      .text(v, 442, my, { width: 105, align: 'right' });
    my += 19;
  }
  return Math.max(titleBottom + 14, my + 8);
}

export { GOLD, GOLD_DEEP, NIGHT, INK, MUT, PAPER, HAIR };
