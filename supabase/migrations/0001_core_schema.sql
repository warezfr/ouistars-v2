-- Oui Stars v2 — schéma cœur (ops unifiées + ETG supplier).
-- Réutilise et consolide le schéma du projet existant.

create extension if not exists "pgcrypto";

-- Chauffeurs
create table if not exists ops_drivers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,
  email text,
  languages text[] default '{fr,en}',
  vtc_card text,
  status text not null default 'active',          -- active | inactive | on_mission | on_leave
  notes text,
  created_at timestamptz not null default now()
);

-- Flotte
create table if not exists ops_vehicles (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  plate_number text not null unique,
  class text not null,                            -- E | V | S | EQE | Sprinter
  category text not null,                         -- business | business_van | first | electro_business | minibus
  seats int not null,
  luggage int not null,
  color text default 'black',
  status text not null default 'available',       -- available | on_mission | maintenance | retired
  insurance_expiry date,
  ct_expiry date,
  created_at timestamptz not null default now()
);

-- Réservations site (BookingModal)
create table if not exists website_bookings (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  first_name text, last_name text, phone text, email text,
  travel_date date, travel_time text,
  pickup text, destination text, prefill text,
  passengers int default 1, notes text,
  channel text default 'siteweb',                 -- siteweb | whatsapp | mail
  route_id text,                                  -- lien grille tarifaire
  vehicle_class text,                             -- E | V | S
  price_amount numeric(10,2),
  status text not null default 'pending',         -- pending | confirmed | assigned | completed | cancelled
  driver_id uuid references ops_drivers(id),
  vehicle_id uuid references ops_vehicles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_wb_status on website_bookings(status);
create index if not exists idx_wb_date on website_bookings(travel_date);

-- Devis / événements
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  company text, contact_name text, email text, phone text,
  event_type text, start_date date, end_date date,
  vehicles_count int default 1, details text,
  channel text default 'siteweb',
  status text not null default 'new',             -- new | in_progress | sent | accepted | rejected | invoiced | lost
  amount_estimated numeric(10,2),
  created_at timestamptz not null default now()
);

-- Candidatures chauffeurs (réseau de partenaires)
create table if not exists chauffeur_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  first_name text, last_name text, phone text, email text,
  vtc_card text, city text, message text,
  status text not null default 'new',
  driver_id uuid references ops_drivers(id),
  created_at timestamptz not null default now()
);

-- Factures
create table if not exists ops_invoices (
  id uuid primary key default gen_random_uuid(),
  number text not null unique,
  quote_id uuid references quotes(id),
  booking_reference text,
  client_name text not null, client_email text, client_company text,
  amount_ht numeric(10,2) not null, amount_ttc numeric(10,2) not null,
  tva_rate numeric(5,2) not null default 10.00,
  status text not null default 'draft',           -- draft | sent | paid | cancelled
  issued_at timestamptz not null default now(), due_at timestamptz, paid_at timestamptz
);

-- Newsletter
create table if not exists newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- RLS : service role uniquement (les endpoints API écrivent)
alter table website_bookings enable row level security;
alter table quotes enable row level security;
alter table chauffeur_applications enable row level security;
alter table ops_invoices enable row level security;
