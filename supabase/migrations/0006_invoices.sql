-- Migration 0006 : registre de factures conforme (numérotation continue par année)
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,          -- FA-2026-0001
  year int not null,
  seq int not null,
  source text not null default 'site',  -- site | etg | manual
  reference text not null,              -- réservation liée
  client_name text not null,
  client_email text,
  client_phone text,
  route text,
  service_date text,
  amount numeric(10,2) not null,
  vat_rate numeric(5,3) not null default 0.10,
  status text not null default 'unpaid',-- unpaid | paid | cancelled
  pdf_path text,
  issued_by text,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (year, seq)
);
alter table invoices enable row level security;
drop policy if exists "invoices admin read" on invoices;
create policy "invoices admin read" on invoices for select to authenticated using (is_active_admin());
drop policy if exists "invoices admin write" on invoices;
create policy "invoices admin write" on invoices for all to authenticated using (can_write_cms()) with check (can_write_cms());

-- Émission atomique : n° séquentiel continu par année (unique(year,seq) verrouille).
create or replace function issue_invoice(
  p_reference text, p_source text, p_client_name text, p_client_email text,
  p_client_phone text, p_route text, p_service_date text, p_amount numeric
) returns invoices language plpgsql security definer as $$
declare
  v_year int := extract(year from now())::int;
  v_seq int;
  v_row invoices;
begin
  if not can_write_cms() then raise exception 'forbidden'; end if;
  select coalesce(max(seq), 0) + 1 into v_seq from invoices where year = v_year;
  insert into invoices (number, year, seq, source, reference, client_name, client_email,
                        client_phone, route, service_date, amount, issued_by)
  values (format('FA-%s-%s', v_year, lpad(v_seq::text, 4, '0')), v_year, v_seq, p_source,
          p_reference, p_client_name, p_client_email, p_client_phone, p_route,
          p_service_date, p_amount, auth.uid()::text)
  returning * into v_row;
  return v_row;
end $$;

-- Les admins peuvent créer des réservations (conversion devis, saisie manuelle)
drop policy if exists "website_bookings admin insert" on website_bookings;
create policy "website_bookings admin insert" on website_bookings
  for insert to authenticated with check (can_write_cms());
