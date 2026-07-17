-- Grille tarifaire officielle 2026-2027 (source du calculateur & des devis).
-- Prix TTC, par transfert (aller ou retour), même tarif dans les deux sens.

create table if not exists pricing_routes (
  id text primary key,
  label text not null,
  category text not null,            -- airport | city | station | tour | riviera | city-to-city
  price_e numeric(10,2) not null,
  price_v numeric(10,2) not null,
  price_s numeric(10,2) not null,
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists pricing_meet_greet (
  id text primary key,
  airport text not null,
  base numeric(10,2),
  included_pax int not null default 3,
  included_bags int not null default 3,
  extra_pax_surcharge numeric(10,2)
);

create table if not exists pricing_special (
  id text primary key,               -- hourly-e, perkm-s, ...
  label text not null,
  vehicle_class text not null,
  rate numeric(10,2) not null,
  unit text not null                 -- per_hour | per_km
);

-- Trajets à tarif fixe
insert into pricing_routes (id, label, category, price_e, price_v, price_s, sort_order) values
  ('cdg-ory-lbg-paris','Aéroports Paris (CDG • ORY • LBG) ⇄ Paris','airport',120,130,210,1),
  ('bva-paris','Beauvais (BVA) ⇄ Paris','airport',240,250,320,2),
  ('paris-paris','Paris ⇄ Paris (intra-muros)','city',100,110,140,3),
  ('paris-disneyland','Paris ⇄ Disneyland','tour',150,170,210,4),
  ('paris-versailles','Paris ⇄ Versailles','tour',110,120,190,5),
  ('airports-versailles','Aéroports Paris ⇄ Versailles','airport',150,170,220,6),
  ('paris-stations','Paris ⇄ Gares (Nord, Est, Lyon, Montparnasse)','station',100,110,160,7),
  ('stations-airports','Gares Paris ⇄ Aéroports Paris','station',140,150,230,8),
  ('stations-disneyland','Gares Paris ⇄ Disneyland','station',170,190,230,9),
  ('nce-nice','Nice (NCE) ⇄ Nice ville','riviera',120,130,200,10),
  ('nce-monaco','Nice (NCE) ⇄ Monaco','riviera',200,220,250,11),
  ('nice-st-tropez','Nice ⇄ Saint-Tropez','riviera',350,370,450,12),
  ('paris-giverny','Paris ⇄ Giverny','city-to-city',280,280,360,13),
  ('paris-rouen','Paris ⇄ Rouen','city-to-city',490,490,630,14),
  ('paris-reims','Paris ⇄ Reims','city-to-city',520,520,670,15),
  ('paris-epernay','Paris ⇄ Épernay','city-to-city',600,600,770,16),
  ('paris-deauville','Paris ⇄ Deauville','city-to-city',770,770,990,17),
  ('paris-honfleur','Paris ⇄ Honfleur','city-to-city',820,820,1050,18),
  ('paris-le-havre','Paris ⇄ Le Havre','city-to-city',840,840,1080,19),
  ('paris-etretat','Paris ⇄ Étretat','city-to-city',910,910,1170,20),
  ('paris-mont-saint-michel','Paris ⇄ Mont-Saint-Michel','city-to-city',1260,1260,1620,21)
on conflict (id) do update set
  price_e = excluded.price_e, price_v = excluded.price_v, price_s = excluded.price_s;

-- Meet & Greeter (hors véhicule / chauffeur)
insert into pricing_meet_greet (id, airport, base, included_pax, included_bags, extra_pax_surcharge) values
  ('cdg-ory','Paris — CDG & ORY',280,3,3,50),
  ('nce','Nice — NCE',320,3,3,70),
  ('lbg','Paris-Le Bourget — LBG',null,3,3,null)
on conflict (id) do update set base = excluded.base, extra_pax_surcharge = excluded.extra_pax_surcharge;

-- Horaire (min 3 h) & au km
insert into pricing_special (id, label, vehicle_class, rate, unit) values
  ('hourly-e','Horaire E-Class','E',80,'per_hour'),
  ('hourly-v','Horaire V-Class','V',90,'per_hour'),
  ('hourly-s','Horaire S-Class','S',110,'per_hour'),
  ('perkm-e','Au km E-Class','E',3.5,'per_km'),
  ('perkm-v','Au km V-Class','V',3.5,'per_km'),
  ('perkm-s','Au km S-Class','S',4.5,'per_km')
on conflict (id) do update set rate = excluded.rate;
