-- Documents opérationnels (consigne) : bons de commande + fiches de mission chauffeurs.

create table if not exists ops_documents (
  id uuid primary key default gen_random_uuid(),
  type text not null,                       -- purchase_order | mission_sheet | client_pdf | invoice
  booking_reference text,
  quote_reference text,
  driver_id uuid references ops_drivers(id),
  number text,
  client_name text,
  storage_path text,                        -- Supabase Storage (bucket 'documents')
  sent_at timestamptz,                      -- envoi e-mail chauffeur/client
  created_at timestamptz not null default now()
);
create index if not exists idx_docs_booking on ops_documents(booking_reference);
create index if not exists idx_docs_driver on ops_documents(driver_id);

-- À la confirmation d'une réservation (status -> 'assigned' avec driver_id) :
--   1. générer bon de commande + PDF client (nom du client)
--   2. générer une fiche de mission par chauffeur
--   3. envoyer par e-mail au chauffeur en pièce jointe (voir api/documents/generate + server/email)
-- Ce déclenchement est géré côté application/Edge Function (pas de trigger SQL bloquant).
