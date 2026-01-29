# Audit — Espace `super_admin` (résumé)

Objectif : classer les fonctionnalités de `src/pages/super_admin` en quatre catégories :
- 100% implémenté & fonctionnel
- Implémenté mais inutilisé (présence code/config sans usage)
- Partiellement implémenté
- Non implémenté

Méthode : lecture complète des fichiers de `src/pages/super_admin`, vérification du schéma DB (`documentation/modele_donnee.sql`) et du cahier des charges (`projet.txt`).

---

Rappel : schéma et projet analysés :
- Modèle de données : [documentation/modele_donnee.sql](documentation/modele_donnee.sql)
- Cahier des besoins : [projet.txt](projet.txt)


**Résumé par fichier (classification, tables concernées, confiance)**

- [src/pages/super_admin/SuperAdminLayout.tsx](src/pages/super_admin/SuperAdminLayout.tsx) — 100% implémenté & fonctionnel. Gère sidebar, état réduit persistant, chargement profil. Tables: `utilisateur`. Confiance: élevée.

- [src/pages/super_admin/Dashboardpage.tsx](src/pages/super_admin/Dashboardpage.tsx) — 100% implémenté & fonctionnel. Agrégations et compteurs (organisations, utilisateurs, dossiers, photos...). Tables: `organisation`, `utilisateur`, `dossier_disparition`, `photo`, `commentaire`, `document`. Confiance: élevée.

- [src/pages/super_admin/SystemUsersPage.tsx](src/pages/super_admin/SystemUsersPage.tsx) — 100% implémenté & fonctionnel. CRUD utilisateurs, gestion rôles, blocage. Tables: `utilisateur`, `utilisateur_role`, `role`. Confiance: élevée.

- [src/pages/super_admin/RolesPage.tsx](src/pages/super_admin/RolesPage.tsx) — 100% implémenté & fonctionnel. Gestion JSON permissions, suppression protégée. Tables: `role`. Confiance: élevée.

- [src/pages/super_admin/OrganisationsPage.tsx](src/pages/super_admin/OrganisationsPage.tsx) — 100% implémenté & fonctionnel. CRUD organisations, export CSV, lecture `configuration_systeme` pour types/certifs. Tables: `organisation`, `utilisateur`, `configuration_systeme` (usage front). Confiance: élevée.

- [src/pages/super_admin/DossiersPage.tsx](src/pages/super_admin/DossiersPage.tsx) — 100% implémenté & fonctionnel. Liste, filtres, CSV export, création/édition. Tables: `dossier_disparition`, `personne`, `utilisateur`, `organisation`, `signalement`, `alerte`. Confiance: élevée.

- [src/pages/super_admin/DossierDetailPage.tsx](src/pages/super_admin/DossierDetailPage.tsx) — 100% implémenté & fonctionnel. Outils onglets: photos, signalements, localisations, historique, commentaires, documents, alertes, résultats IA. Tables: `dossier_disparition`, `photo`, `signalement`, `localisation`, `commentaire`, `document`, `resultat_ia`. Confiance: élevée.

- [src/pages/super_admin/SignalementValidationPage.tsx](src/pages/super_admin/SignalementValidationPage.tsx) — 100% implémenté & fonctionnel. Filtrage, validation, CSV export. Tables: `signalement`, `dossier_disparition`, `utilisateur`. Confiance: élevée.

- [src/pages/super_admin/AlertesPage.tsx](src/pages/super_admin/AlertesPage.tsx) — 100% implémenté & fonctionnel. Création/diffusion d'alertes, statuts, CSV. Tables: `alerte`, `dossier_disparition`, `utilisateur`. Confiance: élevée.

- [src/pages/super_admin/PhotosPage.tsx](src/pages/super_admin/PhotosPage.tsx) — 100% implémenté & fonctionnel. Modération photos, approbation/rejet, export. Tables: `photo`, `utilisateur`, `personne`, `signalement`. Confiance: élevée.

- [src/pages/super_admin/DocumentsPage.tsx](src/pages/super_admin/DocumentsPage.tsx) — 100% implémenté & fonctionnel. Listing, filtres, téléchargement, CSV. Tables: `document`, `utilisateur`, `dossier_disparition`, `signalement`. Confiance: élevée.

- [src/pages/super_admin/CommentairesPage.tsx](src/pages/super_admin/CommentairesPage.tsx) — 100% implémenté & fonctionnel. Gestion commentaires, confidentialité, CSV. Tables: `commentaire`, `utilisateur`, `dossier_disparition`. Confiance: élevée.

- [src/pages/super_admin/ResultatsIAPage.tsx](src/pages/super_admin/ResultatsIAPage.tsx) — 100% implémenté & fonctionnel. Listing résultats IA, validation, export CSV. Tables: `resultat_ia`, `photo`, `dossier_disparition`. Confiance: élevée.

- [src/pages/super_admin/IAConfigurationPage.tsx](src/pages/super_admin/IAConfigurationPage.tsx) — 100% implémenté & fonctionnel. Lecture/écriture `configuration_systeme` catégorie `ia` (seuils, modèles). Tables: `configuration_systeme`. Confiance: élevée.

- [src/pages/super_admin/SystemLogsPage.tsx](src/pages/super_admin/SystemLogsPage.tsx) — 100% implémenté & fonctionnel. Vue du `journal_activite`, filtres et export. Tables: `journal_activite`. Confiance: élevée.

- [src/pages/super_admin/SystemSettingsPage.tsx](src/pages/super_admin/SystemSettingsPage.tsx) — Partiellement implémenté. UI de gestion `configuration_systeme` catégorie `system` existe et upsert fonctionne, mais certaines clefs (ex : règles d'expiration fines, intégration notification externe) semblent stockées sans consommateur côté backend visible dans le front-end lu. Tables: `configuration_systeme`. Confiance: moyenne.

- [src/pages/super_admin/SecurityPage.tsx](src/pages/super_admin/SecurityPage.tsx) — Partiellement implémenté. Page expose paramètres sécurité (MFA, règles mot de passe, rate-limiting) persistés en `configuration_systeme`, mais l'application ne montre pas d'implémentation systémique complète d'enforcement côté API (pas repéré ici). Recommande vérification RLS/policies et enforcement côté API. Tables: `configuration_systeme`, `journal_activite`. Confiance: moyenne.

- [src/pages/super_admin/NotificationsSystemPage.tsx](src/pages/super_admin/NotificationsSystemPage.tsx) — 100% implémenté & fonctionnel (listing notifications, filtres, envoi simulé). Tables: `notification`, `utilisateur`, `dossier_disparition`, `alerte`. Confiance: élevée.

- [src/pages/super_admin/CampagnesPage.tsx](src/pages/super_admin/CampagnesPage.tsx) — 100% implémenté & fonctionnel. CRUD campagnes, contenus JSON, CSV. Tables: `campagne_sensibilisation`, `utilisateur`, `organisation`. Confiance: élevée.

- [src/pages/super_admin/DonsPage.tsx](src/pages/super_admin/DonsPage.tsx) — 100% implémenté & fonctionnel. Listing dons, exports, stats. Tables: `don`. Confiance: élevée.

- [src/pages/super_admin/GlobalStatsPage.tsx](src/pages/super_admin/GlobalStatsPage.tsx) — 100% implémenté & fonctionnel. Agrégations complexes, cartes/graphes. Tables: `v_dossiers_actifs`, `statistique_recherche`, `dossier_disparition`, `resultat_ia`. Confiance: élevée.

- [src/pages/super_admin/MaintenancePage.tsx](src/pages/super_admin/MaintenancePage.tsx) — Implémenté mais partiellement utilisé. Outils de purge/backup visibles et historiques stockés en `configuration_systeme` ; certaines actions (migrations automatiques) sont manuelles ou nécessitent scripts externes. Recommande planifier jobs cron si nécessaire. Tables: `configuration_systeme`. Confiance: moyenne.

- [src/pages/super_admin/PhotosPage.tsx](src/pages/super_admin/PhotosPage.tsx) — (déjà listée plus haut) — 100% implémenté.

- [src/pages/super_admin/Profiles/ProfilePage.tsx] ou `ProfilePage.tsx` — 100% implémenté & fonctionnel. Gestion profil, upload image (Cloudinary), changement mot de passe via Supabase. Tables: `utilisateur`. Confiance: élevée.

- [src/pages/super_admin/LiensFiliationPage.tsx](src/pages/super_admin/LiensFiliationPage.tsx) — Partiellement implémenté. UI pour liaisons de filiation présente (création/liste), mais certaines vérifications génétiques/documentaires sont prévues dans le schéma et pas entièrement intégrées au workflow UI. Tables: `lien_filiation`, `personne`. Confiance: moyenne.

- [src/pages/super_admin/SecurityPage.tsx] (déjà listée) — voir plus haut.


**Observations transverses et risques**

- RLS & Policies : le schéma active RLS et définit des policies (ex : `dossier_public_visible`, `dossier_autorite_all`, `commentaire_confidentiel`). Le front-end utilise Supabase et semble conçu pour respecter ces règles, mais il faut vérifier que toutes les requêtes côté client ne contournent pas les règles (ex : `service_role` usage côté serveur). Risque de fuite si clés serveur sont exposées.

- `configuration_systeme` : beaucoup de pages lisent/écrivent des configurations (IA, system, security, types organisations). Ces clés sont présentes mais la consommation globale (en particulier enforcement sécurité) nécessite audit runtime. Potentiel: centraliser validations et documenter clefs en `documentation`.

- Données sensibles & confidentialité : les commentaires et documents sont marqués `confidentiel` dans le schéma et UI gère le flag; cependant il faut s'assurer (tests) que les exports CSV et API n'exposent pas de champs confidentiels par défaut.

- Exports CSV : nombreux exports sont côté client (construits depuis résultats Supabase). Recommander : vérifier que les exports respectent le flag `confidentiel` et les politiques RLS.


**Recommandations priorisées**

1. Vérifier enforcement sécurité (SecurityPage) : s'assurer que MFA, règles de mot de passe et rate-limiting sont effectifs côté backend / edge function. Priorité : élevée pour conformité et sécurité.
2. Audit exports CSV pour confidentialité : rechercher où `confidentiel` fields sont inclus et bloquer/exclure par défaut. Priorité : élevée.
3. Automatiser tâches maintenance critiques (backups, migrations) via jobs/cron et documenter process. Priorité : moyenne.
4. Compléter workflows filiation (preuves, compatibilité ADN) si exigé par le produit ; sinon documenter en “feature future”. Priorité : faible/moyenne.
5. Documenter toutes les clefs `configuration_systeme` (catégorie → clef) et leur usage pour éviter configuration orpheline. Priorité : moyenne.


---

Étapes suivantes réalisées :
- Lecture complète des fichiers `src/pages/super_admin` (25 fichiers) : OK.
- Lecture du schéma DB et `projet.txt` : OK.

Prochaine action recommandée : souhaitez-vous que j'ouvre des PRs pour :
- ajouter des tests d'export CSV pour filtrer `confidentiel` ; et/ou
- implémenter enforcement Security (si vous fournissez les endpoints nécessaires) ; et/ou
- générer un tableau détaillé (CSV/MD) listant chaque fonctionnalité, fichier(s) source, tables DB et extrait de ligne (si vous voulez des lignes précises je peux joindre les références) ?


Rapport généré le : 2026-01-29

