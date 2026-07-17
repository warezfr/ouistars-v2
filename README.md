# Oui Stars — v2

**Premium Mobility, Destination Management & Event Solutions Across France.**

Refonte complète de la plateforme Oui Stars : mobilité premium, transferts avec chauffeur, Destination Management (DMC) et solutions événementielles. Le dépôt réunit le site public (mono-page sombre premium), le back-office opérationnel, les fonctions serveur (API Vercel, génération PDF) et le schéma Supabase.

---

## Stack

| Domaine | Technologie |
|---|---|
| Front | React 19, Vite 7, TypeScript |
| Routage | react-router-dom 7 |
| i18n | FR / EN (contexte maison, `src/i18n`) |
| Base de données | Supabase (Postgres + Storage) |
| Fonctions serveur | Vercel Functions (`api/`), `@vercel/node` |
| PDF | pdfkit (`server/pdf/`) |
| E-mail | Resend (à brancher) |

Alias d'import : `@` → `src`.

---

## Installation

```bash
# 1. Dépendances
npm install

# 2. Variables d'environnement
cp .env.example .env
# renseigner VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, etc.

# 3. Base de données Supabase (dans l'ordre)
#    Appliquer les migrations depuis supabase/migrations/ :
#    0001_core_schema.sql · 0002_pricing_2026_2027.sql · 0003_documents.sql
#    via `supabase db push` ou l'éditeur SQL du dashboard.

# 4. Lancer en développement
npm run dev
```

### Variables d'environnement (`.env`)

| Clé | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (fonctions API, écriture) |
| `OPS_NOTIFY_EMAIL` | Adresse de notification ops |
| `RESEND_API_KEY` | Envoi d'e-mails transactionnels |
| `VITE_WHATSAPP_NUMBER` | Numéro WhatsApp CTA |
| `VITE_CONTACT_EMAIL` | E-mail de contact affiché |

---

## Scripts npm

| Script | Action |
|---|---|
| `npm run dev` | Serveur de dev Vite (port 5173) |
| `npm run build` | `tsc -b` puis build Vite |
| `npm run preview` | Prévisualisation du build statique |
| `npm run typecheck` | Vérification TypeScript sans émission |
| `npm run lint` | ESLint |

> ⚠️ `vite preview` et le build statique ne servent **que** le front. Les endpoints `api/*` sont des Vercel Functions : ils tournent en `vercel dev` ou une fois déployés, pas en preview statique. Voir [docs/API.md](docs/API.md).

---

## Structure des dossiers

```
ouistars-v2/
├── api/                    Fonctions Vercel (serverless)
│   ├── intake.ts           Capture leads (booking/quote/chauffeur/newsletter)
│   ├── pricing/quote.ts    Calcul tarif (grille 2026-2027)
│   └── documents/generate.ts  Génération PDF (bon de commande / fiche de mission)
├── server/
│   └── pdf/                Générateurs pdfkit (purchaseOrder, missionSheet, pdfBase)
├── src/
│   ├── pages/HomePage.tsx  Assemblage de la mono-page publique
│   ├── components/         home/ · layout/ · modals/ · ui/
│   ├── admin/              Back-office (AdminApp, layout, pages, mockData)
│   ├── data/               pricing.ts · services.ts · fleet.ts
│   ├── lib/                pricing.ts (moteur) · supabase.ts
│   ├── i18n/               fr.ts · en.ts · index.tsx
│   └── styles/             tokens.css · global.css
├── supabase/migrations/    0001 core · 0002 pricing · 0003 documents
└── docs/                   Documentation projet
```

---

## Documentation

| Document | Contenu |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Couches, flux réservation, flux documents |
| [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) | Palette, typographies, tokens, composants |
| [docs/PRICING.md](docs/PRICING.md) | Grille tarifaire 2026-2027 complète + moteur |
| [docs/BACKOFFICE.md](docs/BACKOFFICE.md) | Modules ops, mock → Supabase, workflow |
| [docs/API.md](docs/API.md) | Endpoints, payloads, réponses |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Priorités P0 / P1 / P2 |
| [docs/CONSIGNES.md](docs/CONSIGNES.md) | Consignes client + statut d'implémentation |
</content>
</invoke>
