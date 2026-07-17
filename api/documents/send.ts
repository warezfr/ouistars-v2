import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Envoie un document PDF (facture, devis, bon, fiche mission) par e-mail au client.
 * POST { reference, type, to, message? }
 * Nécessite RESEND_API_KEY ; renvoie 501 sinon (le front propose alors mailto/WhatsApp).
 * Le PDF est généré via la même mécanique que /api/documents/generate.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { reference, type, to, message } = (req.body ?? {}) as {
    reference?: string; type?: string; to?: string; message?: string;
  };
  if (!reference || !type || !to) return res.status(400).json({ error: 'reference, type et to requis' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return res.status(501).json({ error: 'Envoi e-mail non configuré (RESEND_API_KEY manquant sur Vercel).' });
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
    await generate({ method: 'POST', body: { reference, type } } as unknown as VercelRequest, fakeRes);
  } catch (e) {
    return res.status(500).json({ error: `Génération PDF impossible : ${(e as Error).message}` });
  }
  if (!pdfBuffer) return res.status(500).json({ error: 'PDF vide' });

  const NAMES: Record<string, string> = {
    invoice: 'Facture', quote: 'Devis', purchase_order: 'Bon de commande', mission_sheet: 'Fiche de mission',
  };
  const label = NAMES[type] ?? 'Document';

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM ?? 'Oui Stars <bookings@ouistars.com>',
      to: [to],
      subject: `${label} ${reference} — Oui Stars`,
      html: `<p>Bonjour,</p><p>${message ?? `Veuillez trouver ci-joint votre ${label.toLowerCase()} <strong>${reference}</strong>.`}</p><p>Bien cordialement,<br/>Oui Stars — Premium Chauffeur Service</p>`,
      attachments: [{ filename: `${type}-${reference}.pdf`, content: (pdfBuffer as Buffer).toString('base64') }],
    }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => r.statusText);
    return res.status(502).json({ error: `Resend : ${t.slice(0, 200)}` });
  }
  return res.status(200).json({ sent: true, to });
}
