# Architecture

Oui Stars v2 s'organise en cinq couches distinctes, du client public à la base de données.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│  FRONT public (src/pages, src/components, src/i18n)          │
│  Mono-page premium sombre · FR/EN · calculateur · modals    │
└───────────────┬─────────────────────────────────────────────┘
                │ fetch (JSON)
┌───────────────▼─────────────────────────────────────────────┐
│  ADMIN back-office (src/admin)                              │
│  AdminApp routes · AdminLayout sidebar · pages ops          │
└───────────────┬─────────────────────────────────────────────┘
                │ fetch (JSON)
┌───────────────▼─────────────────────────────────────────────┐
│  API Vercel Functions (api/)                                │
│  intake · pricing/quote · documents/generate                │
└──────┬───────────────────────────────┬─────────────────────┘
       │                               │
┌──────▼───────────────┐   ┌───────────▼─────────────────────┐
│  SERVER (server/pdf) │   │  SUPABASE                       │
│  pdfkit → Buffer PDF  │   │  Postgres + Storage             │
│  purchaseOrder        │   │  ops_* · website_bookings ·     │
│  missionSheet         │   │  quotes · documents · pricing_* │
└───────────────────────┘   └─────────────────────────────────┘
```

Une logique tarifaire **partagée** (`src/data/pricing.ts` + `src/lib/pricing.ts`) est consommée à la fois par le front (calculateur), l'admin (affichage grille) et l'API (`api/pricing/quote.ts`) — une seule source de vérité.

---

## Couches

### 1. Front public — `src/`
- `pages/HomePage.tsx` assemble les sections : Nav, Hero (+ FareCalculator), Services, MeetGreeter, Fleet, Packages, Events/Fashion, PrestigiousAddresses, About, Faq, Footer.
- Modals : Booking, Quote, Chauffeur ; CTA WhatsApp flottant.
- i18n FR/EN via `I18nProvider` (`src/i18n/index.tsx`).
- Design tokens : `src/styles/tokens.css`.

### 2. Admin — `src/admin/`
- `AdminApp.tsx` : routes sous `/admin/*`.
- `layout/AdminLayout.tsx` : sidebar + shell.
- Pages : Dashboard, Bookings, Quotes, Pricing, Documents, Drivers, Vehicles.
- Données de démo dans `mockData.ts` (à remplacer par des requêtes Supabase).

### 3. API — `api/` (Vercel Functions)
Fonctions serverless isolées, une par fichier. Voir [API.md](API.md).

### 4. Server — `server/pdf/`
Générateurs pdfkit purs (entrée typée → `Buffer`), sans dépendance HTTP. Réutilisables par l'API et de futures Edge Functions / jobs.

### 5. Supabase — `supabase/migrations/`
Schéma Postgres versionné. Voir [BACKOFFICE.md](BACKOFFICE.md) et [PRICING.md](PRICING.md).

---

## Flux réservation

```
Visiteur → BookingModal (HomePage)
   │  POST /api/intake { type:'booking', channel, data }
   ▼
api/intake.ts
   │  génère reference OS-XXXXXX
   │  INSERT website_bookings (status='pending')
   │  [TODO] notifie ops via Resend
   ▼
Back-office › Réservations
   │  ops assigne un chauffeur + véhicule
   │  status: pending → assigned
   ▼
Génération documents (voir flux ci-dessous)
```

Le calcul de prix peut précéder l'envoi : le calculateur appelle le moteur local (`computeFare`) et/ou `POST /api/pricing/quote`, et le tarif estimé (`route_id`, `vehicle_class`, `price_amount`) est stocké avec la réservation.

---

## Flux génération de documents

Déclenché à la confirmation d'une réservation (passage à `assigned` avec `driver_id`) — consigne client n°4.

```
Réservation confirmée (status='assigned', driver_id)
   │  POST /api/documents/generate { reference, type }
   ▼
api/documents/generate.ts
   │  [TODO] SELECT website_bookings via reference
   ├── type='purchase_order' → server/pdf/purchaseOrder.ts
   │      Bon de commande — nominatif client
   └── type='mission_sheet'  → server/pdf/missionSheet.ts
          Fiche de mission — nominatif chauffeur
   ▼
Buffer PDF
   ├── [actuel]  renvoyé directement (Content-Disposition: attachment)
   └── [cible]   upload Supabase Storage (bucket 'documents')
                 + INSERT ops_documents (storage_path, sent_at)
                 + e-mail au chauffeur/client en pièce jointe (Resend)
```

**État actuel :** la brique PDF (`server/pdf/*`) et l'endpoint sont opérationnels et renvoient le PDF directement. Le chargement depuis Supabase, l'upload Storage et l'envoi e-mail automatique restent à finaliser (statut *Partiel* — voir [CONSIGNES.md](CONSIGNES.md)).

---

## Décisions structurantes

- **Source de vérité tarifaire unique** partagée front / admin / API, doublée en base (`pricing_*`) pour un futur mini-CMS.
- **Générateurs PDF découplés du transport HTTP** : testables et réutilisables hors requête.
- **RLS Supabase** : les tables sensibles n'acceptent que la clé `service_role` (écriture via API), jamais la clé anon.
</content>
