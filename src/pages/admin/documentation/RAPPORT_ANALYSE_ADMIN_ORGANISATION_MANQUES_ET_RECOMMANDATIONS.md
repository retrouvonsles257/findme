# Rapport d’analyse – Admin d’organisation (niveau 6)  
## Manques fonctionnels, design et recommandations

**Contexte :** L’administrateur d’organisation « hérite de tous les droits des niveaux inférieurs plus la gestion organisation ». Ce rapport compare la documentation (rôles/permissions, inscription, donations), le modèle de données, les pages implémentées pour les niveaux 0 à 5 et les pages admin, puis identifie les manques et propose des recommandations (fonctionnel, design, technique).

---

## 1. Synthèse du périmètre (niveaux 0 à 6)

| Niveau | Rôle | Espace front | Droits clés |
|--------|------|--------------|-------------|
| 0–1 | Citoyen | `/citizen/*` | Consultation dossiers publics, carte, alertes ; créer signalements ; profil, notifications. |
| 2 | Opérateur saisie | `/operator/*` | Créer/éditer ses dossiers, fiches personnes ; voir signalements/photos en attente. |
| 3 | Modérateur | `/moderator/*` | Valider/rejeter signalements ; modérer photos (approuver pour diffusion) ; rapports, vérification identité, résultats IA, carte. |
| 4 | Officier / Agent | `/authority/*` | Tous les dossiers ; créer/éditer dossiers, alertes ; valider signalements et IA ; coordination, enquête, carte, stats. |
| 5 | Responsable ONG | `/ngo/*` | Dossiers, cas humanitaires ; campagnes, partenariats, ressources ; création de cas, campagnes. |
| 6 | Admin organisation | `/admin/*` + accès partiel à d’autres espaces | Tout ce qui précède **pour son organisation** + gestion utilisateurs, paramètres org, zones, certifications, rapports de performance, workflows, coordination/partenariats. |

**Principe d’héritage :** L’admin peut **faire tout ce que font** les niveaux 2 à 5, **restreint aux données de son organisation**, et en plus il gère les comptes, les paramètres et la configuration de l’organisation. Il ne gère pas les autres organisations ni le super-admin.

---

## 2. Ce qui est implémenté aujourd’hui

### 2.1 Espace Admin (`/admin/*`)

- **Layout** : Sidebar (11 entrées), header (recherche → dossiers, notifications → audit-logs, langue, profil).
- **Dashboard** : KPIs (dossiers, actifs, résolus, retrouvés), actions rapides (dossier, rapports, utilisateurs, alertes, IA, campagnes, coordination), activité récente, résumé + lien statistiques.
- **Dossiers** : Liste filtrée (recherche, statut, urgence), création (réutilisation formulaire Autorité), détail (réutilisation vue Autorité), édition.
- **Utilisateurs** : Liste (filtres rôle/statut), invitation (email + rôle), détail (édition nom/prénom/téléphone, statut, rôle, date d’expiration), suspendre/activer/désactiver.
- **Rapports (signalements)** : Liste, détail, approuver/rejeter.
- **Statistiques** : Période (mois/trimestre/année), KPIs, répartition urgence, activité mensuelle, export CSV.
- **Paramètres** : 7 onglets (Général, Équipe, Notifications, Zones de compétence, Certifications, IA, Sécurité) avec champs décrits en doc ; lien vers Clés API ; zone danger (suppression org).
- **Rôles** : Liste des rôles 2–5, lecture des permissions (pas de création de rôles personnalisés).
- **Audit** : Journaux d’activité de l’organisation, filtres, export CSV.
- **Profil** : Réutilisation du profil Autorité.
- **Clés API** : Création (nom + affichage unique du secret), liste, copier, révoquer.
- **Workflows** : Page « à venir » + retour paramètres.

### 2.2 Accès aux autres espaces

- **Autorité** : `AuthorityRoutes` inclut `ADMIN_ORGANISATION`. L’admin peut donc accéder à **tout** `/authority/*` (dashboard, dossiers, détail, création, édition, alertes, signalements, IA, coordination, carte, statistiques, profil, notifications). En pratique, l’admin a bien les droits « niveau 4 » en les exerçant depuis l’espace Autorité.
- **Opérateur** : `OperatorRoutes` = `OPERATEUR_SAISIE` uniquement. **Admin n’a pas accès** à `/operator/*`.
- **Modérateur** : `ModeratorRoutes` = `MODERATEUR` uniquement. **Admin n’a pas accès** à `/moderator/*`.
- **NGO** : `NGORoutes` = `RESPONSABLE_ONG` uniquement. **Admin n’a pas accès** à `/ngo/*`.

### 2.3 Backend / données

- **admin-organisation** : Services pour stats, utilisateurs, dossiers, signalements, audit, organisation (get/update), rôles, clés API, invitation (Edge Function). Les paramètres (zones, certifications, IA, équipe, notifications) sont gérés côté front dans un objet `parametres_organisation` ; la table `organisation` du schéma SQL fourni ne contient **pas** de colonne `parametres_organisation` (ni `organisation_cle_api`). À vérifier en base (migrations éventuelles).

---

## 3. Manques fonctionnels (par rapport à la doc et à l’héritage)

### 3.1 Héritage Modérateur (niveau 3)

- **Modération des photos**  
  La doc : le modérateur peut « approuver ou rejeter les photos uploadées », « approuver les photos pour diffusion publique ».  
  Dans l’admin : il n’y a **pas** d’équivalent à la page `/moderator/photos-moderation` (liste des photos en attente, approbation/rejet, floutage, etc.). Les rapports admin permettent de valider des **signalements**, pas de modérer les **photos** des dossiers/signalements.  
  **Manque :** accès à un flux « modération des photos » pour l’organisation (soit entrée dans l’espace modérateur pour l’admin, soit page dédiée dans l’admin).

- **Vérification d’identité (citoyens vérifiés)**  
  Modérateur : « IdentityVerificationPage » pour valider les demandes de passage citoyen vérifié.  
  Admin : aucune page équivalente.  
  **Manque :** possibilité pour l’admin de traiter les demandes de vérification d’identité (au moins en lecture/décision) pour les comptes liés à son organisation ou au périmètre défini en doc.

- **Résultats IA (vue modérateur)**  
  Modérateur a une page « IAResultsPage ». Admin a un lien « Résultats IA » vers `/authority/ia-analysis`. Donc **couvert** par l’accès Autorité.

### 3.2 Héritage Opérateur (niveau 2)

- **Signalements / photos en attente (vue opérateur)**  
  Opérateur a « SignalementsEnAttentePage », « PhotosEnAttentePage ». Dans l’admin, les « Rapports » listent les signalements et permettent de les valider, mais il n’y a pas de vue dédiée « signalements en attente » ou « photos en attente » centrée sur le workflow opérateur.  
  **Manque (léger) :** une vue ou des filtres « en attente » très visibles pour traiter rapidement les nouveaux signalements/photos.

- **Gestion des personnes (fiches)**  
  Opérateur a « PersonsPage », « PersonDetailPage », « CreatePersonPage ». L’admin gère les **dossiers** (qui référencent des personnes) mais n’a pas d’écran dédié « Personnes » / « Fiches personnes » pour son organisation.  
  **Manque :** selon le processus métier, une liste/fiche « Personnes » côté admin peut être utile (au moins en lecture, voire création si les dossiers sont créés à partir de personnes existantes).

### 3.3 Héritage Responsable ONG (niveau 5)

- **Campagnes, partenariats, ressources**  
  La doc : admin peut tout ce que fait le niveau 5 (campagnes, cas humanitaires, partenariats, etc.).  
  En pratique : l’admin **n’est pas** dans `ngoRoles`, donc il **n’accède pas** à `/ngo/campagnes`, `/ngo/cases`, `/ngo/partnerships`, `/ngo/resources`. Le dashboard admin pointe « Campagnes » vers `/authority/donations`, pas vers l’espace NGO.  
  **Manque majeur :** pour une organisation de type ONG, l’admin devrait pouvoir accéder aux fonctionnalités ONG (campagnes, cas, partenariats, ressources). À traiter soit en ajoutant `ADMIN_ORGANISATION` aux routes NGO (avec filtre par organisation), soit en dupliquant les flux essentiels dans l’admin.

### 3.4 Gestion organisation (spécifique niveau 6)

- **Rapports de performance**  
  Doc : « Accéder aux rapports de performance », « Voir les rapports de performance IA ».  
  Implémenté : page Statistiques (KPIs, graphiques, export CSV) et lien vers IA via Autorité. Pas de page dédiée « Rapports de performance » (PDF, rapports IA dédiés).  
  **Manque :** génération de rapports de performance (PDF/rapport structuré) et éventuellement une section « Performance IA » (précision, volume, etc.) dans l’admin.

- **Workflows et modèles de dossiers**  
  Doc : « Configurer les workflows internes », « Définir des modèles de dossiers personnalisés », « Paramétrer les alertes automatiques ».  
  Implémenté : page Workflows en « à venir ». Pas de configuration de workflows ni de modèles de dossiers.  
  **Manque :** implémentation réelle des workflows (étapes, validation) et des modèles de dossiers (templates).

- **Coordination / partenariats inter-organisations**  
  Doc : « Établir des partenariats », « Configurer les échanges d’informations inter-organisations », « Gérer les accès partagés ».  
  Implémenté : lien « Coordination » vers `/authority/coordination`. Pas de page admin dédiée « Partenariats » ou « Accès partagés » pour configurer les partenariats de **son** organisation.  
  **Manque :** écran(s) dans Paramètres (ou dédiés) pour gérer les partenariats et les accès partagés au niveau de l’organisation.

- **Permissions spécifiques par utilisateur**  
  Doc : « PEUT gérer les permissions spécifiques par utilisateur ».  
  Implémenté : attribution de **rôle** et date d’expiration. Pas de surcharge fine « permissions par utilisateur » (ex. masquer certaines actions pour un rôle donné).  
  **Manque :** si le métier le demande, un niveau de détail « permissions par utilisateur » (flags ou surcharge du rôle).

### 3.5 Statistiques et export

- **Comparaison des périodes (hebdo, mensuel, annuel)**  
  Implémenté : sélecteur mois / trimestre / année et graphique d’activité.  
  **Manque (mineur) :** vue « comparaison côte à côte » (ex. ce mois vs mois dernier, cette année vs dernière année) pour mieux analyser les tendances.

- **Export « tous types de rapports »**  
  Actuellement : export CSV des statistiques et des journaux d’audit.  
  **Manque :** autres formats (PDF, Excel) et types de rapports (rapport d’activité org, rapport par zone, etc.).

### 3.6 Données et modèle

- **Table `organisation`**  
  Le schéma fourni n’inclut pas `parametres_organisation` (JSONB) ni éventuellement d’autres champs utilisés par le front (ex. `organisation_cle_api`). Si les migrations ont ajouté ces colonnes/tables, rien à changer. Sinon, **il faut les ajouter** pour que la configuration (zones, certifications, IA, équipe, notifications) et les clés API soient persistées.

---

## 4. Synthèse des manques (priorisation)

| Priorité | Manque | Impact |
|----------|--------|--------|
| **Haute** | Accès Admin aux fonctionnalités NGO (campagnes, cas, partenariats, ressources) lorsque l’org est ONG | Incohérence avec la doc (héritage niveau 5) ; admin ONG ne peut pas faire ce qu’un responsable ONG fait. |
| **Haute** | Modération des photos dans l’admin (ou accès au flux modérateur) | Héritage niveau 3 incomplet ; impossible d’approuver les photos pour diffusion depuis l’admin. |
| **Moyenne** | Page ou onglet « Partenariats / Accès partagés » (coordination inter-organisations) | Doc explicite ; aujourd’hui seulement lien vers coordination Autorité. |
| **Moyenne** | Workflows et modèles de dossiers (au moins MVP) | Doc explicite ; actuellement placeholder. |
| **Moyenne** | Vérification d’identité (citoyens) accessible à l’admin si périmètre défini | Aligne avec rôle « niveau 3 » pour les demandes de vérification. |
| **Basse** | Rapports de performance (PDF / structurés) et indicateurs IA | Améliore le pilotage. |
| **Basse** | Vue « Personnes » (fiches) dans l’admin | Confort opérationnel. |
| **Basse** | Comparaison de périodes (stats) et exports multi-formats | Confort analytique. |

---

## 5. Recommandations design (vue ingénieur senior)

### 5.1 Un seul « chez-soi » pour l’admin

Aujourd’hui, l’admin a **deux** contextes : `/admin/*` (gestion org) et `/authority/*` (opérationnel). Les actions « Alertes », « IA », « Coordination », « Campagnes » sont des **redirections** depuis le dashboard vers l’Autorité. Cela fonctionne mais crée une coupure UX (changement de layout, de menu).

- **Recommandation :** À moyen terme, viser **un seul espace** pour l’admin :
  - Soit **tout intégrer dans `/admin/*`** : menu admin avec entrées dédiées (Dossiers, Signalements, Alertes, IA, Coordination, Statistiques, Utilisateurs, Paramètres, etc.) et réutilisation des **composants** des espaces Authority/Moderator/NGO, sans changer de layout. L’admin ne va plus sur `/authority/*` pour son usage quotidien.
  - Soit garder la redirection mais avec **choix de contexte** explicite (ex. bandeau « Vous agissez en mode Autorité » avec retour rapide vers Admin) et menu cohérent (même sidebar ou raccourcis visibles).

### 5.2 Menu et hiérarchie

- **Regrouper** les entrées par thème dans la sidebar (ex. « Opérationnel » : Dossiers, Signalements, Alertes, Carte, IA ; « Organisation » : Utilisateurs, Rôles, Paramètres, Clés API, Workflows ; « Suivi » : Statistiques, Audit, Rapports). Éviter une liste plate de 11 liens sans regroupement.
- **Alertes, IA, Coordination, Carte** : les avoir comme **entrées de menu** dans l’admin (pas seulement en « actions rapides »), avec des routes dédiées `/admin/alertes`, `/admin/ia`, etc. qui rendent les mêmes vues qu’Autorité mais dans le layout admin (ou en ouvrant le même composant en plein écran).

### 5.3 Tableau de bord

- **Personnalisation** : choix des widgets ou des KPIs affichés (au moins en paramètre utilisateur ou org).
- **Alertes opérationnelles** : encart « À traiter » (signalements en attente, photos en attente, résultats IA non validés) avec compteurs et lien direct.
- **Rappels** : tâches (ex. certifications à renouveler, comptes à activer) pour renforcer la dimension « pilotage ».

### 5.4 Listes et filtres

- **Dossiers / Utilisateurs / Rapports** : filtres avancés (plage de dates, plusieurs statuts, zone) et **sauvegarde de filtres** (ex. « Mes vues ») pour les utilisateurs lourds.
- **Tables** : tri par colonne, pagination ou virtualisation dès que les volumes dépassent quelques dizaines d’éléments.
- **Recherche globale** (header) : étendre à « dossiers + personnes + signalements » et afficher des onglets par type dans les résultats.

### 5.5 Paramètres

- **Onglets** : sur mobile, préférer accordéon ou menu secondaire vertical pour ne pas surcharger l’écran.
- **Zone danger** : bien séparée visuellement, confirmation en deux étapes (saisie du nom de l’organisation ou « SUPPRIMER ») pour éviter les suppressions accidentelles.
- **Zones / Certifications** : liste avec tri possible et indicateurs (ex. certification proche de l’expiration) pour faciliter le suivi.

### 5.6 Accessibilité et responsive

- **Contrastes** : respect WCAG 2.1 AA pour texte et boutons.
- **Cibles tactiles** : minimum 44px pour les boutons et liens sur mobile.
- **Navigation clavier** : focus visible, ordre logique, pas de piège au clavier dans les modales.
- **Sidebar** : sur mobile, drawer avec overlay et fermeture au clic dehors ou après navigation.

### 5.7 Design system

- **Cohérence** : même palette, typo et espacements sur tout l’espace admin (et idéalement alignés avec le reste de l’app). Éviter des composants « un peu différents » d’une page à l’autre.
- **Feedback** : toasts ou messages clairs après chaque action (création, modification, suspension, export). Désactiver les boutons pendant les appels API pour éviter les doubles soumissions.

---

## 6. Recommandations fonctionnelles et techniques

### 6.1 Routes et rôles

- **NGO** : ajouter `ADMIN_ORGANISATION` aux routes `/ngo/*` en vérifiant que les vues et API filtrent bien par `id_organisation` (ou équivalent). Ainsi, un admin dont l’organisation est une ONG pourra gérer campagnes, cas, partenariats, ressources sans créer un « double compte » responsable ONG.
- **Modérateur** : soit ajouter `ADMIN_ORGANISATION` à `ModeratorRoutes` pour les pages modération photos et vérification d’identité (avec filtre par organisation si nécessaire), soit exposer une **page admin** « Modération des photos » qui réutilise le même composant et les mêmes appels que la page modérateur, en restreignant aux dossiers/signalements de l’organisation.
- **Opérateur** : pas obligatoire d’ajouter l’admin aux routes opérateur si l’admin a déjà création/édition de dossiers et liste des signalements. En revanche, une **vue « Photos en attente » / « Signalements en attente »** dans l’admin (même composants que opérateur/modo) améliore le flux.

### 6.2 Données

- **Organisation** : confirmer en base la présence de `parametres_organisation` (JSONB) et de la table `organisation_cle_api`. Si absentes, prévoir des migrations et adapter les services pour lire/écrire ces champs.
- **RLS** : toutes les requêtes admin doivent filtrer par `id_organisation` (ou `id_organisation_responsable` pour les dossiers). Vérifier que les politiques Supabase pour le rôle/niveau 6 sont bien en place et testées.

### 6.3 Performance et montée en charge

- **Audit logs** : la limite à 200 lignes est raisonnable ; garder la pagination ou « charger plus » si besoin. Index sur `(id_utilisateur, date_action)` (déjà partiellement couvert par les index existants).
- **Statistiques** : pour les grosses organisations, prévoir agrégations ou vues matérialisées si les requêtes deviennent lentes (ex. par mois/région).

### 6.4 Sécurité

- **Invitation** : l’Edge Function `admin-invite-user` doit bien lier le compte à l’organisation de l’admin et attribuer uniquement des rôles 2–5. Vérifier qu’aucun élévation vers super_admin ou autre organisation n’est possible.
- **Clés API** : le secret ne doit **jamais** être rejoué après création. Stocker uniquement un hash ou un préfixe si besoin de vérification côté serveur.

---

## 7. Conclusion

- **Points forts actuels** : gestion utilisateurs (création, rôles, suspension, désactivation), dossiers (liste, détail, création, édition), rapports (validation des signalements), statistiques et export, paramètres organisation (7 onglets), audit, clés API. L’accès aux routes Autorité donne à l’admin l’équivalent des droits niveau 4 dans un second espace.
- **Manques les plus importants** :  
  1) **Accès aux fonctionnalités NGO** pour les admins dont l’organisation est une ONG ;  
  2) **Modération des photos** (et éventuellement vérification d’identité) depuis ou vers l’admin ;  
  3) **Coordination / partenariats** au niveau organisation (page ou onglet dédié) ;  
  4) **Workflows et modèles de dossiers** (au moins en MVP).
- **Design** : unifier l’expérience dans un espace admin unique avec menu structuré, dashboard actionnable et paramètres clairs ; renforcer accessibilité et responsive ; s’appuyer sur un design system cohérent.
- **Technique** : valider le schéma de données (paramètres org, clés API), RLS et filtrage par organisation partout ; ouvrir les routes NGO (et éventuellement Modérateur) à l’admin avec le bon filtrage.

Ce rapport peut servir de base à un backlog (par priorité) et à une refonte UX de l’espace admin en gardant la doc rôles/permissions comme référence.
