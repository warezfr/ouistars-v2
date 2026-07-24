import { getServiceSupabase } from '../etg/supabase.js';
import type { PaymentRow, PaymentStatus } from './types.js';

/**
 * Accès base des paiements (service_role). Toute écriture d'état passe ici,
 * déclenchée par les webhooks signés ou l'admin — jamais par le navigateur.
 */

function genRef(): string {
  // PAY- + 8 chars base36 (sans dépendre de Math.random en périmètre restreint serveur)
  const t = Date.now().toString(36).toUpperCase();
  return `PAY-${t.slice(-8)}`;
}

export interface NewPayment {
  amountCents: number;
  currency?: string;
  method: PaymentRow['method'];
  provider: PaymentRow['provider'];
  invoiceNumber?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

export async function createPaymentRow(p: NewPayment): Promise<PaymentRow> {
  const db = getServiceSupabase();
  if (!db) throw new Error('Supabase non configuré');
  const row = {
    reference: genRef(),
    invoice_number: p.invoiceNumber ?? null,
    amount_cents: p.amountCents,
    currency: p.currency ?? 'EUR',
    method: p.method,
    provider: p.provider,
    status: 'pending' as PaymentStatus,
    customer_name: p.customerName ?? null,
    customer_email: p.customerEmail ?? null,
    description: p.description ?? null,
    provider_ref: null,
    metadata: p.metadata ?? {},
  };
  const { data, error } = await db.from('payments').insert(row).select('*').single();
  if (error) throw new Error(`payment insert: ${error.message}`);
  return data as PaymentRow;
}

export async function getPayment(reference: string): Promise<PaymentRow | null> {
  const db = getServiceSupabase();
  if (!db) return null;
  const { data } = await db.from('payments').select('*').eq('reference', reference).maybeSingle();
  return (data as PaymentRow) ?? null;
}

/** Met à jour le statut ; si "paid", marque aussi la facture liée payée (idempotent). */
export async function setPaymentStatus(
  reference: string, status: PaymentStatus, providerRef?: string,
): Promise<void> {
  const db = getServiceSupabase();
  if (!db) return;
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (providerRef) patch.provider_ref = providerRef;
  if (status === 'paid') patch.paid_at = new Date().toISOString();

  const { data: row } = await db.from('payments').update(patch).eq('reference', reference).select('invoice_number').maybeSingle();

  if (status === 'paid' && row?.invoice_number) {
    await db.from('invoices')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('number', row.invoice_number).eq('status', 'unpaid');
  }
}

/** Récupère le montant TTC (centimes) d'une facture non payée — source autoritaire. */
export async function invoiceAmountCents(number: string): Promise<
  { amountCents: number; name: string | null; email: string | null } | null
> {
  const db = getServiceSupabase();
  if (!db) return null;
  const { data } = await db.from('invoices')
    .select('amount, vat_rate, status, client_name, client_email')
    .eq('number', number).maybeSingle();
  if (!data || data.status === 'cancelled') return null;
  const ttc = Number(data.amount) * (1 + Number(data.vat_rate ?? 0));
  return { amountCents: Math.round(ttc * 100), name: data.client_name ?? null, email: data.client_email ?? null };
}
