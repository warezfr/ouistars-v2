import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifySmtp, sendMail, smtpConfigured, mailConfigured, zeptoConfigured } from '../../server/email/mailer.js';

/**
 * Diagnostic e-mail — vérifie la connexion SMTP et (optionnellement) envoie un
 * message de test. Protégé par la clé EMAIL_TEST_KEY (header x-email-key ou
 * body.key) : l'endpoint est inactif tant que cette variable n'est pas définie.
 *
 * POST /api/email/test  { to?: string, key: string }
 *   → { smtpConfigured, mailConfigured, verify:{ok,error?}, sent? }
 *
 * Sert surtout à savoir si GoDaddy laisse sortir le port SMTP : si verify.ok
 * est false avec un timeout, c'est que la plateforme bloque le port.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const expected = process.env.EMAIL_TEST_KEY;
  if (!expected) return res.status(503).json({ error: 'Diagnostic désactivé (EMAIL_TEST_KEY non défini).' });

  const provided = (req.headers['x-email-key'] as string | undefined)
    ?? (req.body?.key as string | undefined);
  if (provided !== expected) return res.status(401).json({ error: 'Clé de diagnostic invalide.' });

  const verify = await verifySmtp();
  const out: Record<string, unknown> = {
    smtpConfigured: smtpConfigured(),
    zeptoConfigured: zeptoConfigured(),
    mailConfigured: mailConfigured(),
    verify,
  };

  const to = req.body?.to as string | undefined;
  if (to) {
    const sent = await sendMail({
      to,
      subject: 'Test e-mail — Oui Stars',
      html: '<p>Ceci est un e-mail de test envoyé depuis le serveur Oui Stars. Si vous le recevez, l\'envoi fonctionne. ✅</p>',
    });
    out.sent = sent;
  }

  return res.status(200).json(out);
}
