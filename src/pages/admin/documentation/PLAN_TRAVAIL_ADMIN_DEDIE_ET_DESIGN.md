# Plan de travail – Pages dédiées Admin Org et design structuré

Ce document rappelle en détail **tout ce qu’il faut faire**, en s’appuyant sur tes choix :
1. **Pages dédiées** pour l’admin org (héritage) au lieu de le laisser aller sur les pages des autres acteurs.
2. **Design** : structurer ce qui existe (menu, groupes) et respecter cette structure à l’avenir.
3. **Tables Supabase** : celles visibles sur ta capture + les migrations existantes dans `supabase/`.
4. **Edge functions et migrations** : tout est dans le dossier `supabase/`.

---

## 1. Rappel des objectifs

- **Un seul espace pour l’admin** : tout se fait sous `/admin/*`, sans redirection vers `/authority/*`, `/moderator/*`, `/operator/*`, `/ngo/*`.
- **Héritage par pages dédiées** : réutiliser les **composants** (et la logique) des espaces Authority, Moderator, Operator, NGO dans de **nouvelles pages admin** qui restent dans le layout Admin et filtrent par organisation.
- **Menu structuré** : sidebar en groupes (Opérationnel / Organisation / Suivi) au lieu d’une liste plate.

---

## 2. État des lieux

### 2.1 Tables Supabase (capture + migrations)

D’après ta capture, le schéma `public` contient notamment :
- `alerte`, `campagne_sensibilisation`, `commentaire`, `configuration_systeme`, `document`, `don`, `dossier_disparition`
- `journal_activite`, `lien_filiation`, `localisation`, `modele_dossier`, `notification`, `organisation`, `organisation_partenaire`
- `personne`, `photo`, `resultat_ia`, `role`, `signalement`, `statistique_recherche`
- `utilisateur`, `utilisateur_role`
- `v_dossiers_actifs` (vue)
- + tables PostGIS : `geography_columns`, `geometry_columns`, `spatial_ref_sys`

Dans `supabase/migrations/` on a en plus :
- **`20260203_organisation_parametres.sql`** : ajout de la colonne `parametres_organisation` (JSONB) sur `organisation`.
- **`20260203_organisation_cle_api.sql`** : création de la table `organisation_cle_api` (clés API par organisation).

Si ces migrations sont appliquées sur le projet Supabase, les tables/colonnes existent même si elles n’apparaissent pas dans la capture (nouvelle table ou colonne dans une table existante).

### 2.2 Edge functions (`supabase/functions/`)

- `admin-invite-user` : invitation d’utilisateurs par l’admin org.
- `donations-create`, `donations-mock-confirm`, `donations-webhook` : flux dons.
- `huggingface-proxy` : proxy IA.

Aucune nouvelle Edge Function n’est requise pour le plan actuel (pages dédiées + design).

### 2.3 Ce qui existe déjà côté admin

- **Layout** : `AdminOrganisationLayout.tsx` avec sidebar plate (11 entrées), header (recherche → dossiers, notifications → audit-logs, langue, profil).
- **Routes** (`AdminRoutes.tsx`) : dashboard, utilisateurs (liste, new, :id), dossiers (liste, new, :id, :id/edit), rapports (liste, :id), statistiques, profile, api-keys, parametres, workflows, roles, audit-logs.
- **Dashboard** : KPIs + quick actions qui redirigent vers `/admin/...` ou **vers /authority/alertes, /authority/ia-analysis, /authority/donations, /authority/coordination** (à remplacer par des routes admin dédiées).

---

## 3. Ce qu’il faut faire (liste détaillée)

### 3.1 Design – Structurer le menu (à faire en premier)

- **Modifier `AdminOrganisationLayout.tsx`** :
  - Remplacer la liste plate `ADMIN_NAV_CONFIG` par une **structure en groupes**.
  - Groupes proposés :
    - **Opérationnel** : Dashboard, Dossiers, Signalements (rapports), Alertes, Carte, IA, Coordination, (optionnel) Personnes, Photos en attente, Signalements en attente.
    - **Organisation** : Utilisateurs, Rôles, Paramètres, Clés API, Workflows.
    - **Suivi** : Statistiques, Audit, Rapports de performance (si on ajoute la page plus tard).
  - Afficher dans la sidebar : un titre de groupe (ex. « Opérationnel ») puis les liens du groupe ; répéter pour chaque groupe.
  - Conserver le même style visuel (icônes, états actifs, collapse, mobile).
- **Fichier de traduction** : ajouter les clés pour les libellés de groupes (ex. `admin.nav.operational`, `admin.nav.organisation`, `admin.nav.followUp`) si pas déjà présentes.
- **Convention** : à l’avenir, toute nouvelle entrée de menu doit être placée dans le bon groupe.

### 3.2 Pages dédiées – Héritage Autorité (niveau 4)

Créer des **pages admin** qui utilisent le **layout Admin** et réutilisent les **composants** (ou conteneurs) des pages Authority, en passant un contexte « organisation » (id_organisation) pour filtrer les données. Routes sous `/admin/...` :

| Route admin           | Rôle fonctionnel              | Réutilisation / implémentation |
|-----------------------|-------------------------------|--------------------------------|
| `/admin/alertes`      | Liste + détail alertes        | Réutiliser `AlertesPage`, `AlerteDetailPage`, `CreateAlertePage` (authority) en wrappant dans le layout Admin et en filtrant par dossiers/org. |
| `/admin/alertes/new`  | Création alerte               | Idem (CreateAlertePage). |
| `/admin/alertes/:id`  | Détail alerte                 | Idem (AlerteDetailPage). |
| `/admin/signalements` | Liste signalements (vue enquête) | Réutiliser ou adapter `SignalementsPage` Authority ; filtrer par dossiers de l’org. (Rapports existant = validation ; ici = liste complète type Authority.) |
| `/admin/signalements/:id` | Détail signalement       | Réutiliser `SignalementDetailPage` Authority. |
| `/admin/ia`           | Analyse IA                   | Réutiliser `IAAnalysisPage` Authority ; filtrer par dossiers/org. |
| `/admin/coordination` | Coordination                 | Réutiliser `CoordinationPage` Authority ; périmètre org. |
| `/admin/carte`        | Carte des dossiers/alertes   | Réutiliser `MapViewPage` Authority ; données filtrées par org. |

**Remarque** : Les pages admin « Dossiers » existent déjà (liste, détail, new, edit). On ne les déplace pas ; on s’assure qu’elles restent dans le groupe Opérationnel.

**Implémentation technique** :
- Créer des **pages conteneur** dans `src/pages/admin/` (ex. `AdminAlertesPage.tsx`, `AdminAlerteDetailPage.tsx`, …) qui :
  - Récupèrent `id_organisation` (depuis le user courant ou contexte).
  - Rendent le composant Authority correspondant en lui passant des props ou un contexte pour restreindre à l’organisation (ou appeler des services qui filtrent déjà par `id_organisation`).
- Ajouter les routes dans `AdminRoutes.tsx`.
- Mettre à jour le **dashboard** : les quick actions « Alertes », « IA », « Coordination », « Carte » doivent pointer vers `/admin/alertes`, `/admin/ia`, `/admin/coordination`, `/admin/carte` au lieu de `/authority/...`.

### 3.3 Pages dédiées – Héritage Modérateur (niveau 3)

| Route admin                  | Rôle fonctionnel           | Réutilisation |
|-----------------------------|----------------------------|----------------|
| `/admin/photos-moderation`  | Modération des photos      | Réutiliser `PhotosModerationPage` (moderator ou authority) ; filtrer les photos par dossiers/signalements de l’organisation. |
| `/admin/verification-identite` | Vérification identité (citoyens) | Réutiliser `IdentityVerificationPage` (moderator) ; périmètre selon la doc (ex. demandes liées à l’org ou globales selon RLS). |

- Créer les pages conteneur admin, ajouter les routes, ajouter les entrées dans le groupe **Opérationnel** du menu.
- **Rapports** existants : garder `/admin/rapports` pour la validation des signalements (déjà aligné modérateur). Option : renommer en « Signalements à valider » ou garder « Rapports » et garder une entrée distincte « Signalements » (liste complète) comme ci‑dessus.

### 3.4 Pages dédiées – Héritage Opérateur (niveau 2)

| Route admin                       | Rôle fonctionnel              | Réutilisation |
|-----------------------------------|-------------------------------|----------------|
| `/admin/personnes`                | Liste fiches personnes        | Réutiliser ou adapter `OperatorPersonsPage` / liste personnes ; filtrer par org (personnes liées aux dossiers de l’org). |
| `/admin/photos-en-attente`        | Photos en attente de traitement | Réutiliser `PhotosEnAttentePage` (operator) ; filtrer par dossiers de l’org. |
| `/admin/signalements-en-attente`  | Signalements en attente       | Réutiliser `SignalementsEnAttentePage` (operator) ; filtrer par dossiers de l’org. |

- Créer les pages conteneur admin, routes, entrées menu dans le groupe **Opérationnel**.

### 3.5 Pages dédiées – Héritage NGO (niveau 5)

| Route admin              | Rôle fonctionnel     | Réutilisation |
|--------------------------|----------------------|----------------|
| `/admin/campagnes`       | Campagnes sensibilisation | Réutiliser `CampagnesPage`, `CreateCampagnePage` (ngo) ; filtrer par organisation (id_organisation ou lien campagne ↔ org). |
| `/admin/cas`             | Cas humanitaires     | Réutiliser `CasesPage`, `CreateCasePage` (ngo) ; idem filtre org. |
| `/admin/ressources`      | Ressources           | Réutiliser `ResourcesPage` (ngo). |
| `/admin/partenariats`    | Partenariats         | Réutiliser `PartnershipsPage` (ngo) + lien avec `organisation_partenaire` si la table gère les partenariats par org. |

- Créer les pages conteneur admin, routes, entrées dans le menu (groupe **Opérationnel** ou un sous-groupe « ONG » si l’org est de type ONG ; ou afficher ces entrées seulement si `type_organisation` = ONG).
- **Donations / dons** : le lien « Campagnes » du dashboard peut pointer vers `/admin/campagnes` (ou vers une page admin « Dons » qui réutilise `DonationsPage` Authority) selon le choix métier.

### 3.6 Suppression des redirections vers les autres espaces

- Dans **DashboardPage** admin : remplacer tous les liens vers `/authority/...` par les nouvelles routes `/admin/...` (alertes, ia, coordination, carte, campagnes/donations selon ce qui est implémenté).
- **Ne pas** ajouter `ADMIN_ORGANISATION` aux routes Authority, Moderator, Operator, NGO pour l’usage normal : l’admin n’a plus besoin d’aller sur ces espaces pour l’héritage (tout est dans admin). On peut laisser l’accès Authority en fallback si tu le souhaites, mais le parcours par défaut sera 100 % admin.

### 3.7 Cohérence design et accessibilité

- **Design system** : mêmes composants (boutons, cartes, tables, formulaires) que le reste de l’app ; palette et typo alignées avec le layout admin existant.
- **Feedback** : toasts ou messages après actions (création, modification, suspension, export).
- **Responsive** : sidebar en drawer sur mobile, overlay, fermeture au clic dehors ou après navigation (déjà en place ; vérifier sur les nouvelles pages).
- **Accessibilité** : contrastes, cibles tactiles, navigation clavier (focus visible, pas de piège clavier dans les modales).

---

## 4. Ordre de réalisation proposé (quand tu donnes le feu vert)

1. **Design – Menu structuré**
   - Modifier `AdminOrganisationLayout.tsx` pour les groupes (Opérationnel, Organisation, Suivi).
   - Ajouter les clés i18n des groupes.
   - Ne pas encore ajouter les liens vers les pages qui n’existent pas ; on peut mettre des entrées désactivées ou les ajouter au fur et à mesure.

2. **Pages héritage Autorité**
   - Alertes (liste, détail, création), Signalements (liste, détail), IA, Coordination, Carte.
   - Créer les pages conteneur admin, les routes, les entrées dans le menu, puis mettre à jour le dashboard (liens vers /admin/...).

3. **Pages héritage Modérateur**
   - Modération photos, Vérification identité (si périmètre défini).

4. **Pages héritage Opérateur**
   - Personnes, Photos en attente, Signalements en attente.

5. **Pages héritage NGO**
   - Campagnes, Cas, Ressources, Partenariats (avec filtre org et éventuellement affichage conditionnel si type ONG).

6. **Nettoyage**
   - Vérifier que plus aucune quick action du dashboard ne pointe vers `/authority/...` (sauf choix explicite de garder un lien de secours).
   - Vérifier RLS / filtrage par `id_organisation` sur les appels utilisés par ces pages.

---

## 5. Récapitulatif à valider

- **Design** : sidebar admin en groupes (Opérationnel, Organisation, Suivi) ; convention pour les futures entrées.
- **Pages dédiées** : toutes les fonctionnalités d’héritage (Authority, Moderator, Operator, NGO) exposées sous `/admin/*` en réutilisant les composants existants et en filtrant par organisation.
- **Tables** : rien à créer ; `organisation_cle_api` et `parametres_organisation` sont gérées par les migrations dans `supabase/`.
- **Edge functions** : aucune modification requise pour ce plan.
- **Méthode** : commencer par le menu structuré, puis ajouter les pages par bloc (Authority → Moderator → Operator → NGO), en mettant à jour le dashboard au fur et à mesure.

Dès que tu donnes le feu vert et la manière de procéder (par exemple « go dans l’ordre du §4 » ou « commence uniquement par le menu + alertes + carte »), on peut enchaîner étape par étape.
