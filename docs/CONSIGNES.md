# Consignes client

Suivi des consignes du document « consigne mail v1 » (16/07/2026) et de leur statut d'implémentation.

**Légende :** ✅ Fait · 🟡 Partiel · ⬜ À faire

---

## 1. Repositionnement Premium / DMC / Événementiel + nouveau menu — ✅ Fait

Positionnement « Premium Mobility, Destination Management & Event Solutions Across France ». Nouveau menu principal dans `src/data/services.ts` (`MAIN_NAV`) : Mobilité Premium, Destination Management (DMC), Gestion de Flotte, Aéroports & Meet & Greeter, Événements & Congrès, Fashion Weeks, Circuits & Expériences, Contact. Catalogue de services élargi (`SERVICES`) : DMC, Fashion Weeks, Aviation Privée & d'Affaires, Concierge, Ambassades & Délégations, Hôtels & Hospitality, etc.

## 2. « Devenir Chauffeur Partenaire » → « Rejoindre notre réseau de partenaires » — ✅ Fait

CTA renommé ; le formulaire alimente `chauffeur_applications` via `POST /api/intake` (`type: 'chauffeur'`).

## 3. Section « Nous opérons à travers / Les Plus Prestigieuses Adresses de France » — ✅ Fait

Composant `PrestigiousAddresses` alimenté par `PRESTIGIOUS_ADDRESSES` (`src/data/services.ts`). Remplace la section des marques mondiales. Adresses : Champs-Élysées, Place Vendôme, Le Bourget, Monaco / Monte-Carlo, Côte d'Azur, Versailles, Deauville, Courchevel.

## 4. Documents automatiques à la confirmation d'une réservation — 🟡 Partiel

Attendu : à la confirmation, générer **bon de commande + PDF nominatif client** et **fiche de mission chauffeur**, envoyés en pièce jointe par e-mail automatique.

- ✅ **Brique PDF** : `server/pdf/purchaseOrder.ts` (bon de commande, nominatif client), `server/pdf/missionSheet.ts` (fiche de mission chauffeur), `server/pdf/pdfBase.ts` (helpers). Endpoint `api/documents/generate.ts` opérationnel.
- 🟡 **À finaliser** : chargement de la réservation réelle depuis Supabase (aujourd'hui données de démo en dur), upload Storage (`ops_documents`), et **déclenchement automatique + envoi e-mail** (Resend) au passage en `assigned`.

## 5. Meet & Greeter — ✅ Fait

Tarifs implémentés (`MEET_GREET_RATES`, migration `0002`) :
- Paris CDG & ORY : **280 €** (3 pax / 3 bagages, **+50 €/pax**).
- Nice NCE : **320 €** (3 pax / 3 bagages, **+70 €/pax**).
- Le Bourget LBG : **sur devis** (—).

Mention « le tarif n'inclut ni le véhicule ni le chauffeur » présente (`MEET_GREET_DISCLAIMER`).

## 6. Grille tarifaire 2026-2027 complète + calculateur — ✅ Fait

- **Données** : `src/data/pricing.ts` + réplique Supabase `0002_pricing_2026_2027.sql`.
- **Moteur** : `src/lib/pricing.ts` (trajet fixe, horaire min 3 h, au km, Meet & Greeter).
- **Calculateur public** : `src/components/home/FareCalculator.tsx`.
- **Page admin** : Tarifs 2026-2027 (lecture de la grille).

Grille complète et règles détaillées dans [PRICING.md](PRICING.md).

---

## Récapitulatif

| # | Consigne | Statut |
|---|---|---|
| 1 | Repositionnement + nouveau menu | ✅ Fait |
| 2 | « Rejoindre notre réseau de partenaires » | ✅ Fait |
| 3 | Section « Prestigieuses Adresses de France » | ✅ Fait |
| 4 | Documents PDF auto + e-mail à la confirmation | 🟡 Partiel (PDF fait, auto/e-mail à finaliser) |
| 5 | Meet & Greeter (tarifs + mention) | ✅ Fait |
| 6 | Grille 2026-2027 + calculateur | ✅ Fait |
</content>
