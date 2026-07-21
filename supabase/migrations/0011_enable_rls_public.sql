-- 0011_enable_rls_public.sql
-- Corrige l'alerte Supabase « rls_disabled_in_public ».
--
-- Contexte : la clé anon est publique (livrée dans le bundle). Sans RLS, toute
-- table du schéma public est lisible/modifiable par quiconque possède l'URL.
--
-- Audit du code :
--   • Front public (anon) ne lit QUE cms_entries / cms_singletons → déjà RLS+policy.
--   • server/ + api/ utilisent SUPABASE_SERVICE_ROLE_KEY → ignorent la RLS.
--   • Back-office authentifié lit/écrit etg_rate_cards (page Tarifs) → policies admin.
--
-- Activer la RLS sans policy = accès refusé pour anon/authenticated, mais le
-- service_role (serveur) continue de fonctionner. C'est le défaut sécurisé.

-- 1) Activer la RLS sur toutes les tables exposées sans protection.
alter table if exists ops_drivers            enable row level security;
alter table if exists ops_vehicles           enable row level security;
alter table if exists newsletter_subscribers enable row level security;
alter table if exists pricing_routes         enable row level security;
alter table if exists pricing_meet_greet     enable row level security;
alter table if exists pricing_special        enable row level security;
alter table if exists ops_documents          enable row level security;
alter table if exists etg_airport_mappings   enable row level security;
alter table if exists etg_coverage_zones     enable row level security;
alter table if exists etg_rate_cards         enable row level security;
alter table if exists etg_api_logs           enable row level security;
alter table if exists etg_admin_users        enable row level security;
alter table if exists ops_packages           enable row level security;
alter table if exists ops_invoices           enable row level security;
alter table if exists quote_items            enable row level security;
alter table if exists invoice_items          enable row level security;

-- 2) etg_rate_cards : la page Tarifs du back-office y accède via le client
--    authentifié (clé anon + session admin). On garde donc un accès admin.
drop policy if exists "etg_rate_cards admin read"  on etg_rate_cards;
drop policy if exists "etg_rate_cards admin write" on etg_rate_cards;

create policy "etg_rate_cards admin read"
  on etg_rate_cards for select
  to authenticated
  using (is_active_admin());

create policy "etg_rate_cards admin write"
  on etg_rate_cards for all
  to authenticated
  using (can_write_cms())
  with check (can_write_cms());
