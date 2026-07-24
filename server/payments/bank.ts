import type { Gateway, PaymentRow, CreateResult, WebhookResult, WebhookRequest } from './types.js';
import { euros } from './types.js';

/**
 * Virement bancaire — affichage de l'IBAN + référence de commande.
 * Aucune API : le paiement reste "pending" jusqu'à réception (rapprochement
 * manuel dans le back-office, ou futur flux Open Banking via le webhook stub).
 * Variables :
 *   BANK_BENEFICIARY, BANK_IBAN, BANK_BIC
 *   OPENBANKING_WEBHOOK_SECRET — (futur) secret partagé pour valider les notifs
 */
export const bank: Gateway = {
  provider: 'bank',

  async createPayment(row: PaymentRow): Promise<CreateResult> {
    return {
      bankTransfer: {
        beneficiary: process.env.BANK_BENEFICIARY ?? 'Oui Stars',
        iban: process.env.BANK_IBAN ?? 'FR76 …',
        bic: process.env.BANK_BIC ?? '—',
        reference: row.reference,             // à rappeler impérativement en libellé
        amount: `${euros(row.amount_cents)} ${row.currency}`,
        note: `Indiquez la référence ${row.reference} en libellé du virement pour un traitement automatique.`,
      },
      providerRef: row.reference,
    };
  },

  /**
   * Ébauche Open Banking : accepte une notification signée (secret partagé)
   * confirmant la réception d'un virement rapproché sur notre référence.
   * À finaliser avec l'agrégateur choisi (Bridge, Powens, etc.).
   */
  async verifyWebhook(req: WebhookRequest): Promise<WebhookResult | null> {
    const secret = process.env.OPENBANKING_WEBHOOK_SECRET;
    if (!secret) return null; // désactivé tant que non configuré
    const provided = req.headers['x-openbanking-secret'];
    if (provided !== secret) return null;
    const body = (req.body ?? {}) as { reference?: string; status?: string };
    if (!body.reference) return null;
    return {
      reference: body.reference,
      status: body.status === 'received' || body.status === 'paid' ? 'paid' : 'pending',
    };
  },
};
