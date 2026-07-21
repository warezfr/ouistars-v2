import PDFDocument from 'pdfkit';
import { MR_MED, MR_SEMI, MR_XBOLD } from './fonts.js';

/**
 * Socle graphique des documents Oui Stars — papier clair, ondulations dorées
 * soulignées de traits noirs, typographie professionnelle Manrope (embarquée).
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
  doc.registerFont('Brand', MR_MED);        // 500 — corps
  doc.registerFont('Brand-Semi', MR_SEMI);  // 600 — valeurs, libellés
  doc.registerFont('Brand-Bold', MR_XBOLD); // 800 — titres, montants
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

/** Montant au format français : 1 440,00 € (séparateur de milliers en espace simple —
    les espaces typographiques U+202F/U+00A0 ne sont pas couvertes par la police embarquée). */
export function eur(n: number): string {
  const s = n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${s} €`.replace(/[\s  ]/g, ' ');
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
  doc.fillColor(opts.color ?? GOLD_DEEP).fontSize(opts.size ?? 6.4).font('Brand-Bold')
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
 * Papier à en-tête clair : ondulation dorée en tête (soulignée de traits noirs),
 * logo + marque à gauche, contacts empilés à droite. Retourne le Y sous l'en-tête.
 */
export function bandHeader(doc: PDFKit.PDFDocument, logo: Buffer | null, contact: BrandContact = DEFAULT_CONTACT): number {
  doc.save();

  // Ondulation dorée — bord inférieur en vague
  doc.moveTo(0, 0).lineTo(595, 0).lineTo(595, 26)
    .bezierCurveTo(430, 56, 180, 2, 0, 44)
    .closePath().fill(GOLD);
  // Traits noirs suivant l'ondulation
  doc.moveTo(0, 50).bezierCurveTo(180, 8, 430, 62, 595, 32)
    .strokeColor(NIGHT).lineWidth(1.4).stroke();
  doc.moveTo(0, 57).bezierCurveTo(180, 15, 430, 69, 595, 39)
    .strokeColor(GOLD_DEEP).lineWidth(0.8).stroke();

  // Marque — logo + wordmark sur fond blanc
  let bx = 44;
  const by = 76;
  if (logo) {
    try { doc.image(logo, 44, by - 4, { height: 46 }); bx = 102; } catch { /* repli texte */ }
  }
  doc.font('Brand-Bold').fontSize(17);
  doc.fillColor(INK).text('OUI', bx, by + 2, { characterSpacing: 2.6, continued: true });
  doc.fillColor(GOLD_DEEP).text('STARS', { characterSpacing: 2.6 });
  doc.fillColor(MUT).fontSize(5.8).font('Brand-Bold')
    .text('PREMIUM MOBILITY  ·  DESTINATION MANAGEMENT', bx + 1, by + 26, { characterSpacing: 1.7 });

  // Contacts — trois lignes empilées, alignées à droite
  const rx = 547;
  const row = (label: string, value: string, y: number) => {
    doc.fillColor(GOLD_DEEP).fontSize(5.6).font('Brand-Bold')
      .text(label, 330, y + 1.5, { width: 80, align: 'right', characterSpacing: 1.4 });
    doc.fillColor(INK).fontSize(7.8).font('Brand-Semi')
      .text(value, 418, y, { width: rx - 418, align: 'right' });
  };
  row('TÉLÉPHONE', contact.phone, by);
  row('E-MAIL', contact.email, by + 15);
  row('SITE', contact.site, by + 30);

  // filet de clôture de l'en-tête
  hr(doc, 48, 547, by + 52, HAIR);
  doc.restore();
  return by + 66;
}

/**
 * Pied de page : ondulation dorée montante soulignée de traits noirs,
 * remerciement en noir sur l'or, coordonnées à droite.
 */
export function waveFooter(
  doc: PDFKit.PDFDocument,
  message = 'Merci de votre confiance',
  sub = 'Oui Stars — Premium Chauffeur Service  ·  ouistars.com',
) {
  doc.page.margins.bottom = 0; // pas de saut de page pour le pied
  doc.save();

  // Traits noirs au-dessus de la vague
  doc.moveTo(0, 786).bezierCurveTo(180, 750, 420, 806, 595, 764)
    .strokeColor(NIGHT).lineWidth(1.4).stroke();
  doc.moveTo(0, 793).bezierCurveTo(180, 757, 420, 813, 595, 771)
    .strokeColor(GOLD_DEEP).lineWidth(0.8).stroke();
  // Vague dorée
  doc.moveTo(0, 800).bezierCurveTo(180, 764, 420, 820, 595, 778)
    .lineTo(595, 842).lineTo(0, 842).closePath().fill(GOLD);

  // Message + signature — en noir sur l'or
  doc.fillColor(NIGHT).font('Brand-Bold').fontSize(11.5).text(message, 48, 812);
  doc.fillColor('#3d3418').fontSize(6.6).font('Brand-Semi').text(sub, 48, 828);
  doc.fillColor(NIGHT).fontSize(6.6).font('Brand-Bold')
    .text('OUISTARS.COM', 380, 822, { width: 167, align: 'right', characterSpacing: 1.8 });
  doc.restore();
}

/**
 * Zone de titre commune : titre lettré à gauche, méta empilées à droite.
 * Retourne le Y sous la zone.
 */
export function titleBlock(
  doc: PDFKit.PDFDocument, title: string, meta: [string, string][], y: number,
): number {
  // Titre — capitales espacées, taille auto-ajustée pour tenir sur 330 pt
  const t = title.toUpperCase();
  let size = 25;
  doc.font('Brand-Bold');
  while (size > 13 && doc.fontSize(size).widthOfString(t, { characterSpacing: 2.5 }) > 330) size -= 1;
  doc.fillColor(INK).fontSize(size).text(t, 48, y, { characterSpacing: 2.5, lineBreak: false });
  const titleBottom = y + size + 10;
  doc.rect(48, titleBottom, 44, 2.4).fill(GOLD);

  // Méta — label micro + valeur, alignés à droite
  let my = y - 2;
  for (const [k, v] of meta) {
    doc.fillColor(MUT).fontSize(6).font('Brand-Bold')
      .text(k.toUpperCase(), 320, my + 2, { width: 115, align: 'right', characterSpacing: 1.2 });
    doc.fillColor(INK).font('Brand-Semi').fontSize(9.2)
      .text(v, 442, my, { width: 105, align: 'right' });
    my += 17;
  }
  return Math.max(titleBottom + 16, my + 8);
}

export { GOLD, GOLD_DEEP, NIGHT, INK, MUT, PAPER, HAIR };
