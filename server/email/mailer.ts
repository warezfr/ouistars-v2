/**
 * Envoi d'e-mails via Resend. Non bloquant : renvoie false si non configuré
 * ou en échec, sans jamais faire échouer l'appelant.
 */
export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return false;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM ?? 'Oui Stars <bookings@ouistars.com>',
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        attachments: opts.attachments,
      }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export function opsEmail(): string | null {
  return process.env.OPS_NOTIFY_EMAIL ?? process.env.OPS_EMAIL ?? null;
}
