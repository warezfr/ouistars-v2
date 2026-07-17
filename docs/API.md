# API

Trois fonctions serverless dans `api/`, déployées comme **Vercel Functions**.

> ⚠️ Ces endpoints **ne tournent pas** avec `vite preview` ni sur un hébergement statique. En local, utiliser `vercel dev` ; en production, le déploiement Vercel. Toutes les réponses sont en JSON, sauf `documents/generate` qui renvoie un `application/pdf`.

---

## `POST /api/pricing/quote`

Calcule un tarif à partir de la grille officielle 2026-2027 (`src/data/pricing.ts`).

**Payload**
```json
{ "routeId": "cdg-ory-lbg-paris", "vehicleClass": "S", "hours": 0, "km": 0 }
```
`vehicleClass` : `E` | `V` | `S` (défaut `E`). Priorité : `routeId` > `hours` > `km`.

**Réponses**
```json
{ "amount": 210, "currency": "EUR", "basis": "fixed-route", "label": "Aéroports Paris (CDG • ORY • LBG) ⇄ Paris" }
{ "amount": 240, "currency": "EUR", "basis": "hourly", "hours": 3 }
{ "amount": 175,  "currency": "EUR", "basis": "per-km" }
```
`400` si ni `routeId`, ni `hours`, ni `km` exploitable. `405` hors POST.

---

## `POST /api/intake`

Capture des leads du site et écriture dans Supabase (clé `service_role`), puis notification ops (Resend — *TODO*).

**Payload**
```json
{ "type": "booking", "channel": "siteweb", "data": { "first_name": "…", "email": "…", "…": "…" } }
```
`type` : `booking` | `quote` | `chauffeur` | `newsletter`.
Pour `newsletter`, fournir `email` à la racine au lieu de `data`.

| `type` | Table Supabase |
|---|---|
| `booking` | `website_bookings` |
| `quote` | `quotes` |
| `chauffeur` | `chauffeur_applications` |
| `newsletter` | `newsletter_subscribers` |

**Réponse**
```json
{ "success": true, "reference": "OS-8F2K1A" }
```
Une `reference` (`OS-XXXXXX`) est générée à chaque appel (`newsletter` mise à part). `400` si `type` absent, `405` hors POST, `500` en cas d'échec d'écriture. CORS ouvert (`*`), préflight `OPTIONS` géré.

> Si les variables `VITE_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` sont absentes, l'endpoint répond `success` sans persister (mode dégradé).

---

## `POST /api/documents/generate`

Génère un PDF opérationnel via `server/pdf/*`.

**Payload**
```json
{ "reference": "OS-8F2K1A", "type": "purchase_order" }
```
`type` : `purchase_order` (bon de commande, nominatif client) | `mission_sheet` (fiche de mission, nominatif chauffeur).

**Réponse** : le binaire PDF.
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="purchase_order-OS-8F2K1A.pdf"
```
`400` si `reference` ou `type` manquant, `405` hors POST.

> **État actuel :** les données de mission sont *stubbed* (démo en dur). En production : `SELECT` sur `website_bookings` via `reference`, upload Supabase Storage (bucket `documents`), `INSERT ops_documents`, puis envoi e-mail au chauffeur/client en pièce jointe.

---

## Notes transverses

- **CORS** : `intake` et `pricing/quote` renvoient `Access-Control-Allow-Origin: *` et gèrent `OPTIONS`.
- **Clés** : seule la couche API utilise `SUPABASE_SERVICE_ROLE_KEY` ; le front n'a que la clé anon.
- **Générateurs PDF** (`server/pdf/purchaseOrder.ts`, `missionSheet.ts`, `pdfBase.ts`) sont des fonctions pures `data → Buffer`, indépendantes du transport HTTP.
</content>
