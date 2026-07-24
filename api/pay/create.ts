import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from '../../server/auth/requireAdmin.js';
import { createPaymentRow, invoiceAmountCents } from '../../server/payments/store.js';
import { gatewayFor, METHOD_PROVIDER, enabledMethods } from '../../server/payments/index.js';
import type { PaymentMethod } from '../../server/payments/types.js';

/**
 * Création d'un paiement.
 *   GET  → { methods: [...] }  liste des moyens activés (selon la config env)
 *   POST → { method, invoiceNumber?, amountCents?, currency?, customer?, description? }
 *
 * Montant AUTORITAIRE :
 *   • invoiceNumber fourni → montant lu depuis la table invoices (TTC).
 *   • sinon (montant libre) → réservé au back-office (requireAdmin).
 */
function siteBase(req: VercelRequest): string {
  const env = process.env.PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  return `${proto}://${req.headers.host ?? 'www.ouistars.com'}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') return res.status(200).json({ methods: enabledMethods() });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = (req.body ?? {}) as {
    method?: string; invoiceNumber?: string; amountCents?: number; currency?: string;
    customer?: { name?: string; email?: string }; description?: string;
  };
  const method = body.method as PaymentMethod;
  if (!method || !(method in METHOD_PROVIDER)) return res.status(400).json({ error: 'Méthode invalide.' });
  if (!enabledMethods().includes(method)) return res.status(400).json({ error: 'Méthode non configurée.' });

  // 1. Déterminer le montant (source autoritaire).
  let amountCents: number;
  let name = body.customer?.name ?? null;
  let email = body.customer?.email ?? null;

  if (body.invoiceNumber) {
    const inv = await invoiceAmountCents(body.invoiceNumber);
    if (!inv) return res.status(404).json({ error: 'Facture introuvable ou annulée.' });
    amountCents = inv.amountCents;
    name = name ?? inv.name; email = email ?? inv.email;
  } else {
    // Montant libre → back-office uniquement.
    if (!(await requireAdmin(req, res))) return;
    amountCents = Math.round(Number(body.amountCents));
    if (!Number.isFinite(amountCents) || amountCents <= 0) return res.status(400).json({ error: 'Montant invalide.' });
  }

  const provider = METHOD_PROVIDER[method];

  try {
    const row = await createPaymentRow({
      amountCents, currency: body.currency ?? 'EUR', method, provider,
      invoiceNumber: body.invoiceNumber ?? null,
      customerName: name, customerEmail: email,
      description: body.description ?? (body.invoiceNumber ? `Facture ${body.invoiceNumber}` : 'Paiement Oui Stars'),
    });

    const site = siteBase(req);
    const result = await gatewayFor(provider).createPayment(row, {
      returnUrl: `${site}/paiement/retour?ref=${row.reference}`,
      notifyUrl: `${site}/api/pay/webhook?provider=${provider}`,
    });

    return res.status(200).json({ reference: row.reference, ...result });
  } catch (e) {
    return res.status(502).json({ error: `Création du paiement impossible : ${(e as Error).message}` });
  }
}
