# Grille tarifaire 2026-2027

Source unique : `src/data/pricing.ts` (front + moteur + API), répliquée en base dans `supabase/migrations/0002_pricing_2026_2027.sql`. Version : `2026-2027`.

## Règles générales

- Tous les prix affichés sont **TTC**.
- Chaque prix s'applique à **un transfert**, dans un sens **ou** dans l'autre (tarif identique aller/retour).
- Un **aller-retour = deux transferts** distincts.
- **CDG, ORY et Le Bourget (LBG)** utilisent les mêmes tarifs « Aéroports Paris ».
- **Beauvais (BVA)** dispose de tarifs séparés.
- Mises à disposition **horaires : minimum 3 heures** consécutives.
- Attente supplémentaire, arrêts additionnels, parking, péages, services de nuit et périodes d'événements peuvent entraîner des frais additionnels.
- Le tarif final peut varier selon l'itinéraire, la disponibilité et les contraintes opérationnelles.

## Classes de véhicule

| Code | Classe | Exemple | Passagers | Bagages |
|---|---|---|---|---|
| **E** | E-Class | Mercedes Classe E | 3 | 3 |
| **V** | V-Class | Mercedes Classe V | 7 | 7 |
| **S** | S-Class | Mercedes Classe S / Maybach | 2 | 2 |

---

## Trajets à tarif fixe (TTC, par transfert)

### Paris & Île-de-France

| Trajet | E | V | S |
|---|--:|--:|--:|
| Aéroports Paris (CDG • ORY • LBG) ⇄ Paris | 120 | 130 | 210 |
| Beauvais (BVA) ⇄ Paris | 240 | 250 | 320 |
| Paris ⇄ Paris (intra-muros) | 100 | 110 | 140 |
| Paris ⇄ Disneyland | 150 | 170 | 210 |
| Paris ⇄ Versailles | 110 | 120 | 190 |
| Aéroports Paris ⇄ Versailles | 150 | 170 | 220 |

### Gares de Paris

| Trajet | E | V | S |
|---|--:|--:|--:|
| Paris ⇄ Gares (Nord, Est, Lyon, Montparnasse) | 100 | 110 | 160 |
| Gares Paris ⇄ Aéroports Paris | 140 | 150 | 230 |
| Gares Paris ⇄ Disneyland | 170 | 190 | 230 |

### Côte d'Azur

| Trajet | E | V | S |
|---|--:|--:|--:|
| Nice (NCE) ⇄ Nice ville | 120 | 130 | 200 |
| Nice (NCE) ⇄ Monaco | 200 | 220 | 250 |
| Nice ⇄ Saint-Tropez | 350 | 370 | 450 |

### City-to-city depuis Paris (E = V)

| Trajet | E | V | S |
|---|--:|--:|--:|
| Paris ⇄ Giverny | 280 | 280 | 360 |
| Paris ⇄ Rouen | 490 | 490 | 630 |
| Paris ⇄ Reims | 520 | 520 | 670 |
| Paris ⇄ Épernay | 600 | 600 | 770 |
| Paris ⇄ Deauville | 770 | 770 | 990 |
| Paris ⇄ Honfleur | 820 | 820 | 1050 |
| Paris ⇄ Le Havre | 840 | 840 | 1080 |
| Paris ⇄ Étretat | 910 | 910 | 1170 |
| Paris ⇄ Mont-Saint-Michel | 1260 | 1260 | 1620 |

---

## Tarif horaire (mise à disposition)

Minimum **3 heures** consécutives.

| Classe | Tarif |
|---|--:|
| E-Class | 80 €/h |
| V-Class | 90 €/h |
| S-Class | 110 €/h |

## Tarif au kilomètre

Pour les city-to-city hors grille fixe (« à partir de »).

| Classe | Tarif |
|---|--:|
| E-Class | 3,5 €/km |
| V-Class | 3,5 €/km |
| S-Class | 4,5 €/km |

---

## Meet & Greeter

Service d'accueil aéroport. **N'inclut ni le véhicule ni le chauffeur** — le transport se réserve et se facture séparément.

| Aéroport | Base | Inclus | Passager suppl. |
|---|--:|---|--:|
| Paris — CDG & ORY | 280 € | 3 pax / 3 bagages | +50 €/pax |
| Nice — NCE | 320 € | 3 pax / 3 bagages | +70 €/pax |
| Paris-Le Bourget — LBG | sur devis | 3 pax / 3 bagages | — |

**Prestation incluse :** accueil directement à la porte de l'avion · accès prioritaire Fast Track · assistance au passage des contrôles police aux frontières · assistance à la récupération des bagages · accompagnement jusqu'à la sortie du terminal · coordination avec le transport réservé séparément.

---

## Moteur de calcul

`src/lib/pricing.ts` — `computeFare(input)` applique, dans l'ordre de priorité :

1. **`routeId`** fourni → prix fixe de la grille pour la classe (`basis: 'fixed-route'`).
2. **`hours`** → `max(hours, 3) × tarif horaire` (`basis: 'hourly'`).
3. **`km`** → `km × tarif au km` (`basis: 'per-km'`).

`computeMeetGreet(airportId, passengers)` = `base + max(0, passengers − 3) × supplément` (retourne `null` si l'aéroport est sur devis, ex. LBG).

Consommateurs : `FareCalculator` (front), page **Tarifs 2026-2027** (admin, lecture seule), `POST /api/pricing/quote` (API — voir [API.md](API.md)).
</content>
