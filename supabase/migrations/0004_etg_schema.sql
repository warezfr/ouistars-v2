-- Migration 0004 : schéma API fournisseur ETG (search / book / status / cancel)
-- Porté depuis le projet initial. Le service_role contourne la RLS ;
-- les rôles anon/authenticated n'ont aucun accès.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Aéroports (IATA)
CREATE TABLE IF NOT EXISTS etg_airport_mappings (
  iata_code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  buffer_time_minutes INT NOT NULL DEFAULT 45,
  country_code TEXT NOT NULL DEFAULT 'FR'
);

-- Zones de couverture
CREATE TABLE IF NOT EXISTS etg_coverage_zones (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Paris',
  active BOOLEAN NOT NULL DEFAULT true
);

-- Grilles tarifaires fixes
CREATE TABLE IF NOT EXISTS etg_rate_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_key TEXT NOT NULL,
  start_type TEXT NOT NULL, -- iata | coords | zone
  start_value TEXT NOT NULL,
  end_type TEXT NOT NULL,
  end_value TEXT NOT NULL,
  transfer_category TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  seats INT NOT NULL,
  luggage_places INT NOT NULL,
  car_model TEXT NOT NULL,
  included_waiting_time_minutes INT NOT NULL DEFAULT 60,
  free_cancel_hours INT NOT NULL DEFAULT 24,
  min_lead_time_hours INT NOT NULL DEFAULT 6,
  tolls_included BOOLEAN NOT NULL DEFAULT true,
  gratuity_included BOOLEAN NOT NULL DEFAULT true,
  meet_greet_included BOOLEAN NOT NULL DEFAULT true,
  child_seat_price NUMERIC(10, 2) NOT NULL DEFAULT 15.00,
  max_child_seats INT NOT NULL DEFAULT 3,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (route_key, transfer_category)
);

-- Cache des offres (résultats /search)
CREATE TABLE IF NOT EXISTS etg_offers (
  offer_id TEXT PRIMARY KEY,
  search_hash TEXT NOT NULL,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etg_offers_expires ON etg_offers (expires_at);
CREATE INDEX IF NOT EXISTS idx_etg_offers_hash ON etg_offers (search_hash);

-- Commandes
CREATE TABLE IF NOT EXISTS etg_orders (
  order_id TEXT PRIMARY KEY,
  offer_id TEXT NOT NULL REFERENCES etg_offers (offer_id),
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | completed | cancelled
  etg_status TEXT NOT NULL DEFAULT 'confirmed', -- pour /status : completed | cancelled
  price_amount NUMERIC(10, 2) NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'EUR',
  start_time TIMESTAMPTZ NOT NULL,
  passengers INT NOT NULL,
  luggage_places INT NOT NULL,
  sport_luggage_places INT NOT NULL DEFAULT 0,
  animals INT NOT NULL DEFAULT 0,
  wheelchairs_places INT NOT NULL DEFAULT 0,
  children_seat_0 INT NOT NULL DEFAULT 0,
  children_seat_1 INT NOT NULL DEFAULT 0,
  children_seat_2 INT NOT NULL DEFAULT 0,
  children_seat_3 INT NOT NULL DEFAULT 0,
  transfer_category TEXT NOT NULL,
  distance INT,
  estimated_duration_minutes INT,
  included_waiting_time_minutes INT NOT NULL,
  free_cancel_until TIMESTAMPTZ,
  flight_number TEXT,
  shield_text TEXT,
  comment TEXT,
  main_passenger JSONB,
  book_payload JSONB NOT NULL,
  search_payload JSONB NOT NULL,
  upsells JSONB NOT NULL DEFAULT '[]',
  driver_info JSONB,
  car_info JSONB,
  meeting_info JSONB,
  meeting_instructions TEXT,
  meeting_images JSONB,
  buffer_time_minutes INT NOT NULL DEFAULT 0,
  penalty_amount NUMERIC(10, 2),
  supplier_link TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etg_orders_status ON etg_orders (status);
CREATE INDEX IF NOT EXISTS idx_etg_orders_start ON etg_orders (start_time);

-- Journal d'audit des commandes
CREATE TABLE IF NOT EXISTS etg_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES etg_orders (order_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etg_order_events_order ON etg_order_events (order_id);

-- Journal des appels API (supervision SLA)
CREATE TABLE IF NOT EXISTS etg_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INT NOT NULL,
  duration_ms INT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_etg_api_logs_created ON etg_api_logs (created_at);

-- Clés API partenaires (Bearer, optionnel — Basic Auth reste le schéma principal)
CREATE TABLE IF NOT EXISTS etg_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- RLS
ALTER TABLE etg_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE etg_order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE etg_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE etg_api_keys ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON etg_api_keys FROM anon, authenticated;
GRANT ALL ON etg_api_keys TO service_role;
