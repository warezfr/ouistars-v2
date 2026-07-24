-- 0012_payments.sql — Paiements multi-passerelles (Systempay/BRED, PayPal, SumUp, virement).
-- Source de vérité des paiements. Écrite UNIQUEMENT par le serveur (service_role)
-- via les webhooks signés — jamais par le navigateur.

create table if not exists payments (
  id           uuid primary key default gen_random_uuid(),
  reference    text not null unique,             -- PAY-XXXXXX (généré)
  invoice_number text,                            -- facture liée (invoices.number), si applicable
  amount_cents int  not null check (amount_cents > 0),  -- montant TTC en centimes
  currency     text not null default 'EUR',
  method       text not null,                     -- card | paypal | sumup | bank_transfer | apple_pay | google_pay
  provider     text not null,                     -- systempay | paypal | sumup | bank
  status       text not null default 'pending',   -- pending | paid | failed | cancelled | expired | refunded
  customer_name  text,
  customer_email text,
  description  text,
  provider_ref text,                              -- id de transaction/commande côté fournisseur
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  paid_at      timestamptz
);

create index if not exists payments_invoice_idx on payments (invoice_number);
create index if not exists payments_status_idx  on payments (status);

alter table payments enable row level security;
-- Lecture réservée au back-office ; écriture serveur via service_role (contourne la RLS).
drop policy if exists "payments admin read" on payments;
create policy "payments admin read" on payments for select to authenticated using (is_active_admin());
