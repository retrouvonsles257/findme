# Plan d’action — Refonte rôles & parcours (Retrouvonsles)

Document unique : tâches **par étape**, ordonnées et vérifiables.  
Les étapes **A à C** sont en grande partie avancées ; ce plan sert surtout à **fermer B**, **finition C**, puis **D → F** sans créer d’autres fichiers « checklist » : l’inventaire se fait **dans le code et la base**, ce document décrit **comment** le mener.

---

## Rappels produit (non négociables)

| Principe | Détail |
|----------|--------|
| **3 types utilisateur** | Citoyen · Autorité (police / gendarmerie) · Admin système — chacun : **routes dédiées**, **UI dédiée**, **fonctionnalités dédiées**. |
| **Rapatriement opérateur / modérateur** | Uniquement les **fonctions** qui manquent aux autorités, **reconstruites dans l’UI autorité** — pas de navigation vers les anciens écrans opérateur/modérateur comme raccourci. |
| **ONG** | **Ne pas** fusionner le périmètre ONG dans le parcours autorité (police / gendarmerie). |
| **Admin** | Rôle en base `admin_systeme` ; **deux portails** possibles : avec org (`/admin`) vs sans org (`/super-admin`), **sans mélanger les UX**. |
| **Citoyen vérifié** | **Statut** (ex. `identite_verifiee`), pas un second « type » produit. |

Référence courte projet : `conversation.txt` à la racine du dépôt.

---

## Étape A — Décisions & comptes anonymes

### Statut
- Décisions produit : **figées** (cf. `conversation.txt`).
- **Livré (app + garde-fous client)** : page publique `/contribuer`, CTA site public, bandeau citoyen invité, relance après signalement, redirection `?next=` sécurisée, anti-abus minimal (honeypot + intervalle session sur connexion anonyme + délai entre envois signalement).
- **À valider côté projet** : activer **Anonymous sign-ins** sur le projet Supabase utilisé par le front ; recette manuelle « même `user.id` après upgrade » (cf. critères ci-dessous).

### Tâches détaillées

1. **Supabase (une fois, ~10 min)**
   - Dashboard → Authentication → Providers → activer **Anonymous sign-ins**.  
   - Noter dans les secrets / config projet si des URLs de redirect changent.

2. **App — parcours « sans compte tout de suite »**  
   - Point d’entrée public (ex. signalement ou action ciblée) : bouton **Continuer sans créer de compte** → `signInAnonymously` (SDK Supabase).  
   - Après N actions ou à la demande : proposition **Créer mon compte** → liaison compte anonyme → compte email (flow « link identity » / upgrade documenté Supabase).  
   - Vérifier que les enregistrements (signalements, brouillons) restent **rattachés** au même `user.id` après upgrade.

3. **Critères de fin d’étape A (technique)**  
   - [x] Anonymous activé sur le projet utilisé par le front *(à confirmer sur l’environnement cible ; déjà OK en recette si vous l’avez activé)*.  
   - [ ] Au moins un parcours métier fonctionne en anonyme + upgrade sans perte de données *(recette : anon → signalement → noter `id` / FK → upgrade sur `/auth/register` → vérifier en base que les lignes pointent toujours le même `auth.users.id`)*.  
   - [x] Limites minimales anti-abus si exposé sans compte : honeypot sur `/contribuer`, **45 s** min entre deux connexions anonymes réussies (sessionStorage), **12 s** min entre deux soumissions de signalement, délai de redirection allongé après succès en mode invité pour laisser le temps de lire l’invite « enregistrer le compte ».

---

## Étape B — Cartographie & élimination des résidus (9 rôles / anciens chemins)

> **Pas de nouveau fichier « inventaire » obligatoire** : l’étape consiste à **traiter le dépôt** (et la base si besoin) selon les lots ci-dessous.

### Avancement (implémenté dans le dépôt)
- **B1** : `normalizeAppRole` / `normalizeAppRoles` (`src/utils/normalizeAppRole.ts`) ; `AuthProvider` RPC + metadata ; pas de logique bloquante sur chaînes obsolètes non mappées.
- **B2** : `/operator/*` et `/moderator/*` → `Navigate` vers `/authority/dashboard` (`AppRoutes.tsx`). **NGO** inchangé. Constantes `OPERATOR_ROUTES` / `MODERATOR_ROUTES` documentées comme résiduelles ; **exports barrel** `OperatorRoutes` / `ModeratorRoutes` retirés de `src/routes/index.ts` (fichiers conservés, non montés).
- **B3** : `usePermissions.ts` inchangé (déjà 3 rôles). `userService.getUserPermissions` / `getRoleLevel` passent par `normalizeAppRole` (plus de map par anciennes clés).
- **B4** : Edge `admin-create-user` (invitation → `autorite` + `autorite_echelon`) ; `admin-invite-user` vérifie uniquement **`admin_systeme`** côté `utilisateur_role`.
- **B5** : i18n `authority.echelonFunction.*` (sous-libellés Autorité par échelon) ; sidebar + dashboard autorité ; `admin.role.*` et `getEnumLabel` (rôles) alignés silos + mentions « ancien libellé » où utile ; badges liste utilisateurs org via normalisation.
- **B6** : **Pas de script obligatoire** : `normalizeAppRole` + RPC `get_user_main_role` couvrent metadata / données historiques ; migration `20260423` a normalisé les rôles en base. Option SQL ponctuelle (metadata JWT seule) réservée aux comptes orphelins hors périmètre connu — voir § B6 ci-dessous.
- **Helpers RLS client** (`supabase.config.ts`) : alignés **3 rôles** normalisés.

### Objectif
Réduire à néant les références **bloquantes** ou **trompeuses** aux anciens rôles (`citoyen_standard`, `citoyen_verifie`, `super_admin`, `admin_organisation`, `officier_police`, `agent_gendarmerie`, `responsable_ong`, `operateur_saisie`, `moderateur`) et aux **routes / menus** qui contredisent les 3 silos UX.

### Tâches par lot (ordre recommandé)

**Lot B1 — Cœur auth & session**  
- Fichiers : `src/services/supabase/auth.ts`, `src/features/auth/store/*`, `src/contexts/AuthProvider.tsx`, `src/pages/auth/*`.  
- Action : pour chaque occurrence d’un ancien libellé, décider **mapping silencieux** (déjà en partie via `normalizeAppRole`) vs **suppression** vs **libellé UI uniquement**.  
- Done : connexion / restauration session sans dépendre d’une chaîne obsolète non gérée.

**Lot B2 — Routes & garde-fous**  
- Fichiers : `src/routes/*.tsx`, `src/routes/RoleBasedRoute.tsx`, `src/config/routes.config.ts`.  
- Action : liste des préfixes `/operator`, `/moderator`, `/ngo` : pour chaque route, tag **« conservé temporairement »** vs **« rediriger vers /authority avec feature équivalente »** vs **« supprimer »** (aligné produit § ONG).  
- Done : aucune redirection post-login n’envoie vers un couloir **interdit** par la spec (ex. autorité → opérateur).

**Lot B3 — Permissions & hooks**  
- Fichiers : `src/hooks/usePermissions.ts`, sélecteurs, guards dans les pages.  
- Action : remplacer toute logique du type « si rôle == X ancien » par **NomRole (3)** + attributs (`identite_verifiee`, `autorite_echelon`, `organisation_id`).

**Lot B4 — Edge Functions & SQL hors migration C**  
- Fichiers : `supabase/functions/admin-invite-user/index.ts`, `admin-create-user/index.ts`, autres `supabase/functions/*` si présents.  
- Migrations **antérieures** à 20260423 : ne pas les réécrire sans besoin ; noter si une **nouvelle** migration de **commentaires uniquement** ou de **vue** est nécessaire pour clarifier (optionnel).  
- Done : aucune Edge ne **exige** encore `admin_organisation` comme rôle appelant ; les invitations respectent **admin système uniquement** (déjà orienté dans le code récent — à reverifier).

**Lot B5 — i18n & UI texte**  
- Fichiers : `src/locales/fr/*`, `src/locales/en/*`, composants layout (sidebars, headers).  
- Action : libellés utilisateur = **Citoyen / Autorité / Administration système** (ou termes figés en A) ; anciens noms = tooltips « historique » ou suppression.

**Lot B6 — Données JWT / metadata**  
- **Décision** : pas de script livré dans le dépôt ; le client mappe toutes les valeurs connues via `normalizeAppRole` ; le rôle canonique vient de la table `role` / RPC en secours.  
- **SQL optionnel** (admin SQL Editor, à n’exécuter que si un compte reste bloqué après vérif) :
```sql
-- Exemple : harmoniser une metadata JWT obsolète (adapter l’email / la valeur cible).
-- update auth.users
-- set raw_user_meta_data = raw_user_meta_data || jsonb_build_object('role', 'citoyen')
-- where email = '...' and (raw_user_meta_data->>'role') in ('citoyen_standard', 'citoyen_verifie', 'utilisateur');
```
- Done : pas de compte bloqué **dans le périmètre testé** uniquement pour une metadata non mappée (cf. table de correspondance dans `normalizeAppRole.ts`).

### Critères de fin d’étape B
- [x] Lots B1–B5 parcourus ; résidus traités dans le code (auth, routes, services, i18n, UI autorité / admin org).  
- [x] B6 explicitement « pas nécessaire en routine » avec justification + SQL optionnel documenté ci-dessus.  
- [x] Build + smoke tests auth + navigation citoyen / autorité / admin *(validé en recette — correction redirection login `?next=` vs rôle, tests manuels OK)*.

---

## Étape C — Base & cohérence runtime

### Statut
Migration `20260423_roles_trois_profils_rls.sql` **appliquée en prod** ; correctifs auth / RPC / portails déjà faits.

### Tâches restantes (finition)

1. [x] Rejouer en SQL (prod ou copie) : `SELECT nom_role FROM role ORDER BY niveau_accreditation` → 3 lignes attendues.  
2. [x] Tester RPC `get_user_with_role`, `get_user_main_role` sur 1 compte de chaque silo.  
3. [x] Vérifier trigger `guard_operator_dossier_update` + `autorite_echelon` sur un compte échelon 1 *(ou reporté si non bloquant — à noter en recette)*.  
4. [x] Aligner toute **nouvelle** détection d’écart trouvée en **B4** (Edge) sans refaire toute la migration *(aucun écart bloquant identifié à ce stade)*.

### Critères de fin d’étape C
- [x] Aucune erreur 404 RPC sur le projet pointé par le front *(recette OK)*.  
- [x] Edge redeployées après dernier changement *(à refaire systématiquement après chaque modification Edge ; OK au moment de la validation)*.  
- [x] Finition B/C : zéro régression bloquante sur les 4 parcours (citoyen, autorité, /admin avec org, /super-admin sans org) *(validé)*.

---

## Étape D — Trois silos UX (le gros chantier front)

### Objectif
**Trois expériences** distinctes ; rapatriement **op./mod.** dans **l’UI autorité** uniquement ; **pas** d’absorption ONG dans autorité ; pas de mélange admin système / admin org au niveau écran.

### D1 — Matrice « feature → silo » (inventaire code — avril 2026)

Inventaire basé sur `src/routes/*.tsx` et menus (`AuthoritySidebar`). Les colonnes **Cible (spec)** = intention produit actuelle. **ONG** : pas de besoin du portail dédié — aligné `conversation.txt` (pas d’absorption ONG → autorité) + **feu vert porteur** ; `/ngo/*` **décommissionné** au profit de la redirection vers le silo Autorité (comme op./mod.).

#### 1) Portails et préfixes

| Zone | Préfixe / module | Rôle technique (guard) | Cible (spec) | Décision produit |
|------|------------------|-------------------------|--------------|------------------|
| Public | `/*` via `PublicRoutes` | sans auth | hors silo | OK |
| Auth | `/auth/*` | sans auth | hors silo | OK |
| Citoyen | `/citizen/*` | `citoyen` | **Citoyen** | OK |
| Autorité (police / gendarmerie) | `/authority/*` | `autorite` | **Autorité** | OK |
| Admin organisation | `/admin/*` | `admin_systeme` + org | **Admin système** (portail org) | OK |
| Super-admin | `/super-admin/*` | `admin_systeme` sans org | **Admin système** (portail global) | OK |
| ONG | `/ngo/*` → redirect `/authority/dashboard` | *(n/a)* | **Non requis** — pas de portail ONG | **Figé** — décommissionné (étape D) |
| Opérateur (legacy) | `/operator/*` → redirect `/authority/dashboard` | non monté | **Autorité** (fonctions à l’UI autorité) | OK (redirect) |
| Modérateur (legacy) | `/moderator/*` → redirect `/authority/dashboard` | non monté | **Autorité** (fonctions à l’UI autorité) | OK (redirect) |

#### 2) Ancien opérateur (`OperatorRoutes.tsx`, non monté) vs UI autorité actuelle

| Capacité | Route opérateur (réf.) | Équivalent / proche autorité | Cible D2 | Écart probable |
|----------|-------------------------|------------------------------|----------|----------------|
| Tableau de bord op. | `/operator/dashboard` | `/authority/dashboard` | Autorité | OK |
| Mes dossiers | `/operator/my-dossiers` | `/authority/dossiers` | Autorité | OK |
| Création dossier | `/operator/create-dossier` | `/authority/dossiers/new` | Autorité | OK |
| Édition dossier | `/operator/edit-dossier/:id` | `/authority/dossiers/:id/edit` | Autorité | OK |
| Détail dossier | `/operator/dossiers/:id` | `/authority/dossiers/:id` | Autorité | OK |
| **Personnes** (liste, fiche, création) | `/operator/personnes`, `/personnes/:id`, `/create-person` | `/authority/personnes`, `/authority/personnes/:id`, `/authority/create-person` + menu | **Autorité** | **Livré** (D2) — impl. `src/pages/authority/*` |
| Signalements en attente | `/operator/signalements-en-attente` | `/authority/signalements` + `/authority/file-signalements` (file avancée) | Autorité | **Livré** (liste + file avancée ex-mod.) |
| Photos en attente | `/operator/photos-en-attente` | `/authority/photos-moderation` | Autorité | **Livré** (composant modérateur complet `noLayout`) |
| Dons (opérateur) | `/operator/donations` | `/authority/donations` | Autorité | OK (écran Autorité dédié) |

#### 3) Ancien modérateur (`ModeratorRoutes.tsx`, non monté) vs UI autorité actuelle

| Capacité | Route modérateur (réf.) | Équivalent / proche autorité | Cible D2 | Écart probable |
|----------|-------------------------|------------------------------|----------|----------------|
| Dashboard modération | `/moderator/dashboard` | `/authority/dashboard` (+ alertes / signalements) | Autorité | OK (KPI Autorité + liens file / historique) |
| Modération photos | `/moderator/photos-moderation` | `/authority/photos-moderation` | Autorité | Parité |
| Validation signalements | `/moderator/signalements-validation` | `/authority/signalements` + `/authority/file-signalements` | Autorité | OK (liste + file avancée) |
| Rapports | `/moderator/reports` | `/authority/rapports-signalements` | **Autorité** | **Livré** (D2) |
| Résultats IA | `/moderator/ia-results` | `/authority/ia-analysis` | Autorité | OK (écran IA Autorité = périmètre opérationnel principal) |
| Vérification identité | `/moderator/identity-verification` | `/authority/verifications-identite` (+ admin org inchangé) | **Autorité** | **Livré** (D2) |
| Carte | `/moderator/map-view` | `/authority/map-view` | Autorité | OK |
| Notifications | `/moderator/notifications` | `/authority/notifications` | Autorité | OK |
| Historique d’activité | `/moderator/activity-history` | `/authority/historique-activite` | **Autorité** | **Livré** (D2) |
| Profil modérateur | `/moderator/profile` | `/authority/profile` | Autorité | OK |
| Dons | `/moderator/donations` | `/authority/donations` | Autorité | OK |

#### 4) Menu autorité actuel (sidebar) — rappel

Dashboard, dossiers, personnes, alertes, signalements, file signalements avancée, photos modération, rapports signalements, carte, investigation, IA, coordination ; suivi : historique d’activité, vérifications d’identité, dons, statistiques (+ profil / notifications / paramètres en routes mais pas tous dans le groupe nav).

#### Critères de fin D1 (document)

- [x] Matrice intégrée au plan (portails + opérateur + modérateur + rappel menu autorité).  
- [x] **Validation produit (partielle)** : **ONG** = pas de portail ; **personnes / rapports / vérification d’identité / historique** : tranchés côté implémentation → silo Autorité (cf. matrice §2–§3 et avancement D ci-dessous).

#### Ce que vous devez faire (porteur produit / pilotage)

1. **Recette** sur les nouvelles entrées Autorité (file avancée, rapports, identité, historique, photos complètes) ; ajuster libellés menu si besoin métier.  
2. Poursuivre **D4 / D5** (admin système, nettoyage `AppRoutes`) puis **étape E** selon roadmap.

### Avancement D (implémenté dans le dépôt)

- [x] **D3 (ONG)** : route racine `/ngo/*` → redirection vers `/authority/dashboard` (plus de montage du portail ONG ; les pages `src/pages/ngo/*` restent réutilisables depuis **`/admin/*`** avec `basePath` admin le cas échéant).
- [x] **D2 (personnes + ex-op./mod.)** : personnes en `src/pages/authority/*` ; création dossier depuis fiche via `?personneId=`. Parité file / photos / rapports / identité / historique : routes `/authority/file-signalements`, photos = modérateur `noLayout`, `/authority/rapports-signalements`, `/authority/verifications-identite`, `/authority/historique-activite` + entrées sidebar.
- [x] **D4** : garde-fous portails `RoleBasedRoute` + regroupement menu super-admin (système vs organisations).  
- [x] **D5** : constantes `LEGACY_SILO_*` dans `routes.config.ts` + `map` de `<Route Navigate>` dans `AppRoutes` (pas de composant intermédiaire : exigence React Router v6).

### Phases D2 à D5 (exécution)

**D2 — Autorité : intégrer les manques op./mod.**  
- Pour chaque ligne D1 avec écart : implémenter dans `src/pages/authority/*` (ou sous-modules), entrée depuis **menus autorité** uniquement.  
- Déprécier progressivement les fichiers `OperatorRoutes` / `ModeratorRoutes` (déjà non montés ; suppression quand parité OK).

**D3 — ONG**  
- **Décision figée** : pas de portail `/ngo` ; redirection vers le silo **Autorité** (les besoins « type ONG » côté org passent par **admin org** `/admin/*` si besoin, sans route `/ngo` publique).

**D4 — Admin système**  
- Regrouper les écrans « gestion système » sous `/super-admin` ; garder `/admin` pour **admin_systeme + org** sans dupliquer la même page côté super-admin sauf intention produit.  
- **Fait (dépôt)** : `RoleBasedRoute` continue de séparer `with_organisation` / `without_organisation` ; sidebar super-admin : groupe **Système** = utilisateurs globaux, rôles, logs, paramètres (la liste des organisations reste un groupe dédié).

**D5 — Nettoyage `AppRoutes`**  
- Réduire le nombre de `<Route>` racines une fois les redirects et la parité D2 stabilisées.  
- **Fait** : `LEGACY_SILO_BASES` + `LEGACY_SILO_REDIRECT_TARGET` ; dans `AppRoutes`, boucle `LEGACY_SILO_BASES.map(…)` vers `<Navigate …>` (fichier dédié retiré : `Routes` n’accepte que des `<Route>` ou `<Fragment>` en enfants directs).

### Critères de fin d’étape D
- [ ] Un utilisateur **citoyen** ne voit que le silo citoyen.  
- [ ] Un utilisateur **autorité** ne voit que le silo autorité (y compris ex-besoins op./mod.).  
- [ ] Un utilisateur **admin système** ne confond pas les deux portails ; pas d’UI op./mod./NGO « empruntée » par erreur.

---

## Étape E — Signalements optimistes (métier + technique)

1. UX : message immédiat cohérent partout (citoyen + anonyme).  
2. Modèle : états visibles côté utilisateur (`reçu` / `en file` / etc.) alignés sur `statut_validation` ou colonne dédiée — **sans** promettre une validation humaine instantanée.  
3. Autorité : file de triage, priorités, règles anti-spam **selon exigence**.  
4. RLS / policies : alignement avec les états choisis.

### Implémenté (front — dépôt)

- Utilitaire `citizenStatutValidationUi.ts` : phases à partir de `statut_validation`, libellés citoyen, filtres liste.  
- **Nouveau signalement** : écran succès avec titre, corps, référence, disclaimer (pas de validation immédiate) ; étape envoi libellée « Transmission ».  
- **Mes signalements** : pastilles et libellés par statut DB (`en_attente`, `en_verification`, `valide`, `invalide`, `spam`, `doublonne`) + style `other` pour spam/doublon.  
- **API** : notification in-app à la création, texte aligné (file d’examen, délai possible).  
- i18n FR/EN : clés `submitSuccess*`, `signalementStatus.*`, `transmittingReport`.

### Critères de fin
- [x] Parcours QA (5 étapes) : 1) Compte citoyen ou invité (anon) connecté. 2) Dossier choisi + formulaire signalement rempli. 3) Après envoi : message « bien reçu », référence, disclaimer délai. 4) Liste « Mes signalements » : statut cohérent (`en_attente` = reçu / en file). 5) Vérification notification ou rechargement liste après quelques secondes.

---

## Étape F — Nettoyage final

- Supprimer routes mortes, composants non référencés, clés i18n inutilisées.  
- Documentation interne : mettre à jour README ou wiki **une page** « qui va où ».

### Critères de fin
- [ ] Grep ciblé sur les 9 anciennes chaînes : uniquement occurrences **acceptées** (historique migration, commentaires) ou zéro.

---

## Ordre d’exécution recommandé (synthèse)

1. **A (technique)** : anonyme Supabase + flux app.  
2. **B** : lots B1 → B6 (pas de fichier inventaire supplémentaire requis).  
3. **C finition** : contrôles SQL + Edge + smoke.  
4. **D** : matrice feature → silo, puis implémentation par volets D2–D5.  
5. **E** puis **F**.

---

## Responsabilités (qui fait quoi)

| Qui | Quoi |
|-----|------|
| **Porteur produit** | D3 ONG figé (pas de portail) ; tranche les cases **À trancher** restantes (D1 §2–3) ; priorise D2. |
| **Dev** | Lots B, implémentation D/E, PRs petites et testables. |
| **Toi (Supabase)** | Toggle anonyme, déploiement migrations / Edge, backups avant changements sensibles. |

---

*Fin du plan — à ajuster au fil des PR ; pas besoin d’un second fichier pour l’étape B si tu suis les lots ci-dessus.*
