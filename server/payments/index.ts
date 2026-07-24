import type { Gateway, PaymentMethod, PaymentProvider } from './types.js';
import { systempay } from './systempay.js';
import { paypal } from './paypal.js';
import { sumup } from './sumup.js';
import { bank } from './bank.js';

/** Méthode de paiement → fournisseur (passerelle) qui la traite. */
export const METHOD_PROVIDER: Record<PaymentMethod, PaymentProvider> = {
  card: 'systempay',
  apple_pay: 'systempay',
  google_pay: 'systempay',
  paypal: 'paypal',
  sumup: 'sumup',
  bank_transfer: 'bank',
};

const GATEWAYS: Record<PaymentProvider, Gateway> = {
  systempay, paypal, sumup, bank,
};

export function gatewayFor(provider: PaymentProvider): Gateway {
  const g = GATEWAYS[provider];
  if (!g) throw new Error(`Fournisseur inconnu : ${provider}`);
  return g;
}

/** Méthodes activées selon les variables d'environnement présentes. */
export function enabledMethods(): PaymentMethod[] {
  const on: PaymentMethod[] = [];
  const sys = process.env.SYSTEMPAY_SITE_ID && (process.env.SYSTEMPAY_KEY_TEST || process.env.SYSTEMPAY_KEY_PROD);
  if (sys) on.push('card', 'apple_pay', 'google_pay');
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_SECRET) on.push('paypal');
  if (process.env.SUMUP_API_KEY && process.env.SUMUP_MERCHANT_CODE) on.push('sumup');
  if (process.env.BANK_IBAN) on.push('bank_transfer');
  return on;
}

export * from './types.js';
export { capturePaypalOrder } from './paypal.js';
