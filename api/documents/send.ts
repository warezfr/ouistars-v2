import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sendMail, mailConfigured } from '../../server/email/mailer.js';
import { requireAdmin } from '../../server/auth/requireAdmin.js';

/**
 * Envoie un document PDF (facture, devis, bon, fiche mission) par e-mail au client.
 * POST { reference, type, to, message? }
 * Nécessite un canal e-mail (SMTP ou RESEND_API_KEY) ; renvoie 501 sinon
 * (le front propose alors mailto/WhatsApp).
 * Le PDF est généré via la même mécanique que /api/documents/generate.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  // Envoi d'un document client à une adresse arbitraire → réservé au back-office.
  if (!(await requireAdmin(req, res))) return;
  const { reference, type, to, message } = (req.body ?? {}) as {
    reference?: string; type?: string; to?: string; message?: string;
  };
  if (!reference || !type || !to) return res.status(400).json({ error: 'reference, type et to requis' });

  if (!mailConfigured()) {
    return res.status(501).json({ error: 'Envoi e-mail non configuré (ni SMTP_* ni RESEND_API_KEY).' });
  }

  // Génère le PDF en réutilisant le handler generate (import dynamique du module).
  const { default: generate } = await import('./generate.js');
  let pdfBuffer: Buffer | null = null;
  const fakeRes = {
    setHeader: () => fakeRes,
    status: (code: number) => ({
      json: (b: unknown) => { if (code >= 400) throw new Error(JSON.stringify(b)); return b; },
      send: (b: Buffer) => { pdfBuffer = b; return b; },
    }),
  } as unknown as VercelResponse;
  try {
    // On propage l'en-tête d'auth pour que le contrôle interne de generate passe.
    await generate({
      method: 'POST', body: { reference, type }, headers: { authorization: req.headers.authorization },
    } as unknown as VercelRequest, fakeRes);
  } catch (e) {
    return res.status(500).json({ error: `Génération PDF impossible : ${(e as Error).message}` });
  }
  if (!pdfBuffer) return res.status(500).json({ error: 'PDF vide' });

  const NAMES: Record<string, string> = {
    invoice: 'Facture', quote: 'Devis', purchase_order: 'Bon de commande', mission_sheet: 'Fiche de mission',
  };
  const label = NAMES[type] ?? 'Document';

  const html = `<p>Bonjour,</p><p>${message ?? `Veuillez trouver ci-joint votre ${label.toLowerCase()} <strong>${reference}</strong>.`}</p><p>Bien cordialement,<br/>Oui Stars — Premium Chauffeur Service</p>`;
  const ok = await sendMail({
    to,
    subject: `${label} ${reference} — Oui Stars`,
    html,
    attachments: [{ filename: `${type}-${reference}.pdf`, content: (pdfBuffer as Buffer).toString('base64') }],
  });
  if (!ok) {
    return res.status(502).json({ error: 'Envoi e-mail échoué (SMTP/Resend). Vérifiez la configuration.' });
  }
  return res.status(200).json({ sent: true, to });
}
