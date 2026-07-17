# Étude back-office Oui Stars — structure, pertinence, fiabilité de la chaîne
*17 juillet 2026 — état après refonte AdminLTE + liaison front/CMS*

---

## 1. Nouveau groupement du menu (appliqué)

Le menu est réorganisé en **6 grandes catégories** calquées sur les métiers de l'entreprise :

| Catégorie | Contenu | Rôle |
|---|---|---|
| **Pilotage** | Tableau de bord | KPIs temps réel, dernières réservations |
| **Opérations** | Réservations · Devis & événements · Factures · Clients · Documents & PDF | Le cœur du quotidien : la chaîne commande → prestation → facture |
| **Flotte & chauffeurs** | Chauffeurs · Candidatures · Flotte · Types · Marques | Les ressources qui exécutent les missions |
| **Offre & tarifs** | Trajets & prix · Grille (vue) · Tarifs horaires/km · Forfaits (+catég.) · Destinations (+catég.) | Ce que vous vendez et à quel prix — répliqué sur le site |
| **Site web** | Paramètres du site · Services · Partenaires · Adresses prestige · FAQ | La vitrine, éditée sans toucher au code |
| **Administration** | Utilisateurs & rôles · Pays (référentiel) | Accès, sécurité, données de référence |

**Supprimé du menu à cette occasion** : la section « Outils » entière (Messagerie, Tâches, Calendrier, Gestionnaire de fichiers, Contacts — 5 coquilles vides jamais construites) et « Catég. services » (aucune utilisation côté site).

---

## 2. Ce qu'il faut garder / ce qui est secondaire

### Indispensable (le métier tourne dessus)
- **Réservations** — hub central, branché sur les vraies tables (site + API ETG), statuts, chauffeur, documents.
- **Devis & événements** — vos leads B2B (mariages, congrès, fashion weeks) ; workflow de statut.
- **Factures** — obligation légale et suivi du chiffre.
- **Chauffeurs** — fiche complète (VTC, permis, aéroports) ; alimente l'assignation et les fiches de mission.
- **Trajets & prix + Tarifs horaires/km** — la source unique de vérité tarifaire (site + calculateur).
- **Paramètres du site + Utilisateurs & rôles** — configuration et sécurité.

### Utile, à conserver
- **Clients** (vision consolidée, se remplit seule), **Flotte** (vitrine « Notre flotte » pilotée par la case Afficher), **Forfaits** (pages d'offres), **Candidatures** (recrutement → création de fiche chauffeur en un clic), **FAQ / Partenaires / Services** (contenu vivant du site).

### Secondaire (garder mais sans y investir)
- **Types & Marques de véhicule** — pour une flotte 100 % Mercedes de 6 véhicules, c'est du confort de classement. Utile seulement si la flotte se diversifie.
- **Destinations + catégories** — bien rempli en base **mais aucune section du site ne les affiche encore**. Soit on construit la vitrine « Destinations » sur le site (recommandé, bon pour le SEO), soit ce menu ne sert à rien pour l'instant.
- **Adresses prestige** — cosmétique (bandeau défilant).
- **Pays** — simple référentiel pour les fiches chauffeurs.
- **Documents & PDF** — page devenue en partie redondante : la génération se fait maintenant depuis le volet d'une réservation. À terme, la transformer en **journal des documents émis** ou la retirer.
- **Grille tarifaire (vue)** — lecture seule, doublon partiel de « Trajets & prix » ; conservée car pratique pour imprimer/vérifier d'un coup d'œil.

### Déjà retirés (bonne décision)
Agences, Entreprises, Réservations véhicules, Avis, Popups, Leads, CTA, SEO, Staff, Langues, Corbeille, Blog/Actus/Photos/Vidéos/Équipe/Témoignages/Slides/etc. — soit sans usage réel pour un opérateur mono-agence, soit du contenu que le site n'affiche pas.

---

## 3. Audit de la chaîne réservation → devis → facturation

### 3.1 Chaîne réservation site (wizard)
`Site (wizard) → POST /api/intake → table website_bookings → admin Réservations → documents/facture`

**Ce qui marche** : le parcours est réel de bout en bout — une réservation faite sur le site apparaît dans l'admin, on la confirme, on assigne un chauffeur, on génère ordre de mission / bon de commande / facture.

**Failles de fiabilité détectées (par gravité) :**

1. 🔴 **Le montant n'est pas enregistré.** Le wizard calcule le prix mais ne l'envoie que dans un champ texte (`prefill`) — la colonne `price_amount` reste vide. Conséquences directes : factures à 0,00 €, KPIs de chiffre faussés. *Correctif : envoyer `price_amount` + `route_id`/mode + recalculer le prix côté serveur depuis la grille (jamais faire confiance au montant venant du navigateur).*
2. 🔴 **Aucune notification.** Ni e-mail de confirmation au client, ni alerte à l'équipe ops : une réservation peut passer inaperçue. *Correctif : brancher Resend dans `/api/intake` (client + ops) — la clé `RESEND_API_KEY` suffit, le code de notification existe déjà côté ETG.*
3. 🟠 **`/api/intake` sans validation.** Le corps de la requête est inséré tel quel (`...body.data`) : pas de schéma, pas de limite de débit, pas d'anti-spam. N'importe qui peut écrire des colonnes arbitraires (ex. se mettre `status: completed`). *Correctif : schéma Zod strict (liste blanche de champs), limite de débit, honeypot anti-bot.*
4. 🟠 **Assignation chauffeur fragile** — stockée en balise texte `[chauffeur:...]` dans les notes. Fonctionne, mais c'est de la dette : une vraie colonne (identifiant de la fiche chauffeur) rendrait fiable les fiches de mission et les statistiques par chauffeur.
5. 🟡 **Pas de trace d'audit** (qui a confirmé/annulé, quand) — la table ETG a son journal d'événements, `website_bookings` non.

### 3.2 Chaîne API ETG
`Partenaire → /search /book /status /cancel → etg_orders`

- 🔴 **Persistance non garantie en production** : sans `SUPABASE_SERVICE_ROLE_KEY` sur Vercel, l'API fonctionne sur un store **en mémoire** — les commandes réelles disparaissent au redémarrage de la fonction (les commandes visibles aujourd'hui viennent d'anciens seeds). *Correctif : 2 variables d'environnement à ajouter, c'est tout.*
- 🟠 **Double grille tarifaire** : les prix édités dans « Trajets & prix » alimentent le site, mais l'API ETG lit ses propres `etg_rate_cards`. Risque de vendre deux prix différents. *Correctif : synchroniser les rate cards depuis la collection trajets (ou l'inverse).*

### 3.3 Chaîne devis
`Formulaire site → quotes → admin (workflow) → PDF/popup DEVIS`

- Fonctionnelle, mais **la chaîne s'arrête au devis accepté** : rien ne le transforme en réservation puis en facture. *Correctif : bouton « Convertir en réservation » (copie vers `website_bookings`, statut confirmé, montant repris).* Manque aussi la **création manuelle** d'un devis depuis l'admin (aujourd'hui seul le site en crée).

### 3.4 Facturation
`Réservations facturables → numéro FA-<réf> → PDF / popup / envoi`

- 🔴 **Non conforme au droit français en l'état** : les factures sont générées à la volée, sans registre. La loi impose une **numérotation chronologique continue sans trous** (FA-2026-0001, 0002…), la **conservation** de la facture émise (immuable), et des **mentions obligatoires** absentes du modèle : SIREN/SIRET, forme juridique, adresse du siège, n° TVA intracommunautaire, conditions de règlement/pénalités de retard. *Correctif : table `invoices` (séquence, date d'émission, PDF archivé dans Storage, statut payé/impayé) + compléter le gabarit avec les mentions légales (il me faut vos SIREN/TVA).* 
- 🟡 Pas de suivi **payé / impayé / relance** — viendra naturellement avec la table.
- 🟡 Pas de **paiement en ligne** (le wizard est une prise de lead) — un lien Stripe sur la facture serait l'étape suivante logique.

### 3.5 Sécurité transverse
- Les liens PDF partagés via WhatsApp sont publics et devinables (`docs/FA-<réf>.pdf`) → ajouter un suffixe aléatoire.
- Clés/tokens partagés en clair pendant nos tests → **à révoquer** (GitHub `ghp_3Ext…`, clés Supabase).
- RLS globalement bien posée (lecture publique limitée au contenu publié, écriture réservée aux rôles admin/ops).

---

## 4. Recommandations priorisées

**P0 — fiabilité immédiate (à faire cette semaine)**
1. Ajouter sur Vercel : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` → persistance ETG + PDF réels + e-mails possibles.
2. Enregistrer le montant des réservations (wizard → `price_amount`/`route_id`) avec recalcul serveur.
3. Notifications e-mail : confirmation client + alerte ops à chaque réservation/devis.
4. Valider `/api/intake` (schéma strict + limite de débit).

**P1 — chaîne complète et conforme (semaine suivante)**
5. Table `invoices` : numérotation légale continue, archivage PDF, statut payé + mentions légales (SIREN/TVA à me fournir).
6. Conversion devis → réservation, et création manuelle de réservations/devis depuis l'admin.
7. Synchroniser les rate cards ETG avec la grille « Trajets & prix ».
8. Vraie liaison chauffeur (colonne dédiée) + e-mail automatique de la fiche de mission à l'assignation.

**P2 — croissance**
9. Lien de paiement Stripe sur facture ; relances impayés.
10. Vitrine « Destinations » sur le site (SEO) — ou retrait du menu.
11. Journal d'audit des réservations ; vue planning/calendrier ; exports CSV.
12. Version EN du contenu CMS (les champs existent déjà en partie).

---

*Document généré dans le repo : `docs/ETUDE-BACKOFFICE.md`*

---

## 5. LIVRÉ & TESTÉ (mise à jour post-implémentation)

### P0 — fiabilité (fait, testé en production)
- ✅ **Prix calculé côté serveur** depuis la grille officielle — testé : CDG→Paris = **120 €**, mise à disposition 4 h V = **360 €** (le montant du navigateur n'est plus jamais utilisé).
- ✅ **`/api/intake` durci** : schémas Zod (liste blanche), limite 20 req/min/IP, **honeypot anti-bot** (testé : bot → faux succès sans écriture), rejet des données invalides (testé : HTTP 400).
- ✅ **Insertion résiliente au schéma** : l'API s'adapte aux colonnes réellement présentes (retire et réessaie) — robustesse sans migration manuelle.
- ✅ **Notifications e-mail** (Resend) : confirmation client + alerte ops sur réservation / devis / candidature. *Activation : clé `RESEND_API_KEY` sur Vercel.*

### P1 — chaîne complète & conforme (fait, testé)
- ✅ **Registre de factures légal** : table `invoices` + émission atomique `issue_invoice()` → numérotation **continue** testée : `FA-2026-0001`, `FA-2026-0002` (aucun trou possible).
- ✅ **Statut payé / impayé** testé (bascule → « Payée »), **PDF archivé** dans le Storage, **mentions légales** (SIREN, TVA intra, siège, pénalités de retard) éditables dans Paramètres du site et imprimées sur la facture.
- ✅ **Devis → réservation** (bouton de conversion) ; **création manuelle** de réservation (vente au comptoir / téléphone).
- ✅ **Fiche de mission auto-envoyée au chauffeur** à l'assignation (si e-mail + Resend).
- ✅ **Synchronisation grille site → rate cards ETG** (bouton dans Tarifs) — un seul prix vendu partout.

### Reste à la charge du client (gestes non automatisables)
1. Ajouter sur Vercel : `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.
2. Renseigner SIREN / forme juridique / TVA intra / adresse du siège dans **Paramètres du site**.
3. Révoquer le token GitHub et les clés Supabase de test.
