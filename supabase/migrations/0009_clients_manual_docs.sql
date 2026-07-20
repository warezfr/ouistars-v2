-- Migration 0009 : fiches clients + factures/devis créés manuellement au back-office
-- 1) Table `clients` : fiches réelles (auto-créées à l'émission d'un devis/d'une facture,
--    ou saisies à la main). L'annuaire du back-office fusionne ces fiches avec les
--    clients agrégés des réservations.
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- nom affiché (personne ou raison sociale)
  company text,                          -- société (optionnel)
  email text,
  phone text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Deux fiches ne partagent jamais le même e-mail (insensible à la casse).
create unique index if not exists clients_email_key on clients (lower(email)) where email is not null and email <> '';
create index if not exists clients_phone_idx on clients (phone) where phone is not null;

alter table clients enable row level security;
drop policy if exists "clients admin read" on clients;
create policy "clients admin read" on clients for select to authenticated using (is_active_admin());
drop policy if exists "clients admin write" on clients;
create policy "clients admin write" on clients for all to authenticated using (can_write_cms()) with check (can_write_cms());

-- 2) Factures : lignes multiples (items jsonb) + rattachement fiche client.
alter table invoices add column if not exists items jsonb;
alter table invoices add column if not exists client_id uuid references clients(id) on delete set null;

-- 3) Devis : rattachement fiche client.
alter table quotes add column if not exists client_id uuid references clients(id) on delete set null;

-- 4) RPC issue_invoice étendu : items (lignes libres), fiche client, taux de TVA.
--    On supprime l'ancienne signature (8 args) pour éviter l'ambiguïté PostgREST ;
--    les nouveaux paramètres ont des valeurs par défaut → les appels existants
--    (émission depuis une réservation) restent valides tels quels.
drop function if exists issue_invoice(text, text, text, text, text, text, text, numeric);
create or replace function issue_invoice(
  p_reference text, p_source text, p_client_name text, p_client_email text,
  p_client_phone text, p_route text, p_service_date text, p_amount numeric,
  p_items jsonb default null, p_client_id uuid default null, p_vat_rate numeric default 0.10
) returns invoices language plpgsql security definer as $$
declare
  v_year int := extract(year from now())::int;
  v_seq int;
  v_row invoices;
begin
  if not can_write_cms() then raise exception 'forbidden'; end if;
  select coalesce(max(seq), 0) + 1 into v_seq from invoices where year = v_year;
  insert into invoices (number, year, seq, source, reference, client_name, client_email,
                        client_phone, route, service_date, amount, vat_rate, items, client_id, issued_by)
  values (format('FA-%s-%s', v_year, lpad(v_seq::text, 4, '0')), v_year, v_seq, p_source,
          p_reference, p_client_name, p_client_email, p_client_phone, p_route,
          p_service_date, p_amount, coalesce(p_vat_rate, 0.10), p_items, p_client_id, auth.uid()::text)
  returning * into v_row;
  return v_row;
end $$;
