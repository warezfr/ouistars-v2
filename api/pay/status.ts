import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPayment, setPaymentStatus } from '../../server/payments/store.js';
import { capturePaypalOrder } from '../../server/payments/index.js';

/**
 * Statut d'un paiement (page de retour du client).
 * GET /api/pay/status?ref=PAY-…            → { status, amount_cents, currency, method }
 *
 * Cas PayPal : au retour, l'ordre est APPROVED mais pas encore capturé.
 * Si ?token=<orderId>&provider=paypal est présent, on capture puis on met à jour.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ref = String(req.query.ref ?? '');
  if (!ref) return res.status(400).json({ error: 'ref requis' });

  // Capture PayPal au retour (le webhook confirmera aussi côté serveur).
  const token = req.query.token ? String(req.query.token) : '';
  if (req.query.provider === 'paypal' && token && !req.query.cancel) {
    try {
      const cap = await capturePaypalOrder(token);
      if (cap.ok && cap.reference) await setPaymentStatus(cap.reference, 'paid', token);
    } catch { /* le webhook rattrapera */ }
  }
  if (req.query.provider === 'paypal' && req.query.cancel) {
    await setPaymentStatus(ref, 'cancelled').catch(() => {});
  }

  const p = await getPayment(ref);
  if (!p) return res.status(404).json({ error: 'Paiement introuvable' });
  return res.status(200).json({
    reference: p.reference, status: p.status,
    amount_cents: p.amount_cents, currency: p.currency, method: p.method,
  });
}
