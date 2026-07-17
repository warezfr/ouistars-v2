# Back-office

Interface opérationnelle Oui Stars, montée sous `/admin/*` (`src/admin/`). Shell : `AdminLayout` (sidebar + header). Routage : `AdminApp`.

## Modules

| Route | Module | Rôle |
|---|---|---|
| `/admin` | Tableau de bord | KPIs (réservations 30j, chiffre estimé, devis en cours, taux d'assignation) |
| `/admin/bookings` | Réservations | Liste, statut, assignation chauffeur/véhicule |
| `/admin/quotes` | Devis & Événements | Devis DMC / Fashion Weeks / congrès / délégations |
| `/admin/pricing` | Tarifs 2026-2027 | Affichage lecture seule de la grille officielle |
| `/admin/documents` | Documents chauffeurs | Génération bon de commande / fiche de mission (PDF) |
| `/admin/drivers` | Chauffeurs | Fiches chauffeurs (réseau de partenaires) |
| `/admin/vehicles` | Flotte | Parc véhicules (classe, immatriculation, statut) |

## Données : mock → Supabase

Actuellement, les pages consomment `src/admin/mockData.ts` (`BOOKINGS`, `QUOTES`, `KPIS`, `badgeClass`). À remplacer par des requêtes Supabase sur les tables réelles :

| Écran admin | Table Supabase |
|---|---|
| Réservations | `website_bookings` |
| Devis & Événements | `quotes` |
| Chauffeurs | `ops_drivers` + `chauffeur_applications` |
| Flotte | `ops_vehicles` |
| Documents | `ops_documents` |
| Tarifs | `pricing_routes` · `pricing_meet_greet` · `pricing_special` |
| Factures | `ops_invoices` |

Migrations : `supabase/migrations/0001_core_schema.sql`, `0002_pricing_2026_2027.sql`, `0003_documents.sql`.

## Authentification & rôles

**À brancher.** `AdminApp` n'a pas encore de garde d'accès. Cible :

- **Supabase Auth** (e-mail/mot de passe ou magic link) devant `/admin/*`.
- **Rôles** (ex. `ops`, `admin`) portés par `app_metadata` ou une table `profiles`, contrôlant l'accès aux modules sensibles (tarifs, facturation).
- **RLS** : les tables `website_bookings`, `quotes`, `chauffeur_applications`, `ops_invoices` ont déjà `row level security` activé — les policies de lecture pour les utilisateurs authentifiés du back-office restent à écrire (aujourd'hui, seule la clé `service_role` côté API écrit).

## Workflow réservation → assignation → documents

```
1. RÉCEPTION      website_bookings.status = 'pending'
                  (créée par POST /api/intake depuis le site)
        │
2. ASSIGNATION    ops choisit driver_id + vehicle_id
                  status = 'pending' → 'assigned'
        │
3. DOCUMENTS      POST /api/documents/generate
                  ├─ bon de commande (nominatif client)
                  └─ fiche de mission (nominatif chauffeur)
                  [cible] upload Storage + INSERT ops_documents + e-mail auto
        │
4. RÉALISATION    status = 'completed'
        │
5. FACTURATION    ops_invoices (draft → sent → paid)
```

Statuts `website_bookings` : `pending` · `confirmed` · `assigned` · `completed` · `cancelled`.
Statuts `quotes` : `new` · `in_progress` · `sent` · `accepted` · `rejected` · `invoiced` · `lost`.

Voir le détail des flux dans [ARCHITECTURE.md](ARCHITECTURE.md) et les endpoints dans [API.md](API.md).
</content>
