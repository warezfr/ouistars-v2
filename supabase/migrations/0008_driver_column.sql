-- Migration 0008 : colonne chauffeur dédiée (remplace la balise [chauffeur:...] des notes)
alter table website_bookings add column if not exists driver_name text;
