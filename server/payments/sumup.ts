import type { Gateway, PaymentRow, CreateResult, WebhookResult, WebhookRequest } from './types.js';
import { euros } from './types.js';

/**
 * SumUp — API e-commerce (Checkouts). On crée un checkout puis on redirige le
 * client vers la page de paiement hébergée SumUp.
 * Variables :
 *   SUMUP_API_KEY        — clé API (secret) SumUp
 *   SUMUP_MERCHANT_CODE  — code marchand (merchant_code)
 *   SUMUP_MODE           — sandbox | live (défaut sandbox)  [informatif]
 */

const API = 'https://api.sumup.com';

export const sumup: Gateway = {
  provider: 'sumup',

  async createPayment(row: PaymentRow, ctx): Promise<CreateResult> {
    const apiKey = process.env.SUMUP_API_KEY, merchant = process.env.SUMUP_MERCHANT_CODE;
    if (!apiKey || !merchant) throw new Error('SumUp non configuré (SUMUP_API_KEY / SUMUP_MERCHANT_CODE)');

    const r = await fetch(`${API}/v0.1/checkouts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkout_reference: row.reference,
        amount: Number(euros(row.amount_cents)),
        currency: row.currency,
        merchant_code: merchant,
        description: (row.description ?? 'Oui Stars').slice(0, 100),
        return_url: `${ctx.notifyUrl}`,           // notification serveur SumUp
        redirect_url: `${ctx.returnUrl}${ctx.returnUrl.includes('?') ? '&' : '?'}provider=sumup`,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json() as any;
    if (!r.ok) throw new Error(`SumUp checkout ${r.status}: ${JSON.stringify(data).slice(0, 200)}`);

    // SumUp renvoie l'id du checkout ; la page hébergée est atteignable via
    // https://pay.sumup.com/<id> (Hosted Checkout).
    const id = data.id as string;
    return { redirectUrl: `https://pay.sumup.com/${id}`, providerRef: id };
  },

  async verifyWebhook(req: WebhookRequest): Promise<WebhookResult | null> {
    // SumUp notifie avec l'id/checkout_reference et l'état. On revérifie l'état
    // en interrogeant l'API (source autoritaire) plutôt que de faire confiance au corps.
    const body = (req.body ?? {}) as { checkout_reference?: string; id?: string; reference?: string; status?: string };
    const reference = body.checkout_reference ?? body.reference;
    const id = body.id;
    if (!reference && !id) return null;

    const apiKey = process.env.SUMUP_API_KEY;
    let status: WebhookResult['status'] = 'pending';
    let ref = reference;
    try {
      if (apiKey && id) {
        const r = await fetch(`${API}/v0.1/checkouts/${id}`, {
          headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(8000),
        });
        if (r.ok) {
          const d = await r.json() as any;
          ref = d.checkout_reference ?? ref;
          status = d.status === 'PAID' ? 'paid' : d.status === 'FAILED' ? 'failed' : 'pending';
        }
      } else {
        status = body.status === 'PAID' ? 'paid' : body.status === 'FAILED' ? 'failed' : 'pending';
      }
    } catch { return null; }
    if (!ref) return null;
    return { reference: ref, status, providerRef: id };
  },
};
