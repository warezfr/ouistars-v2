import { createHmac } from 'node:crypto';
import type { Gateway, PaymentRow, CreateResult, WebhookResult, WebhookRequest } from './types.js';

/**
 * Systempay (BRED / Lyra Network) — page de paiement HÉBERGÉE (form V2).
 * CB, Visa, Mastercard, Amex, et Apple Pay / Google Pay (moyens gérés par la
 * page hébergée). Aucune donnée carte ne transite par notre serveur.
 *
 * Variables d'environnement :
 *   SYSTEMPAY_SITE_ID     — identifiant boutique (vads_site_id)
 *   SYSTEMPAY_KEY_TEST    — clé de test
 *   SYSTEMPAY_KEY_PROD    — clé de production
 *   SYSTEMPAY_MODE        — TEST | PRODUCTION (défaut TEST)
 *   SYSTEMPAY_URL         — défaut https://paiement.systempay.fr/vads-payment/
 */

const ISO4217: Record<string, string> = { EUR: '978', USD: '840', GBP: '826', CHF: '756' };

function mode(): 'TEST' | 'PRODUCTION' {
  return (process.env.SYSTEMPAY_MODE ?? 'TEST') === 'PRODUCTION' ? 'PRODUCTION' : 'TEST';
}
function key(): string {
  return (mode() === 'PRODUCTION' ? process.env.SYSTEMPAY_KEY_PROD : process.env.SYSTEMPAY_KEY_TEST) ?? '';
}
function tsUTC(): string {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // YYYYMMDDHHMMSS
}

/** Signature V2 : HMAC-SHA-256 base64 des valeurs vads_* triées + clé. */
export function sign(fields: Record<string, string>): string {
  const values = Object.keys(fields)
    .filter((k) => k.startsWith('vads_'))
    .sort()
    .map((k) => fields[k]);
  const payload = values.join('+') + '+' + key();
  return createHmac('sha256', key()).update(payload, 'utf8').digest('base64');
}

export const systempay: Gateway = {
  provider: 'systempay',

  async createPayment(row: PaymentRow, ctx): Promise<CreateResult> {
    const siteId = process.env.SYSTEMPAY_SITE_ID;
    if (!siteId || !key()) throw new Error('Systempay non configuré (SYSTEMPAY_SITE_ID / SYSTEMPAY_KEY_*)');

    // Cartes proposées ; Apple/Google Pay activés selon la méthode demandée.
    const cards =
      row.method === 'apple_pay' ? 'APPLE_PAY'
      : row.method === 'google_pay' ? 'GOOGLE_PAY'
      : 'CB;VISA;MASTERCARD;AMEX;APPLE_PAY;GOOGLE_PAY';

    const fields: Record<string, string> = {
      vads_action_mode: 'INTERACTIVE',
      vads_amount: String(row.amount_cents),
      vads_ctx_mode: mode(),
      vads_currency: ISO4217[row.currency] ?? '978',
      vads_order_id: row.reference,
      vads_page_action: 'PAYMENT',
      vads_payment_cards: cards,
      vads_payment_config: 'SINGLE',
      vads_return_mode: 'GET',
      vads_site_id: siteId,
      vads_trans_date: tsUTC(),
      vads_trans_id: row.reference.replace(/\D/g, '').slice(-6).padStart(6, '0'),
      vads_url_return: ctx.returnUrl,
      vads_url_check: ctx.notifyUrl,   // URL de notification serveur (IPN)
      vads_version: 'V2',
    };
    if (row.customer_email) fields.vads_cust_email = row.customer_email;
    fields.signature = sign(fields);

    return {
      formPost: { action: process.env.SYSTEMPAY_URL ?? 'https://paiement.systempay.fr/vads-payment/', fields },
      providerRef: fields.vads_trans_id,
    };
  },

  async verifyWebhook(req: WebhookRequest): Promise<WebhookResult | null> {
    const body = (req.body ?? {}) as Record<string, string>;
    const received = body.signature;
    if (!received) return null;
    const expected = sign(body);
    if (expected !== received) return null; // signature invalide → on ignore

    const reference = body.vads_order_id;
    if (!reference) return null;
    const st = body.vads_trans_status;
    const status =
      st === 'AUTHORISED' || st === 'CAPTURED' || st === 'ACCEPTED' ? 'paid'
      : st === 'CANCELLED' || st === 'ABANDONED' ? 'cancelled'
      : st === 'REFUSED' || st === 'ERROR' ? 'failed' : 'pending';
    return { reference, status, providerRef: body.vads_trans_uuid ?? body.vads_trans_id };
  },
};
