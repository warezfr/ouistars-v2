import type { VercelRequest, VercelResponse } from '@vercel/node';
import { gatewayFor } from '../../server/payments/index.js';
import { setPaymentStatus } from '../../server/payments/store.js';
import type { PaymentProvider, WebhookRequest } from '../../server/payments/types.js';

/**
 * Réception des notifications fournisseurs (IPN / webhooks).
 * POST/GET /api/pay/webhook?provider=systempay|paypal|sumup|bank
 * Chaque passerelle vérifie l'authenticité (signature) avant toute mise à jour.
 * L'état des paiements n'est JAMAIS modifié ailleurs qu'ici (ou par l'admin).
 */
const PROVIDERS = new Set<PaymentProvider>(['systempay', 'paypal', 'sumup', 'bank']);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const provider = String(req.query.provider ?? '') as PaymentProvider;
  if (!PROVIDERS.has(provider)) return res.status(400).json({ error: 'Fournisseur inconnu' });

  const wreq: WebhookRequest = {
    headers: req.headers as WebhookRequest['headers'],
    body: req.body,
    query: req.query as WebhookRequest['query'],
  };

  try {
    const result = await gatewayFor(provider).verifyWebhook(wreq);
    if (!result) {
      // Signature invalide / non vérifiable → on ne modifie rien.
      return res.status(200).json({ ok: false });
    }
    if (result.status !== 'pending') {
      await setPaymentStatus(result.reference, result.status, result.providerRef);
    }
    // Systempay attend une réponse texte ; les autres se contentent d'un 200.
    return res.status(200).send('OK');
  } catch (e) {
    console.error(`[pay webhook ${provider}]`, e);
    return res.status(200).json({ ok: false }); // 200 pour éviter les rejeux agressifs
  }
}
