-- Migration 0010 : recrutement chauffeurs complet
-- 1) Candidatures enrichies : pièces jointes (docs jsonb), véhicule (vehicle jsonb),
--    pays et classe de véhicule — formulaire hérité de l'ancien site (Become a partner).
alter table chauffeur_applications add column if not exists docs jsonb;
alter table chauffeur_applications add column if not exists vehicle jsonb;
alter table chauffeur_applications add column if not exists country text;
alter table chauffeur_applications add column if not exists vehicle_class text;
alter table chauffeur_applications add column if not exists experience text;
alter table chauffeur_applications add column if not exists languages text;

-- 2) Bucket Storage PRIVÉ pour les pièces des candidatures (documents d'identité,
--    permis, carte VTC…) — lecture réservée aux admins, écriture via l'API serveur
--    (service role, contourne la RLS). Jamais d'accès public.
insert into storage.buckets (id, name, public)
values ('applications', 'applications', false)
on conflict (id) do update set public = false;

drop policy if exists "applications admin read" on storage.objects;
create policy "applications admin read" on storage.objects
  for select to authenticated
  using (bucket_id = 'applications' and is_active_admin());
