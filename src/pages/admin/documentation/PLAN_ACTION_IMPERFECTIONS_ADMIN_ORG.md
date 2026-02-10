# Plan d’action – Imperfections admin org (rendre 100 % fonctionnel)

Ce document décrit le plan pour corriger les imperfections signalées sur l’espace admin d’organisation et rendre pleinement fonctionnelles les fonctionnalités propres à l’admin org selon la doc.

---

## 1. Vue d’ensemble des cibles

| # | Imperfection | Choix fonctionnel | Priorité |
|---|--------------|-------------------|-----------|
| 1 | Libellé « Dossiers des personnes disparues » trop long | Raccourcir en « Dossiers » (ou « Dossiers disparition ») | P0 – rapide |
| 2 | Vérification d’identité : stats sur statut compte, pas sur demandes | Implémenter un vrai workflow « demandes de vérification » (table + stats + actions) | P1 |
| 3 | Ressources : pas de table, liste vide | Créer table + CRUD + brancher l’UI existante | P1 |
| 4 | Partenariats : pas de table, liste vide | Créer table ou utiliser `organisation_partenaire` + CRUD + UI | P1 |
| 5 | Rôles : lecture seule, pas de gestion | Rendre la page « référentiel » claire + stats (nb users/role) ; pas de CRUD rôles système | P2 |
| 6 | Workflows : page « à venir » | **Implémenté** : étapes de traitement des dossiers par org (table `workflow_etape_organisation`, CRUD, page config). | P2 ✅ |

**Clés API** : déjà fonctionnelles, aucune action.

---

## 2. Plan par thème

### 2.1 Libellé « Dossiers » (P0)

**Objectif** : Raccourcir le libellé dans le menu et partout où il est utilisé.

**Actions** :
1. **i18n**  
   - Fichiers : `src/locales/fr/admin.json`, `src/locales/en/admin.json`.  
   - Remplacer la valeur de la clé utilisée pour le menu « Dossiers » (ex. `admin.dossiers`) par **« Dossiers »** (FR) et **« Cases »** ou **« Dossiers »** (EN) selon la convention du projet.
2. **Vérification**  
   - Grep sur « Dossiers de personnes disparues » / « dossiers » dans les libellés admin et pages admin pour harmoniser.

**Livrable** : Menu et titres cohérents sans changement de code métier.

---

### 2.2 Vérification d’identité (P1)

**Problème** : La page s’appuie sur `utilisateur` (type_compte = grand_public) et affiche des stats dérivées de `statut_compte`, pas sur des « demandes de vérification » avec cycle de vie propre.

**Choix** : Introduire un **workflow de demandes de vérification d’identité** : table dédiée, stats et actions (valider / refuser / demander complément) basées sur cette table.

**Actions** :

1. **Modèle de données**
   - Créer une migration Supabase :
     - Table `demande_verification_identite` (ex. : `id`, `id_utilisateur`, `id_organisation` nullable, `statut` enum : en_attente / approuve / refuse / complement_demande, `type_document`, `url_document`, `url_selfie`, `commentaire_moderateur`, `traite_par`, `traite_le`, `created_at`, `updated_at`).
     - Index sur `id_organisation`, `statut`, `id_utilisateur`.
   - RLS : les admins org voient les demandes dont `id_organisation` = leur org (ou demandes « globales » si le métier le prévoit) ; les modérateurs selon politique existante.

2. **Backend / API**
   - Service (ex. dans `features/admin-organisation` ou `features/verification-identite`) :
     - Lister les demandes (filtres : statut, org).
     - Récupérer une demande par id.
     - Actions : approuver, refuser, demander complément (mise à jour statut + champs `traite_par`, `traite_le`, `commentaire_moderateur`).
   - Optionnel : lors de l’approbation, mettre à jour `utilisateur.statut_compte` (ex. actif) pour garder la cohérence.

3. **UI**
   - Adapter `IdentityVerificationPage` (ou la page admin qui la réutilise) pour :
     - Charger les **demandes** depuis la nouvelle API (au lieu d’une liste d’utilisateurs par statut).
     - Afficher les stats (nombre par statut) à partir des demandes.
     - Liste des demandes avec filtres (statut, dates) et actions (détail, approuver, refuser, demander complément).

**Livrable** : Page « Vérification d’identité » 100 % basée sur les demandes, avec stats et actions cohérentes.

---

### 2.3 Ressources (P1)

**Problème** : Pas de table ; `ResourcesPage` (réutilisée par `AdminRessourcesPage`) force `setResources([])`.

**Choix** : Table **par organisation** pour que chaque org gère ses propres ressources (et que l’admin org ne voie que celles de son org).

**Actions** :

1. **Modèle de données**
   - Migration Supabase :
     - Table `ressource_organisation` (ou `ressources_ngo` avec `id_organisation` si on aligne avec la doc NGO) : `id`, `id_organisation`, `titre`, `type` (ex. lien, document, outil), `description`, `url`, `ordre` optionnel, `created_at`, `updated_at`.
     - RLS : SELECT/INSERT/UPDATE/DELETE pour les utilisateurs dont `id_organisation` correspond.

2. **API / Services**
   - Dans `adminOrganisationAPI` (ou service dédié) :
     - `getRessourcesOrganisation(id_organisation)` (ou déduire de l’utilisateur courant).
     - `createRessourceOrganisation(payload)`, `updateRessourceOrganisation(id, payload)`, `deleteRessourceOrganisation(id)`.
   - Filtrage RLS côté Supabase ; côté front s’assurer de ne passer que l’org de l’utilisateur connecté.

3. **UI**
   - Dans `ResourcesPage` (ou le composant partagé utilisé par `AdminRessourcesPage`) :
     - Remplacer le `setResources([])` par un appel à l’API ci-dessus.
     - Conserver recherche / filtre par type / grille ou liste déjà présents ; ajouter création et édition si absentes (formulaire modal ou page dédiée).

**Livrable** : Page Admin Ressources avec liste réelle, CRUD fonctionnel, filtre par organisation implicite (RLS).

---

### 2.4 Partenariats (P1)

**Problème** : Pas de table utilisée ; `PartnershipsPage` force une liste vide.

**Choix** : Soit réutiliser la table **`organisation_partenaire`** si elle existe et correspond (liens entre organisations), soit créer une table **partenariat** (ex. `partenariat_organisation`) avec champs type « partenaire » (nom, contact, statut, etc.).

**Actions** :

1. **Modèle de données**
   - Vérifier en base et dans la doc si `organisation_partenaire` existe et son schéma (id_organisation, id_organisation_partenaire, statut, date_debut, etc.).
   - **Si la table convient** : ajouter les colonnes manquantes éventuelles (contact, email, téléphone) en migration ; définir RLS par `id_organisation`.
   - **Si elle n’existe pas ou ne convient pas** : créer une table `partenariat_organisation` (ex. : `id`, `id_organisation`, `nom_partenaire`, `personne_contact`, `email`, `telephone`, `statut`, `date_debut`, `commentaire`, `created_at`, `updated_at`) + RLS.

2. **API / Services**
   - `getPartenariatsOrganisation`, `createPartenariatOrganisation`, `updatePartenariatOrganisation`, `deletePartenariatOrganisation` (scope par org).

3. **UI**
   - Brancher `PartnershipsPage` (utilisée par `AdminPartenariatsPage`) sur ces APIs : liste, filtres, création, édition, suppression.

**Livrable** : Page Admin Partenariats avec données réelles et CRUD.

---

### 2.5 Rôles et permissions (P2)

**Constat** : La page affiche le référentiel des rôles système (table `role`) en lecture seule ; pas de création/édition/suppression de rôles.

**Choix** : Garder les **rôles système** en lecture seule (référentiel) et **améliorer la page** pour qu’elle soit claire et utile : titre/texte explicatif « Référentiel des rôles », et afficher pour chaque rôle le **nombre d’utilisateurs** (par org ou global selon politique) pour aider l’admin à piloter les attributions. Pas de CRUD sur les rôles dans ce plan.

**Actions** :

1. **API**
   - Étendre ou ajouter un endpoint (ex. `getAdminRolesWithCounts`) qui retourne les rôles avec un champ `nombre_utilisateurs` (count depuis `utilisateur_role` + éventuellement filtre par `id_organisation` via `utilisateur`).

2. **UI**
   - Clarifier le libellé de la page (ex. « Référentiel des rôles »).
   - Afficher un tableau : nom du rôle, description, permissions (si déjà affichées), **nombre d’utilisateurs**.
   - Optionnel : lien « Gérer les utilisateurs » vers la page d’attribution des rôles (déjà possible depuis la fiche utilisateur).

**Livrable** : Page Rôles comprise comme référentiel, avec statistiques d’usage par rôle.

---

### 2.6 Workflows (P2) ✅

**Constat** : Page « à venir » sans logique.

**Choix retenu** : (a) **Étapes de traitement des dossiers** configurables par organisation. **Réalisé** : table `workflow_etape_organisation`, API CRUD, page config (liste, création, édition, suppression, bascule actif). Voir section détaillée ci‑dessous.

**Choix** (historique) : Définir d’abord le **périmètre métier** (ex. « étapes de traitement des dossiers » configurables par org, ou « modèles de processus » type checklist), puis implémenter.

**Actions** :

1. **Cadrage**
   - Avec le produit : valider si « Workflows » = (a) étapes/statuts de traitement des dossiers par org, (b) modèles de processus (templates), (c) autre (ex. règles d’escalade).
   - Documenter la décision (court paragraphe dans ce fichier ou dans la doc admin).

2. **Modèle de données** (après cadrage)
   - Exemple si (a) : table `workflow_etape` ou `organisation_workflow` (id_organisation, ordre, libellé_etape, code, actif).
   - RLS par `id_organisation`.

3. **API**
   - CRUD des étapes (ou du modèle de workflow) pour l’org courante.

4. **UI**
   - Remplacer le placeholder par une page de configuration : liste des étapes (ou du workflow), réorganisation (ordre), activation/désactivation, création/édition.

**Livrable** : Page Workflows fonctionnelle (étapes de traitement des dossiers par org). Implémenté : migration `20260210_workflow_etape_organisation.sql`, `adminOrganisationAPI` (get/create/update/delete), `WorkflowsPage.tsx` + i18n.

---

## 3. Ordre d’exécution recommandé

1. **P0 – Libellé Dossiers** : rapide, sans dépendance.
2. **P1 – Ressources** : table + API + branchement UI (peu de dépendances).
3. **P1 – Partenariats** : idem (vérifier `organisation_partenaire` en premier).
4. **P1 – Vérification d’identité** : table + API + adaptation de la page (plus de logique métier).
5. **P2 – Rôles** : évolution de l’API (counts) + ajustements UI.
6. **P2 – Workflows** : après cadrage métier, puis migration + API + page.

---

## 4. Fichiers principaux à toucher (rappel)

| Thème | Fichiers / zones |
|-------|-------------------|
| Dossiers (libellé) | `src/locales/fr/admin.json`, `src/locales/en/admin.json` ; grep « dossiers » dans admin. |
| Vérification identité | Nouvelle migration ; `IdentityVerificationPage` ou page admin équivalente ; nouveau service/API. |
| Ressources | Nouvelle migration `ressource_organisation` ; `adminOrganisationAPI` ou service dédié ; `ResourcesPage` / `AdminRessourcesPage`. |
| Partenariats | Migration (création ou adaptation `organisation_partenaire`) ; API admin ; `PartnershipsPage` / `AdminPartenariatsPage`. |
| Rôles | `adminOrganisationAPI` (getAdminRoles + counts) ; `RolesManagementPage.tsx`. |
| Workflows | Après cadrage : migration ; API ; `WorkflowsPage.tsx`. |

---

## 5. Validation

- Chaque livrable sera validé par : données en base (ou référentiel), API testée, UI utilisable sans placeholder pour les données.
- RLS et scope par `id_organisation` à vérifier pour Ressources, Partenariats, Vérification d’identité et Workflows.

Ce plan peut être exécuté phase par phase (P0 → P1 → P2) ou par thème selon les priorités projet.
