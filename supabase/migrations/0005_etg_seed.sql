-- Seed airports France cœur
INSERT INTO etg_airport_mappings (iata_code, name, latitude, longitude, timezone, buffer_time_minutes) VALUES
  ('CDG', 'Paris Charles de Gaulle', 49.0097, 2.5479, 'Europe/Paris', 45),
  ('ORY', 'Paris Orly', 48.7262, 2.3652, 'Europe/Paris', 45),
  ('LBG', 'Paris Le Bourget', 48.9694, 2.4414, 'Europe/Paris', 30),
  ('NCE', 'Nice Côte d''Azur', 43.6584, 7.2159, 'Europe/Paris', 45)
ON CONFLICT (iata_code) DO NOTHING;

-- Coverage zones
INSERT INTO etg_coverage_zones (id, name, center_lat, center_lng, radius_km, timezone) VALUES
  ('paris', 'Paris & Île-de-France', 48.8566, 2.3522, 55, 'Europe/Paris'),
  ('riviera', 'French Riviera', 43.7102, 7.2620, 80, 'Europe/Paris')
ON CONFLICT (id) DO NOTHING;

-- Rate cards — Paris airports ↔ Paris centre
INSERT INTO etg_rate_cards (
  route_key, start_type, start_value, end_type, end_value,
  transfer_category, base_price, seats, luggage_places, car_model,
  included_waiting_time_minutes, free_cancel_hours, min_lead_time_hours
) VALUES
  ('cdg-paris-business', 'iata', 'CDG', 'zone', 'paris', 'business', 130, 3, 3, 'Mercedes E Class, Lexus ES', 60, 24, 6),
  ('cdg-paris-business-van', 'iata', 'CDG', 'zone', 'paris', 'business_van', 140, 7, 7, 'Mercedes V Class', 60, 24, 6),
  ('cdg-paris-first', 'iata', 'CDG', 'zone', 'paris', 'first', 230, 2, 2, 'Mercedes S Class, Mercedes Maybach', 90, 24, 6),
  ('cdg-paris-electro', 'iata', 'CDG', 'zone', 'paris', 'electro_business', 150, 3, 3, 'Mercedes-Benz EQE', 60, 24, 6),
  ('cdg-paris-minibus', 'iata', 'CDG', 'zone', 'paris', 'minibus', 280, 12, 12, 'Mercedes Sprinter', 60, 24, 12),
  ('ory-paris-business', 'iata', 'ORY', 'zone', 'paris', 'business', 130, 3, 3, 'Mercedes E Class, Lexus ES', 60, 24, 6),
  ('ory-paris-business-van', 'iata', 'ORY', 'zone', 'paris', 'business_van', 140, 7, 7, 'Mercedes V Class', 60, 24, 6),
  ('ory-paris-first', 'iata', 'ORY', 'zone', 'paris', 'first', 230, 2, 2, 'Mercedes S Class', 90, 24, 6),
  ('lbg-paris-business', 'iata', 'LBG', 'zone', 'paris', 'business', 130, 3, 3, 'Mercedes E Class', 60, 24, 6),
  ('paris-cdg-business', 'zone', 'paris', 'iata', 'CDG', 'business', 130, 3, 3, 'Mercedes E Class, Lexus ES', 60, 24, 6),
  ('paris-cdg-business-van', 'zone', 'paris', 'iata', 'CDG', 'business_van', 140, 7, 7, 'Mercedes V Class', 60, 24, 6),
  ('paris-ory-business', 'zone', 'paris', 'iata', 'ORY', 'business', 130, 3, 3, 'Mercedes E Class', 60, 24, 6),
  ('cdg-ory-business', 'iata', 'CDG', 'iata', 'ORY', 'business', 180, 3, 3, 'Mercedes E Class', 60, 24, 6),
  ('gare-nord-paris-business', 'coords', '48.8809,2.3553', 'zone', 'paris', 'business', 65, 3, 2, 'Mercedes E Class', 30, 24, 2),
  ('paris-versailles-business', 'zone', 'paris', 'coords', '48.8049,2.1204', 'business', 230, 3, 3, 'Mercedes E Class', 60, 24, 6),
  ('nce-monaco-business', 'iata', 'NCE', 'coords', '43.7384,7.4246', 'business', 160, 3, 2, 'Mercedes E Class, Lexus ES', 60, 24, 6),
  ('nce-cannes-business', 'iata', 'NCE', 'coords', '43.5528,7.0174', 'business', 140, 3, 2, 'Mercedes E Class', 60, 24, 6),
  ('nce-monaco-business-van', 'iata', 'NCE', 'coords', '43.7384,7.4246', 'business_van', 180, 7, 7, 'Mercedes V Class', 60, 24, 6),
  ('monaco-nce-business', 'coords', '43.7384,7.4246', 'iata', 'NCE', 'business', 160, 3, 2, 'Mercedes E Class', 60, 24, 6)
ON CONFLICT (route_key, transfer_category) DO NOTHING;
