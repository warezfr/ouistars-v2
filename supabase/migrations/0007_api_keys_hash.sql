-- Migration 0007 : clés API gérées depuis le back-office (auth Bearer)
-- Stockage haché (SHA-256) + préfixe d'affichage ; gestion réservée aux admins.
alter table etg_api_keys add column if not exists token_hash text unique;
alter table etg_api_keys add column if not exists token_prefix text;
alter table etg_api_keys alter column token drop not null;

drop policy if exists "Deny all access from anon and authenticated" on etg_api_keys;
drop policy if exists "api keys admin read" on etg_api_keys;
create policy "api keys admin read" on etg_api_keys
  for select to authenticated using (is_active_admin());
drop policy if exists "api keys admin write" on etg_api_keys;
create policy "api keys admin write" on etg_api_keys
  for all to authenticated using (can_write_cms()) with check (can_write_cms());
