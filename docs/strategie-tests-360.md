# Stratégie de tests 360° — Oui Stars

**Périmètre :** site public (React 19 + Vite), back-office `/admin` (AdminLTE), APIs Vercel (`/api/*`), modules serveur (`server/etg`, `server/pricing`, `server/pdf`, `server/email`), base Supabase (RLS, migrations).
**État des lieux : 0 test automatisé aujourd'hui.** Seuls `tsc --noEmit` et `eslint` protègent le code. Tout le filet de sécurité est à construire.

---

## 1. Inventaire de ce qu'il faut protéger

| Zone | Modules | Criticité | Pourquoi |
|---|---|---|---|
| **Moteur tarifaire** | `src/lib/pricing.ts`, `estimate.ts`, `livePricing.ts`, `server/pricing/live.ts`, `data/pricing.ts` | ★★★ | C'est de l'argent. Une régression = mauvais prix affiché **et** facturé (le serveur recalcule depuis la même source). |
| **Capture de leads** | `api/intake.ts` (339 l.) : booking, quote, chauffeur, greeter, newsletter | ★★★ | Chaque bug = client perdu. Rate-limit, honeypot, Zod, e-mails. |
| **API partenaire ETG** | `api/search|book|cancel|status`, `server/etg/*` (auth, engine, handlers, repository) | ★★★ | Exposée à l'extérieur, authentifiée, contractuelle. |
| **Back-office Tarification** | `admin/pages/Pricing.tsx` (462 l.) + sync ETG auto | ★★★ | Source de vérité des prix : une sauvegarde cassée corrompt tout l'aval. |
| **Wizard Meet & Greet** | `MeetGreetWizard.tsx`, `MeetGreeter.tsx` | ★★ | Parcours multi-étapes avec état ; fragile par nature. |
| **Calculateur hero** | `FareCalculator.tsx`, `geocode.ts`, `estimate.ts` | ★★ | Premier contact du visiteur avec un prix. |
| **Documents PDF** | `server/pdf/*`, `api/documents/*` | ★★ | Factures/bons de mission : erreurs visibles par les clients. |
| **CMS / contenu** | `src/lib/cms.ts`, collections Supabase, replis statiques | ★ | Dégradé si Supabase HS → le repli doit marcher. |
| **UI vitrine** | Galeries, rails auto, popups, i18n FR/EN, séparateurs | ★ | Régressions visuelles, accessibilité. |

---

## 2. Outillage recommandé (adapté au dépôt)

- **Vitest** + **@testing-library/react** + **jsdom** — unitaires et composants (natif Vite, zéro config).
- **MSW** (Mock Service Worker) — mocker Supabase/REST dans les tests composants.
- **Playwright** (`playwright-core` déjà utilisable, Chromium présent) — E2E, régression visuelle, a11y (`@axe-core/playwright`).
- **Invocation directe des handlers Vercel** pour l'intégration API : chaque fichier `api/*.ts` exporte `handler(req,res)` → testable sans serveur avec des objets req/res simulés (pas besoin de `vercel dev` en CI).
- **Scripts à ajouter** : `test`, `test:watch`, `test:api`, `test:e2e`, `test:a11y`, `coverage`.

Pyramide cible : **~120 unitaires · ~40 intégration API · ~10 E2E · 6 visuels · 3 a11y**.

---

## 3. Plan par couche

### 3.1 Unitaires (Vitest) — la fondation

**Moteur tarifaire (priorité absolue)**
- `computeFare` : route fixe (E/V/S), horaire avec plancher 3 h (`hours: 1 → 3 × taux`), au km (arrondi au multiple de 5, plancher 100 €), classe inconnue.
- `estimate.ts` : `searchLocations` (accents : « épernay » trouve Épernay ; score préfixe > inclusion), `haversineKm` (Paris→CDG ≈ 23 km ±10 %), ZONE_ROUTE_MAP → bascule fixed-route vs per-km.
- `serverPrice` (extrait d'intake) : **aller-retour = ×2**, `routeId` inconnu + `distanceKm` → per-km, ni l'un ni l'autre → `null`. *Test anti-fraude : le montant envoyé par le navigateur ne doit jamais être utilisé.*
- `server/pricing/live.ts` : repli statique si Supabase indisponible ; cache 60 s (2 appels < 60 s = 1 requête) ; fusion partielle (la grille DB ne couvre que 3 routes → les autres gardent le prix statique).
- `livePricing.ts` (front) : la mutation en place de `ROUTE_RATES` est bien vue par `usePricingSync` (useSyncExternalStore notifié), et un id inconnu en DB n'ajoute pas de route fantôme.
- **Test de cohérence de la grille** (garde-fou données) : snapshot des 3 totaux E/V/S de `ROUTE_RATES` — toute modification de prix devient un diff de PR explicite ; unicité des `id` ; `prices.E ≤ prices.S` pour chaque route.

**Sécurité / plomberie API**
- `server/etg/auth.ts` : `hashToken` stable ; `safeEqual` (longueurs différentes → false) ; Bearer statique env ; Basic hérité ; en-tête absent/malformé → false.
- Rate-limit d'intake : 21ᵉ requête même IP < 60 s → `429` ; IP différente → passe ; fenêtre glissante (attendre 61 s simulé avec fake timers → repasse).
- Honeypot : `website` rempli → `200 { reference: 'OS-OK' }` **sans** insertion.
- Schémas Zod : email invalide rejeté, `passengers: 0` rejeté, champ inconnu retiré (`.strip()`), `notes` de 5 000 caractères rejetée.
- `insertResilient` : PGRST204 → retire la colonne et réessaie ; boucle bornée à 12 ; autre erreur → remontée telle quelle.
- `esc()` : injection `<script>` dans un nom → échappée dans l'e-mail.

**ETG**
- `server/etg/pricing/engine.ts` + `geo.ts` : mêmes montants que la grille publique pour 5 routes témoins (cohérence front ↔ partenaire) ; `store/memory.ts` : cycle book → status → cancel.

### 3.2 Intégration API (handlers Vercel invoqués directement)

| Endpoint | Cas à couvrir |
|---|---|
| `POST /api/intake` | 4 types (booking/quote/chauffeur/greeter) → 200 + référence `WEB-…` ; `OPTIONS` → 200 ; `GET` → 405 ; Supabase absent (env vides) → dégradé propre ; `official_amount` recalculé ≠ montant client falsifié. |
| `GET /api/flight` | Numéro reconnu (mock AeroDataBox) → détails ; upstream 500 → erreur douce ; clé absente → 503, pas de crash. |
| `POST /api/pricing/quote` | Route fixe, horaire, km — mêmes montants que `computeFare` (contrat front/serveur). |
| `POST /api/search` (ETG) | Sans auth → 401 ; Bearer valide → 200 + offres ; Basic hérité → 200 ; payload invalide → 400 avec code d'erreur ETG. |
| `POST /api/book` → `status` → `cancel` | Cycle complet sur le store mémoire ; double annulation → erreur idempotente. |
| `POST /api/documents/generate` | PDF non vide, en-tête `%PDF`, montants formatés ; type de document inconnu → 400. |

*Astuce : factoriser un helper `invoke(handler, { method, body, headers })` qui fabrique des `VercelRequest/Response` simulés — 15 lignes, réutilisé partout.*

### 3.3 Composants front (Vitest + Testing Library)

- **FareCalculator** : saisie « CDG » → suggestion aéroport ; sélection départ+arrivée connus → 3 prix affichés = grille ; aller-retour coché → ×2 ; mode horaire 2 h → forcé à 3 h.
- **MeetGreetWizard** : parcours nominal (arrivée → aéroport → formulaire prérempli → envoi mocké) ; bouton retour conserve les choix ; champs obligatoires bloquants ; prix affiché = `MEET_GREET_RATES`.
- **Modals** : soumission → `POST /api/intake` (MSW) → écran référence ; erreur réseau → message d'erreur, pas de crash ; Escape ferme.
- **Galeries « Tout afficher »** (Packages + Corporate) : ouverture, 6 cartes, clic carte → ferme la galerie **et** ouvre la fiche détail ; clic overlay ferme ; rail auto en pause (`paused: true`).
- **i18n** : bascule EN → tous les libellés testés changent ; aucune clé manquante (test qui parcourt fr.ts/en.ts et compare les arborescences de clés — les dérives FR/EN sont un bug déjà plausible).
- **cms.ts** : Supabase répond → contenu publié ; Supabase en erreur → repli statique silencieux.

### 3.4 Back-office

- **Garde d'authentification** : accès `/admin/*` sans session → redirection login (test composant sur le routeur admin).
- **Pricing.tsx (le plus critique)** : édition inline d'un prix → upsert Supabase (MSW) avec la bonne ligne **et** appel de `syncEtgRoute` ; échec réseau → message, pas de perte de saisie ; filtres type/catégorie/recherche → sous-ensembles corrects ; « Resynchroniser tout » → un appel par route.
- **ApiKeys.tsx** : génération → le token clair est montré une fois, seul le **hash** part en base (vérifier le payload MSW) ; révocation → clé inutilisable (test intégration avec `verifyBearer`).
- **Bookings.tsx** : changement de statut → update + (si branché) e-mail ; montants affichés = `official_amount`, jamais le montant client.
- **E2E pipeline prix (le test-roi du back-office)** : *admin modifie Paris⇄Versailles 110 → 115 € → le front (FareCalculator + grille + galerie) affiche 115 € → `api/intake` calcule 115 € → la fiche ETG renvoie 115 €.* C'est LE test qui valide la promesse « tarification coordonnée ».

### 3.5 E2E Playwright (contre `vite preview` + mocks)

1. Réservation complète depuis le calculateur hero (happy path).
2. Wizard Meet & Greet de bout en bout, avec retour arrière.
3. Galeries : ouvrir, naviguer, fiche détail, réserver préréempli.
4. Bascule FR/EN puis parcours réservation en anglais.
5. Admin : login → édition prix → vérification front (pipeline ci-dessus).
6. Admin : création clé API → appel `api/search` avec cette clé → 200.
7. Mobile 390 px : hero, wizard, galerie, footer (pas de débordement horizontal : `scrollWidth === innerWidth`).
8. `prefers-reduced-motion` : rails immobiles, marquees arrêtés.

### 3.6 Non-fonctionnel

- **Régression visuelle** : screenshots Playwright des 6 blocs clés (hero, services, flotte, galeries, grille tarifaire, footer) desktop + mobile, comparés avec `maxDiffPixelRatio: 0.01`. C'est la parade directe aux régressions déjà vécues (CSS tronqué, sections disparues).
- **Accessibilité** : axe-core sur home, wizard ouvert, galerie ouverte — zéro violation « serious/critical » ; piège à focus dans les popups ; contraste or/nuit sur les textes ≤ 0.8 rem.
- **Performance** : Lighthouse CI budgets — LCP < 2,5 s (attention à la vidéo hero), JS initial < 600 kB (actuel : 577 kB, à surveiller), CLS < 0.1.
- **Sécurité** :
  - Test build : `grep` du bundle `dist/` — la **service-role key** et `RESEND_API_KEY` ne doivent jamais y apparaître (seule `VITE_SUPABASE_*` anon est tolérée).
  - RLS : avec la clé anon, écriture dans `cms_entries`/`etg_api_keys` → refusée ; lecture des leads → refusée.
  - Intake : XSS dans les champs → e-mails échappés ; référence non prédictible.

---

## 4. Failles probables détectées à la loupe (à tester en premier)

1. **Rate-limit en mémoire par instance serverless** (`api/intake.ts`) : chaque lambda a sa propre `Map` → la limite réelle est ~20 × N instances, et `hits.clear()` à 5 000 IP remet tout le monde à zéro. Test qui documente la limite + recommandation (Upstash/Vercel KV) si un durcissement réel est voulu.
2. **Mutation en place de `ROUTE_RATES`** (`livePricing.ts`) : tout module qui copie les tableaux au chargement (ex. `const routes = ROUTE_RATES.filter(...)` dans `Packages.tsx`) fige des références — le test « pipeline prix » révélera si un bloc n'est pas réactif.
3. **Divergence des deux moteurs** : `src/lib/pricing.ts` (front) et `server/etg/pricing/engine.ts` (partenaire) implémentent les mêmes règles séparément → test de contrat sur 5 routes témoins obligatoire.
4. **Basic Auth héritée** toujours acceptée si les env existent — test qui échoue le jour où on veut la retirer (rappel exécutable).
5. **Clés i18n** : aucune vérification d'isomorphisme fr/en aujourd'hui.
6. **`insertResilient`** masque silencieusement des colonnes manquantes (leads partiellement enregistrés sans alerte) — tester que `dropped` est loggé/notifié.

---

## 5. Cibles de couverture et CI

| Couche | Cible lignes | Non négociable |
|---|---|---|
| `src/lib/` + `server/pricing` + `server/etg/pricing|auth` | **90 %** | tout ce qui touche un prix ou une clé |
| `api/*` | **80 %** | branches d'erreur incluses |
| Composants interactifs (wizard, calculateur, modals, Pricing admin) | **70 %** | parcours + erreurs |
| UI vitrine statique | pas de cible | couverte par visuel/E2E |

**Pipeline GitHub Actions** (`.github/workflows/ci.yml`) : `typecheck` → `lint` → `vitest --coverage` (gates ci-dessus) → `build` → `grep` sécurité du bundle → Playwright E2E + visuel + axe sur `vite preview` → Lighthouse CI. PR bloquée si un étage échoue. Les snapshots visuels se mettent à jour uniquement via un label `visual-approved`.

---

## 6. Feuille de route

| Semaine | Livrable | Volume |
|---|---|---|
| **S1 — Fondations** | Vitest installé, helpers (`invoke`, MSW, fake timers), tests moteur tarifaire + grille + auth + rate-limit/honeypot | ~50 tests |
| **S2 — APIs** | Intégration complète intake/flight/quote/ETG/documents + tests de contrat des deux moteurs | ~40 tests |
| **S3 — Front & admin** | Composants (wizard, calculateur, modals, galeries, i18n) + Pricing/ApiKeys admin | ~45 tests |
| **S4 — E2E & CI** | 8 scénarios Playwright, visuel, axe, Lighthouse, pipeline CI avec gates | ~20 scénarios |

Le point de départ recommandé est S1 : c'est là que vivent les prix, et c'est le seul étage dont chaque test protège directement du chiffre d'affaires.
