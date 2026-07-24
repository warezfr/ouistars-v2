/** Types partagés du système de paiement multi-passerelles. */

export type PaymentMethod =
  | 'card' | 'apple_pay' | 'google_pay'   // → Systempay (BRED / Lyra)
  | 'paypal' | 'sumup' | 'bank_transfer';

export type PaymentProvider = 'systempay' | 'paypal' | 'sumup' | 'bank';

export type PaymentStatus =
  | 'pending' | 'paid' | 'failed' | 'cancelled' | 'expired' | 'refunded';

export interface PaymentRow {
  reference: string;
  invoice_number: string | null;
  amount_cents: number;
  currency: string;
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  customer_name: string | null;
  customer_email: string | null;
  description: string | null;
  provider_ref: string | null;
  metadata: Record<string, unknown>;
}

/** Résultat d'une création de paiement, remis au front. */
export interface CreateResult {
  /** Redirection navigateur (PayPal, SumUp). */
  redirectUrl?: string;
  /** Formulaire auto-soumis (Systempay page hébergée). */
  formPost?: { action: string; fields: Record<string, string> };
  /** Coordonnées de virement (module IBAN). */
  bankTransfer?: {
    beneficiary: string; iban: string; bic: string;
    reference: string; amount: string; note: string;
  };
  providerRef?: string;
}

/** Résultat de la vérification d'un webhook fournisseur. */
export interface WebhookResult {
  reference: string;          // notre PAY-…
  status: PaymentStatus;
  providerRef?: string;
}

export interface Gateway {
  provider: PaymentProvider;
  /** Prépare le paiement et renvoie de quoi rediriger/afficher côté client. */
  createPayment(row: PaymentRow, ctx: { returnUrl: string; notifyUrl: string }): Promise<CreateResult>;
  /** Vérifie l'authenticité d'un webhook et en extrait l'état. Renvoie null si invalide. */
  verifyWebhook(req: WebhookRequest): Promise<WebhookResult | null>;
}

/** Vue minimale d'une requête HTTP côté webhook (compatible Vercel/Express). */
export interface WebhookRequest {
  headers: Record<string, string | string[] | undefined>;
  body: unknown;                // corps déjà parsé (JSON ou form)
  rawBody?: string;             // corps brut si disponible (signatures)
  query: Record<string, string | string[] | undefined>;
}

export const euros = (cents: number) => (cents / 100).toFixed(2);
