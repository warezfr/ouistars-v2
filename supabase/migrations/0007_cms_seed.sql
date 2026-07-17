-- Migration 0007 : contenu initial du CMS (reprend le contenu statique du site).
-- Idempotent via slug unique par collection (upsert manuel : on nettoie puis on insère).

-- ————— Services —————
DELETE FROM cms_entries WHERE collection = 'service';
INSERT INTO cms_entries (collection, slug, title, position, data) VALUES
 ('service','fleet-ops','Gestion de Flotte',10,'{"fr":"Gestion de Flotte","en":"Fleet Operations","icon":"fleet","image":"/why-fleet.webp","descFr":"Coordination de flottes pour délégations, tournées et opérations d’envergure.","descEn":"Fleet coordination for delegations, tours and large-scale operations."}'),
 ('service','dmc','Destination Management',20,'{"fr":"Destination Management","en":"Destination Management","icon":"globe","image":"/why-map.webp","descFr":"Organisation locale complète : logistique, itinéraires, expériences sur mesure.","descEn":"Full local orchestration: logistics, itineraries, bespoke experiences."}'),
 ('service','meet-greet','Airport Meet & Greeter',30,'{"fr":"Airport Meet & Greeter","en":"Airport Meet & Greeter","icon":"plane","image":"/why-airport.webp","descFr":"Accueil à la porte de l’avion, Fast Track et assistance jusqu’à la sortie.","descEn":"Welcome at the aircraft door, Fast Track and assistance to the exit."}'),
 ('service','events','Événements & Congrès',40,'{"fr":"Événements & Congrès","en":"Events & Congresses","icon":"star","image":"/why-paris-night.webp","descFr":"Mobilité coordonnée pour congrès, sommets et événements privés.","descEn":"Coordinated mobility for congresses, summits and private events."}'),
 ('service','fashion','Fashion Weeks',50,'{"fr":"Fashion Weeks","en":"Fashion Weeks","icon":"sparkle","image":"/why-vip.webp","descFr":"Logistique dédiée aux maisons, mannequins et invités durant les Fashion Weeks.","descEn":"Dedicated logistics for houses, models and guests during Fashion Weeks."}'),
 ('service','corporate','Mobilité Corporate',60,'{"fr":"Mobilité Corporate","en":"Corporate Mobility","icon":"briefcase","image":"/corp-corporate.webp","descFr":"Comptes entreprises, facturation centralisée et reporting.","descEn":"Corporate accounts, centralized billing and reporting."}'),
 ('service','private-aviation','Aviation Privée',70,'{"fr":"Aviation Privée","en":"Private Aviation Solutions","icon":"jet","image":"/corp-aviation.webp","descFr":"Coordination sol-air pour jets privés et aviation d’affaires.","descEn":"Ground-to-air coordination for private jets and business aviation."}'),
 ('service','business-aviation','Support Aviation d’Affaires',80,'{"fr":"Support Aviation d’Affaires","en":"Business Aviation Support","icon":"jet","image":"/corp-chauffeur.webp","descFr":"Assistance FBO, handling et transferts confidentiels.","descEn":"FBO assistance, handling and confidential transfers."}'),
 ('service','hospitality','Hôtels & Hospitality',90,'{"fr":"Hôtels & Hospitality","en":"Hotels & Hospitality","icon":"building","image":"/corp-hotel.webp","descFr":"Partenariats palaces et gestion des flux clients VIP.","descEn":"Palace partnerships and VIP guest flow management."}'),
 ('service','embassies','Ambassades & Délégations',100,'{"fr":"Ambassades & Délégations","en":"Embassies & Official Delegations","icon":"shield","image":"/corp-embassy.webp","descFr":"Protocole, sécurité et mobilité pour délégations officielles.","descEn":"Protocol, security and mobility for official delegations."}'),
 ('service','tours','Circuits & Expériences',110,'{"fr":"Circuits & Expériences","en":"Private Tours & Experiences","icon":"map","image":"/corp-travel.webp","descFr":"Versailles, Champagne, Normandie, châteaux — itinéraires privés.","descEn":"Versailles, Champagne, Normandy, châteaux — private itineraries."}'),
 ('service','concierge','Conciergerie',120,'{"fr":"Conciergerie","en":"Concierge Services","icon":"bell","image":"/why-phone.webp","descFr":"Demandes sur mesure, réservations et coordination 24/7.","descEn":"Bespoke requests, reservations and 24/7 coordination."}');

-- ————— Partenaires (logos marquee) —————
DELETE FROM cms_entries WHERE collection = 'partner';
INSERT INTO cms_entries (collection, slug, title, position, data) VALUES
 ('partner','ritz','Ritz Paris',10,'{"name":"Ritz Paris","src":"/logo-ritz.webp"}'),
 ('partner','bristol','Le Bristol',20,'{"name":"Le Bristol","src":"/logo-bristol.webp"}'),
 ('partner','four-seasons','Four Seasons',30,'{"name":"Four Seasons","src":"/logo-four-seasons.webp"}'),
 ('partner','mandarin','Mandarin Oriental',40,'{"name":"Mandarin Oriental","src":"/logo-mandarin.webp"}'),
 ('partner','lvmh','LVMH',50,'{"name":"LVMH","src":"/logo-lvmh.webp"}'),
 ('partner','dior','Dior',60,'{"name":"Dior","src":"/logo-dior.webp"}'),
 ('partner','kering','Kering',70,'{"name":"Kering","src":"/logo-kering.webp"}'),
 ('partner','airfrance','Air France',80,'{"name":"Air France","src":"/logo-airfrance.webp"}'),
 ('partner','netjets','NetJets',90,'{"name":"NetJets","src":"/logo-netjets.webp"}'),
 ('partner','quintessentially','Quintessentially',100,'{"name":"Quintessentially","src":"/logo-quintessentially.webp"}'),
 ('partner','amex','American Express',110,'{"name":"American Express","src":"/logo-amex.webp"}'),
 ('partner','ak','AK',120,'{"name":"AK","src":"/logo-ak.webp"}');

-- ————— Adresses prestigieuses —————
DELETE FROM cms_entries WHERE collection = 'address';
INSERT INTO cms_entries (collection, title, position, data) VALUES
 ('address','Avenue des Champs-Élysées',10,'{"label":"Avenue des Champs-Élysées"}'),
 ('address','Place Vendôme',20,'{"label":"Place Vendôme"}'),
 ('address','Le Bourget · Aviation d’Affaires',30,'{"label":"Le Bourget · Aviation d’Affaires"}'),
 ('address','Monaco · Monte-Carlo',40,'{"label":"Monaco · Monte-Carlo"}'),
 ('address','Côte d’Azur',50,'{"label":"Côte d’Azur"}'),
 ('address','Versailles',60,'{"label":"Versailles"}'),
 ('address','Deauville',70,'{"label":"Deauville"}'),
 ('address','Courchevel',80,'{"label":"Courchevel"}');

-- ————— FAQ —————
DELETE FROM cms_entries WHERE collection = 'faq';
INSERT INTO cms_entries (collection, title, position, data) VALUES
 ('faq','Les tarifs affichés sont-ils TTC ?',10,'{"q":"Les tarifs affichés sont-ils TTC ?","a":"Oui, tous les prix de la grille 2026-2027 sont affichés TTC, par transfert dans un sens ou dans l’autre."}'),
 ('faq','Un aller-retour, comment est-il facturé ?',20,'{"q":"Un aller-retour, comment est-il facturé ?","a":"Un aller-retour est facturé comme deux transferts distincts."}'),
 ('faq','Le Meet & Greeter inclut-il le véhicule ?',30,'{"q":"Le Meet & Greeter inclut-il le véhicule ?","a":"Non. Le service Meet & Greeter n’inclut ni le véhicule ni le chauffeur : le transport se réserve et se facture séparément."}'),
 ('faq','Quelle est la durée minimale d’une mise à disposition ?',40,'{"q":"Quelle est la durée minimale d’une mise à disposition ?","a":"Les mises à disposition horaires requièrent un minimum de 3 heures consécutives."}'),
 ('faq','Des suppléments peuvent-ils s’appliquer ?',50,'{"q":"Des suppléments peuvent-ils s’appliquer ?","a":"Oui. L’attente supplémentaire, les arrêts additionnels, le parking, les péages, les services de nuit et les périodes d’événements peuvent entraîner des frais additionnels, toujours annoncés en amont."}'),
 ('faq','Opérez-vous partout en France ?',60,'{"q":"Opérez-vous partout en France ?","a":"Oui — nos opérations sont nationales : Paris et Île-de-France, Côte d’Azur, et l’ensemble du territoire pour vos transferts, tournées et événements."}');
