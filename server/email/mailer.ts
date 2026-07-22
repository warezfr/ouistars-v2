/**
 * Envoi d'e-mails transactionnels — deux canaux possibles, dans l'ordre :
 *   1. SMTP (nodemailer) si SMTP_HOST est défini — permet d'utiliser un serveur
 *      mail classique (Zoho, GoDaddy, etc.).
 *      ⚠ Rappel plateforme : GoDaddy Node.js Hosting n'autorise que les ports
 *      sortants 80/443. Un SMTP sur 465/587/25 y sera bloqué au runtime. Le
 *      diagnostic /api/email/test permet de vérifier si le port passe.
 *   2. Resend (API HTTPS) si RESEND_API_KEY est défini — fonctionne partout,
 *      y compris derrière la restriction de ports.
 *
 * Non bloquant : renvoie false si non configuré ou en échec, sans jamais faire
 * échouer l'appelant.
 */
import nodemailer, { type Transporter } from 'nodemailer';

export interface MailAttachment {
  filename: string;
  /** Contenu encodé en base64. */
  content: string;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: MailAttachment[];
}

function mailFrom(): string {
  return process.env.MAIL_FROM ?? process.env.RESEND_FROM ?? 'Oui Stars <bookings@ouistars.com>';
}

/* ————————————————————————— SMTP (nodemailer) ————————————————————————— */

let transporter: Transporter | null = null;

/** Configuration SMTP présente ? */
export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (!smtpConfigured()) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT ?? 587);
  // secure=true pour le port 465 (SSL implicite) ; STARTTLS sinon.
  const secure = (process.env.SMTP_SECURE ?? (port === 465 ? 'true' : 'false')) === 'true';
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
  });
  return transporter;
}

/** Teste la connexion SMTP (sans envoyer). Utilisé par /api/email/test. */
export async function verifySmtp(): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: 'SMTP non configuré (SMTP_HOST/SMTP_USER/SMTP_PASS).' };
  try {
    await t.verify();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function sendViaSmtp(opts: MailOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  await t.sendMail({
    from: mailFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments?.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content, 'base64'),
    })),
  });
  return true;
}

/* ———————————————————— Zoho ZeptoMail (API HTTPS) ————————————————————
   Canal transactionnel de Zoho — passe le blocage de ports GoDaddy (443).
   Variables : ZEPTO_API_KEY (jeton « Send Mail token » de l'agent ZeptoMail),
   ZEPTO_HOST facultatif (api.zeptomail.eu par défaut — datacenter européen). */

export function zeptoConfigured(): boolean {
  return Boolean(process.env.ZEPTO_API_KEY);
}

function parseFrom(): { address: string; name: string } {
  const raw = mailFrom();
  const m = /^(.*)<([^>]+)>\s*$/.exec(raw);
  if (m) return { name: m[1].trim().replace(/^"|"$/g, '') || 'Oui Stars', address: m[2].trim() };
  return { name: 'Oui Stars', address: raw.trim() };
}

async function sendViaZepto(opts: MailOptions): Promise<boolean> {
  const key = process.env.ZEPTO_API_KEY;
  if (!key) return false;
  const host = (process.env.ZEPTO_HOST ?? 'api.zeptomail.eu').replace(/^https?:\/\//, '');
  const from = parseFrom();
  const r = await fetch(`https://${host}/v1.1/email`, {
    method: 'POST',
    headers: {
      Authorization: key.startsWith('Zoho-enczapikey') ? key : `Zoho-enczapikey ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { address: from.address, name: from.name },
      to: [{ email_address: { address: opts.to } }],
      subject: opts.subject,
      htmlbody: opts.html,
      attachments: opts.attachments?.map((a) => ({
        name: a.filename, content: a.content,
        mime_type: a.filename.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
      })),
    }),
  });
  if (!r.ok) console.error('[mail] ZeptoMail:', r.status, (await r.text().catch(() => '')).slice(0, 300));
  return r.ok;
}

/* ————————————————————————— Resend (HTTPS) ————————————————————————— */

async function sendViaResend(opts: MailOptions): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: mailFrom(),
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      attachments: opts.attachments,
    }),
  });
  return r.ok;
}

/* ————————————————————————— API publique ————————————————————————— */

export async function sendMail(opts: MailOptions): Promise<boolean> {
  if (!opts.to) return false;
  try {
    // Ordre : ZeptoMail (HTTPS, passe partout) → SMTP → Resend.
    if (zeptoConfigured()) {
      try { if (await sendViaZepto(opts)) return true; }
      catch (e) { console.error('[mail] ZeptoMail échec:', (e as Error).message); }
    }
    if (smtpConfigured()) {
      try { if (await sendViaSmtp(opts)) return true; }
      catch (e) { console.error('[mail] SMTP échec:', (e as Error).message); }
    }
    return await sendViaResend(opts);
  } catch (e) {
    console.error('[mail] envoi impossible:', (e as Error).message);
    return false;
  }
}

export function mailConfigured(): boolean {
  return zeptoConfigured() || smtpConfigured() || Boolean(process.env.RESEND_API_KEY);
}

export function opsEmail(): string | null {
  return process.env.OPS_NOTIFY_EMAIL ?? process.env.OPS_EMAIL ?? null;
}
