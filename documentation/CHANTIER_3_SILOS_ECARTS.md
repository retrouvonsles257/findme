# Chantier 3 silos — pilotage (chef d’orchestre)

**Décision figée (produit)**  
- **Utilisateurs + paramètres d’organisation** → **100 % silo Autorité** (`/authority/*`), pas le super-admin.  
- **Admin système** (`admin_systeme`, sans org) → **uniquement** système global (`/super-admin/*`). Pas de tâches métier « à la place » du citoyen ou de l’autorité.  
- **Fin de chantier** : suppression **code + routes** opérateur, modérateur, ONG ; suppression portail **`/admin`** (org) après migration des écrans utiles vers Autorité ou Super-admin selon la colonne cible ci-dessous.

**État des routes montées** : `AppRoutes` → `AuthorityRoutes`, `AdminRoutes` (admin_systeme + org), `SuperAdminRoutes`, etc. Les fichiers `OperatorRoutes`, `ModeratorRoutes`, `NGORoutes` sont **non montés** ; `/operator`, `/moderator`, `/ngo` → redirect dashboard autorité.

---

## 1) Opérateur (`OperatorRoutes.tsx` → préfixe `/operator`)

| Route legacy | Page | Équivalent Autorité | Statut |
|--------------|------|---------------------|--------|
| `/operator/dashboard` | `OperatorDashboardPage` | `/authority/dashboard` | **À vérifier** (KPI / widgets ≠ dashboard autorité) |
| `/operator/my-dossiers` | `OperatorMyDossiersPage` | `/authority/dossiers` | Parité liste |
| `/operator/create-dossier` | `CreateDossierPage` | `/authority/dossiers/new` | Parité |
| `/operator/create-person` | `CreatePersonPage` | `/authority/create-person` | Parité |
| `/operator/personnes` | `OperatorPersonsPage` | `/authority/personnes` | Parité |
| `/operator/personnes/:id` | `OperatorPersonDetailPage` | `/authority/personnes/:id` | Parité |
| `/operator/donations` | `OperatorDonationsPage` | `/authority/donations` | Parité |
| `/operator/edit-dossier/:id` | `OperatorEditDossierPage` | `/authority/dossiers/:id/edit` | Parité |
| `/operator/dossiers/:id` | `OperatorDossierDetailPage` | `/authority/dossiers/:id` | Parité |
| `/operator/signalements-en-attente` | `SignalementsEnAttentePage` | `/authority/signalements` + `/authority/file-signalements` | Parité fonctionnelle à **valider recette** |
| `/operator/photos-en-attente` | `PhotosEnAttentePage` | `/authority/photos-moderation` | Parité à **valider** (flux « en attente » vs modération) |
| `/operator/data-entry` | redirect `my-dossiers` | N/A | Supprimable avec op |

**Action fin** : supprimer `src/pages/operator/*`, `OperatorRoutes.tsx`, imports morts, assets résiduels si inutilisés.

---

## 2) Modérateur (`ModeratorRoutes.tsx` → préfixe `/moderator`)

| Route legacy | Page | Équivalent Autorité | Statut |
|--------------|------|---------------------|--------|
| `/moderator/dashboard` | `ModerationDashboardPage` | `/authority/dashboard` + liens file / notifs | **À vérifier** (KPI modération) |
| `/moderator/profile` | `ModeratorProfilePage` | `/authority/profile` | Parité |
| `/moderator/photos-moderation` | `PhotosModerationPage` | `/authority/photos-moderation` | Parité (souvent même composant) |
| `/moderator/signalements-validation` | `SignalementsValidationPage` | `/authority/signalements` + `/authority/file-signalements` | **À vérifier** (écran validation dédié modérateur vs file autorité) |
| `/moderator/reports` | `ReportsPage` | `/authority/rapports-signalements` | Parité (wrapper autorité) |
| `/moderator/ia-results` | `IAResultsPage` | `/authority/ia-analysis` | **Écart probable** : deux UIA ; comparer filtres / actions / périmètre |
| `/moderator/identity-verification` | `IdentityVerificationPage` | `/authority/verifications-identite` | Parité |
| `/moderator/map-view` | `MapViewPage` | `/authority/map-view` | Parité |
| `/moderator/notifications` | `NotificationsPage` | `/authority/notifications` | Parité |
| `/moderator/activity-history` | `ActivityHistoryPage` | `/authority/historique-activite` | Parité |
| `/moderator/donations` | `ModeratorDonationsPage` | `/authority/donations` | Parité |

**Action fin** : supprimer `src/pages/moderator/*`, `ModeratorRoutes.tsx`, layouts dédiés modérateur si orphelins.

---

## 3) ONG (`NGORoutes.tsx` + `src/pages/ngo/*`)

**Décision** : **suppression** du produit ONG. Les pages NGO sont encore branchées sous **`/admin/*`** (campagnes, cas, ressources, partenariats, etc.).

| Zone | Action |
|------|--------|
| Routes `/admin/campagnes`, `/admin/cas`, … | **Décider** : supprimer métier ou **reporter** sous Autorité si besoin métier réel (hors scope ONG). |
| `src/pages/ngo/*`, `NGOLayout`, `NGORoutes` | Supprimer après **plus aucun** import depuis `admin` / `authority`. |
| API `endpoints` `/ngo/...` | Nettoyer ou marquer deprecated. |

---

## 4) Admin organisation (`AdminRoutes.tsx` → préfixe `/admin`, rôle `admin_systeme` + `with_organisation`)

**Cible Autorité** (conformément décision utilisateurs + paramètres org) :

| Route `/admin/...` | Composant | Cible |
|--------------------|------------|--------|
| `/utilisateurs`, `/utilisateurs/new`, `/utilisateurs/:id` | `AdminOrganisationUsers*` | **Autorité** — gestion membres org |
| `/parametres` | `AdminOrganisationSettingsPage` | **Autorité** — paramètres org |
| `/dossiers`, `/dossiers/new`, `/dossiers/:id`, `/dossiers/:id/edit` | `AdminOrganisationDossier*` | **Autorité** (déjà parité côté authority dossiers — fusionner / retirer doublon) |
| `/alertes`, `/signalements`, `/ia`, `/coordination`, `/carte`, `/photos-moderation`, `/verification-identite`, `/personnes`, `/photos-en-attente`, `/signalements-en-attente` | wrappers `AdminOrganisation*` | **Autorité** — supprimer wrappers si **doublon strict** avec pages authority |
| `/rapports`, `/rapports/:id` | `AdminOrganisationRapport*` | **Autorité** |
| `/statistiques` | `AdminOrganisationStatistiquesPage` | **Autorité** (aligner avec `/authority/statistiques` ou fusion) |
| `/profile` | `AdminOrganisationProfilePage` | **Autorité** `/authority/profile` |
| `/donations` | `AdminOrganisationDonationsPage` | **Autorité** |
| `/workflows` | placeholder | **Décider** : Autorité ou suppression |

**Cible Super-admin (système uniquement)** :

| Route `/admin/...` | Composant | Cible |
|--------------------|------------|--------|
| `/roles` | `AdminOrganisationRolesPage` | **Super-admin** — rôles **globaux** plateforme (si contenu ≠ rôles org) ; sinon **supprimer** doublon avec `/super-admin/roles` |
| `/audit-logs` | `AdminOrganisationAuditLogsPage` | **Super-admin** logs système **ou** audit **limité à l’org** → si org-only, **Autorité** ; si global, **Super-admin** |

**Cible suppression (héritage NGO sous admin)** — sauf décision métier contraire :

| Route | Composant |
|-------|-----------|
| `/campagnes`, `/campagnes/create` | `AdminOrganisationCampagne*` |
| `/cas`, `/cas/create` | `AdminOrganisationCase*` |
| `/ressources` | `AdminOrganisationRessourcesPage` |
| `/partenariats` | `AdminOrganisationPartenariatsPage` |

**Action fin** : retirer `AdminRoutes` du routeur pour comptes **avec org** ; `RoleBasedRoute` + login redirect : `admin_systeme` **avec** `organisation_id` → **`/authority`** (ou sous-chemin dédié org au besoin) ; **sans** org → `/super-admin` uniquement.

---

## 5) Autorité actuelle (`AuthorityRoutes.tsx`) — rappel périmètre déjà monté

Présent : dashboard, dossiers, personnes, alertes, signalements + détail + file avancée, rapports signalements, historique, vérif identité, photos modération, investigation, IA analysis, coordination, carte, dons, stats, profil, notifs, settings/security (profil).

---

## 6) Ordre d’exécution recommandé (sans demi-mesure)

1. **Recette comparative** : `IAResultsPage` (mod) vs `IAAnalysisPage` (auth) ; `SignalementsValidationPage` (mod) vs file autorité ; dashboards op/mod vs authority.  
2. **Combler les écarts** dans `src/pages/authority/*` uniquement.  
3. **Portage `/admin` → autorité** : utilisateurs org, paramètres org, puis retrait des doublons admin-org / authority.  
4. **Portage ou fusion** audit / rôles org vers super-admin ou authority selon §4.  
5. **Suppression NGO** + routes admin héritage NGO.  
6. **Suppression** `operator`, `moderator`, fichiers routes legacy, `LEGACY_SILO` si plus rien à rediriger.  
7. **Migrations SQL** : uniquement si contraintes RLS / `utilisateur_role` / invitations encore liées à l’ancien modèle (nouvelle migration additive).

---

## 7) Journal (à compléter à chaque merge / jalon)

| Date | Jalon | Note |
|------|-------|------|
| *(init)* | Fichier créé | Inventaire routes depuis dépôt ; décision org → autorité enregistrée. |

---

*Référence projet : `documentation/PLAN_ACTION_REFONTE_ROLES.md`. Migrations déjà appliquées : ne pas réécrire l’historique ; ajouter seulement de nouvelles migrations si besoin.*
