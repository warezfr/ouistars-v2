# Roadmap

Trois horizons de priorité. P0 et P1 sont livrés ; P2 structure la suite.

## P0 — Socle opérationnel ✅ (fait)

- **Grille tarifaire 2026-2027** : données (`src/data/pricing.ts`) + réplique Supabase (`0002_pricing_2026_2027.sql`).
- **Moteur de calcul** (`src/lib/pricing.ts`) : trajet fixe, horaire (min 3 h), au km, Meet & Greeter.
- **Calculateur public** (`FareCalculator`) branché sur le moteur.
- **Page admin Tarifs** (lecture de la grille).
- **Génération PDF** : bon de commande (nominatif client) + fiche de mission (nominatif chauffeur) via `server/pdf/*` et `api/documents/generate`.
- **Meet & Greeter** : tarifs CDG&ORY / NCE / LBG, mention « hors véhicule/chauffeur ».

## P1 — Repositionnement ✅ (fait)

- **Positionnement** « Premium Mobility, Destination Management & Event Solutions Across France ».
- **Nouveau menu** (`MAIN_NAV`) : Mobilité Premium · DMC · Gestion de Flotte · Aéroports & Meet & Greeter · Événements & Congrès · Fashion Weeks · Circuits & Expériences · Contact.
- **Catalogue de services élargi** : DMC, Fashion Weeks, Aviation Privée & d'Affaires, Concierge, Ambassades & Délégations, Hôtels & Hospitality…
- **Section « Les Plus Prestigieuses Adresses de France »** (remplace les marques mondiales).
- **CTA « Rejoindre notre réseau de partenaires »** (ex-« Devenir Chauffeur Partenaire »).

## P2 — Consolidation (à faire)

- **Finalisation du flux documents** : chargement Supabase réel, upload Storage, envoi e-mail automatique en pièce jointe (Resend) à la confirmation.
- **Pages de contenu & SEO multi-pages** : éclater la mono-page en routes dédiées (Mobilité, DMC, Événements, Fashion Weeks…) pour le référencement.
- **Mini-CMS** : édition de la grille tarifaire et des contenus depuis le back-office (tables `pricing_*` déjà en place).
- **Auth Supabase + rôles** devant `/admin/*`, policies RLS de lecture back-office.
- **Remplacement des données mock** (`src/admin/mockData.ts`) par des requêtes Supabase.
- **Paiement** en ligne (acompte / règlement).
- **Analytics** : GA4 / GTM, suivi conversions (réservation, devis, newsletter).
</content>
