import type { Gateway, PaymentRow, CreateResult, WebhookResult, WebhookRequest } from './types.js';
import { euros } from './types.js';

/**
 * PayPal Business — API REST v2 (Orders). Redirection vers la page PayPal.
 * Variables :
 *   PAYPAL_CLIENT_ID, PAYPAL_SECRET
 *   PAYPAL_MODE      — sandbox | live (défaut sandbox)
 *   PAYPAL_WEBHOOK_ID — pour la vérification des webhooks (recommandé)
 */

function base(): string {
  return (process.env.PAYPAL_MODE ?? 'sandbox') === 'live'
    ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function token(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_SECRET;
  if (!id || !secret) throw new Error('PayPal non configuré (PAYPAL_CLIENT_ID / PAYPAL_SECRET)');
  const r = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`PayPal token ${r.status}`);
  return (await r.json() as any).access_token as string;
}

export const paypal: Gateway = {
  provider: 'paypal',

  async createPayment(row: PaymentRow, ctx): Promise<CreateResult> {
    const t = await token();
    const r = await fetch(`${base()}/v2/checkout/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: row.reference,
          custom_id: row.reference,
          description: (row.description ?? 'Oui Stars').slice(0, 127),
          amount: { currency_code: row.currency, value: euros(row.amount_cents) },
        }],
        application_context: {
          brand_name: 'Oui Stars', user_action: 'PAY_NOW',
          return_url: `${ctx.returnUrl}${ctx.returnUrl.includes('?') ? '&' : '?'}provider=paypal`,
          cancel_url: `${ctx.returnUrl}${ctx.returnUrl.includes('?') ? '&' : '?'}provider=paypal&cancel=1`,
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await r.json() as any;
    if (!r.ok) throw new Error(`PayPal order ${r.status}: ${JSON.stringify(data).slice(0, 200)}`);
    const approve = (data.links ?? []).find((l: { rel: string; href: string }) => l.rel === 'approve');
    if (!approve) throw new Error('PayPal: lien d’approbation absent');
    return { redirectUrl: approve.href, providerRef: data.id };
  },

  async verifyWebhook(req: WebhookRequest): Promise<WebhookResult | null> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const body = (req.body ?? {}) as { event_type?: string; resource?: { custom_id?: string; id?: string; supplementary_data?: { related_ids?: { order_id?: string } } } };

    // Vérification cryptographique de l'authenticité (recommandée en prod).
    if (webhookId) {
      try {
        const t = await token();
        const v = await fetch(`${base()}/v1/notifications/verify-webhook-signature`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            auth_algo: req.headers['paypal-auth-algo'],
            cert_url: req.headers['paypal-cert-url'],
            transmission_id: req.headers['paypal-transmission-id'],
            transmission_sig: req.headers['paypal-transmission-sig'],
            transmission_time: req.headers['paypal-transmission-time'],
            webhook_id: webhookId,
            webhook_event: req.body,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const res = await v.json() as any;
        if (res.verification_status !== 'SUCCESS') return null;
      } catch { return null; }
    }

    const reference = body.resource?.custom_id
      ?? body.resource?.supplementary_data?.related_ids?.order_id;
    if (!reference) return null;
    const e = body.event_type ?? '';
    const status =
      e === 'PAYMENT.CAPTURE.COMPLETED' || e === 'CHECKOUT.ORDER.COMPLETED' ? 'paid'
      : e === 'PAYMENT.CAPTURE.DENIED' ? 'failed'
      : e === 'PAYMENT.CAPTURE.REFUNDED' ? 'refunded' : 'pending';
    return { reference, status, providerRef: body.resource?.id };
  },
};

/** Capture d'une commande PayPal au retour du client (flux redirect). */
export async function capturePaypalOrder(orderId: string): Promise<{ ok: boolean; reference?: string }> {
  const t = await token();
  const r = await fetch(`${base()}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  const data = await r.json() as any;
  const ok = r.ok && data.status === 'COMPLETED';
  const reference = data.purchase_units?.[0]?.reference_id ?? data.purchase_units?.[0]?.custom_id;
  return { ok, reference };
}
