# Brief design Stitch – Espace Admin Organisation (nouveau design pro)

**Objectif :** Tu es designer UI/UX. Tu dois concevoir un **nouveau design professionnel et moderne** pour l’espace **Admin Organisation** de l’application **RetrouvonsLes** (recherche de personnes disparues). Le design actuel doit être **remplacé** : on ne veut pas le reproduire, on veut un rendu **type dashboard pro / SaaS**, épuré, cohérent et scalable.

**Contraintes fonctionnelles :** Tout ce qui est listé ci‑dessous (pages, blocs, boutons, liens) doit **exister** dans le design. En revanche, le style visuel (couleurs, typo, spacing, composants) est **libre** tant qu’il reste pro et lisible.

---

## Contexte produit

- **RetrouvonsLes** : plateforme de recherche de personnes disparues (citoyens, autorités, ONG).
- **Admin Organisation** : rôle qui gère **une organisation** (police, gendarmerie, ONG). Il crée des comptes pour son équipe (opérateurs, modérateurs, officiers, responsables ONG), consulte et gère les dossiers de disparition, les signalements (rapports), les statistiques, les paramètres de l’organisation et les journaux d’audit.
- **Ton visuel attendu :** Interface type **admin moderne** (ex. Vercel, Linear, Notion, Stripe Dashboard) : claire, hiérarchie forte, peu de bruit, composants réutilisables, dark ou light au choix.

---

## 1. Layout global (à designer en premier)

- **Navigation principale** : sidebar fixe à gauche (ou drawer sur mobile). Pas d’image de fond imposée – tu choisis un style pro (fond uni, léger dégradé, ou très discret).
- **Contenu** : zone principale à droite avec header fixe puis zone scrollable.
- **Header (zone principale)** : barre avec recherche globale, icône notifications, sélecteur de langue (FR/EN), bloc utilisateur (avatar + nom) avec menu déroulant : Profil, Langue, Déconnexion.
- **Sidebar** : logo ou nom d’app en haut, puis liste de liens avec icônes. Item actif mis en évidence. En bas de la sidebar : bloc utilisateur (avatar + nom) ouvrant le même menu que dans le header. Sur mobile : menu hamburger ouvre la sidebar en overlay ; clic dehors ou sur un lien la ferme.

**Liens de la sidebar (à afficher tels quels, avec icônes adaptées) :**

1. Tableau de bord → `/admin/dashboard`
2. Dossiers → `/admin/dossiers`
3. Rapports → `/admin/rapports`
4. Utilisateurs → `/admin/utilisateurs`
5. Statistiques → `/admin/statistiques`
6. Gestion des rôles → `/admin/roles`
7. Journaux d’audit → `/admin/audit-logs`
8. Paramètres → `/admin/parametres`
9. Workflows → `/admin/workflows`
10. Clés API → `/admin/api-keys`
11. Profil → `/admin/profile`

La recherche du header envoie vers la liste des dossiers avec le terme saisi. L’icône notifications peut mener vers les journaux d’audit.

---

## 2. Page Tableau de bord

- **Objectif** : vue d’ensemble et accès rapide aux actions.
- **En haut** : titre d’accueil court (ex. « Bienvenue » ou « Tableau de bord ») + un bouton principal bien mis en avant : **Nouveau dossier** (action primaire).
- **Bloc de KPIs** : 4 indicateurs en cartes ou en ligne, avec icône et couleur distincte pour chacun :
  - Total dossiers (avec optionnel « +X ce mois »)
  - Dossiers actifs (en cours)
  - Dossiers résolus
  - Personnes retrouvées
- **Bloc « Actions rapides »** : grille de cartes cliquables (icône + titre + courte description). Chaque carte = un lien. À prévoir :
  - Nouveau dossier
  - Voir les rapports
  - Gérer les utilisateurs
  - Voir les alertes (lien externe)
  - Résultats IA (lien externe)
  - Campagnes (lien externe)
  - Coordination (lien externe)
- **Bas de page** : deux colonnes (ou deux cartes).
  - **Gauche** : « Activité récente » – liste d’événements (type d’action, utilisateur ou entité, temps relatif). État vide : « Aucune activité ».
  - **Droite** : « Résumé » – 3 lignes (Total utilisateurs, Rapports récents, Taux de succès %) + un bouton secondaire « Voir les statistiques détaillées » vers la page Statistiques.

Design : hiérarchie claire, cartes avec ombre ou bordure légère, espacement généreux. Pas de surcharge.

---

## 3. Page Dossiers

- **En-tête** : titre « Dossiers », sous-titre court, et bouton **Nouveau dossier** (primaire).
- **Filtres** : une barre ou une carte avec :
  - Champ recherche (placeholder « Rechercher »)
  - Select Statut (Tous, En cours, Retrouvé vivant, Retrouvé décédé)
  - Select Urgence (Toutes, Critique, Urgent, Normal)
- **Contenu** : ligne « Total : X dossiers » puis soit un tableau, soit une grille de cartes. Chaque item affiche : numéro de dossier, badge(s) de statut, nom de la personne, date de disparition, lieu, date de création. Clic sur la ligne/carte → détail du dossier.
- États : chargement (skeleton ou spinner), vide (« Aucun dossier trouvé » avec illustration ou icône).

Design : liste/grille aérée, badges colorés selon statut, hover sur les lignes/cartes.

---

## 4. Page Détail dossier

- **Retour** : lien ou bouton « Retour » vers la liste des dossiers.
- **En-tête** : numéro de dossier, statut, niveau d’urgence.
- **Contenu** : organisation en onglets (ex. Infos, Photos, Signalements, Avis, Historique). Chaque onglet contient les blocs d’infos adaptés (identité, circonstances, localisation, médias, liste de signalements, etc.).
- **Actions** : boutons selon le métier (Modifier, Partager, Signaler, etc.) – à placer en évidence sans surcharger.

Design : fiche claire, onglets lisibles, zones bien délimitées.

---

## 5. Page Création de dossier

- **Contexte** : formulaire multi-étapes (wizard) ou long formulaire en une page.
- **Contenu à prévoir** : étapes ou sections pour : identité de la personne (nom, prénom, âge, sexe, description physique), circonstances de la disparition, lieu et date, photos, autres champs métier.
- **Actions** : « Annuler » (retour liste), « Précédent » / « Suivant » si wizard, « Enregistrer » ou « Créer le dossier » en dernier.

Design : formulaire structuré, labels clairs, boutons d’étape visibles.

---

## 6. Page Utilisateurs

- **En-tête** : titre « Utilisateurs », sous-titre « Gérer les membres de l’équipe », bouton **Ajouter un utilisateur** (ou « Inviter »).
- **Filtres** : recherche (texte), filtre par Rôle, filtre par Statut (Actif, Suspendu, Désactivé).
- **Liste** : tableau ou cartes. Colonnes (ou champs) : Avatar/initiales, Nom, Email, Rôle (badge), Statut (badge), Date d’inscription, Actions. Actions par ligne : Modifier (icône), Suspendre (si actif), Activer (si suspendu), Désactiver (icône danger, avec confirmation).
- États : chargement, liste vide (« Aucun utilisateur trouvé »).

Design : tableau propre ou cartes utilisateur, badges rôle/statut cohérents, actions en bout de ligne.

---

## 7. Page Détail utilisateur

- **Retour** vers la liste des utilisateurs.
- **Affichage** : nom, prénom, email, téléphone, statut, rôle, date d’expiration du rôle. Mode lecture avec bouton « Modifier ».
- **Édition** : formulaire avec champs Nom, Prénom, Téléphone, Statut (select), Rôle (select), Date d’expiration (optionnel). Boutons « Enregistrer » et « Annuler ».
- Gestion erreur : message si utilisateur introuvable.

Design : fiche simple, formulaire groupé, boutons d’action visibles.

---

## 8. Page Invitation utilisateur

- **Retour** vers la liste des utilisateurs.
- **Formulaire** : Email (obligatoire), Rôle (liste : Officier police, Agent gendarmerie, Responsable ONG, Opérateur saisie, Modérateur), bouton « Envoyer l’invitation ».
- **Succès** : écran de confirmation « Invitation envoyée » avec l’email + bouton « Retour aux utilisateurs ».
- **Erreur** : message au-dessus du formulaire.

Design : formulaire minimal, écran de succès rassurant.

---

## 9. Page Rapports (signalements)

- **En-tête** : titre « Rapports » (ou « Signalements »), sous-titre optionnel.
- **Filtres** : recherche, filtre par Statut (Tous, Approuvé, En attente, Rejeté).
- **Liste** : pour chaque rapport : numéro, dossier lié, auteur, extrait ou type, date, statut (badge), priorité. Actions : Voir (détail), Approuver, Rejeter.
- États : chargement, vide.

Design : cohérent avec la page Dossiers (table ou cartes), boutons Approuver/Rejeter bien identifiés.

---

## 10. Page Détail rapport

- **Retour** vers la liste des rapports.
- **Contenu** : toutes les infos du signalement (date, lieu, description, auteur, dossier lié, pièces jointes si applicable).
- **Actions** : bouton **Approuver** (primaire), bouton **Rejeter** (secondaire ou danger).

Design : fiche lisible, actions en bas ou en sticky.

---

## 11. Page Statistiques

- **Période** : sélecteur (Mois / Trimestre / Année) en onglets ou select.
- **KPIs** : cartes ou lignes avec Total dossiers, Dossiers résolus, Personnes retrouvées, etc., avec tendances si pertinent.
- **Répartition** : urgence (Critique, Urgent, Normal, Faible) – barres ou chiffres.
- **Graphique** : activité sur les derniers mois (barres ou courbe), propre et lisible.
- **Action** : bouton **Exporter en CSV** (icône téléchargement).

Design : dashboard data clair, couleurs distinctes pour les séries, pas de charte surchargée.

---

## 12. Page Paramètres de l’organisation

- **En-tête** : titre « Paramètres de l’organisation » (ou « Paramètres »), sous-titre court.
- **Navigation** : onglets horizontaux (ou verticals sur mobile) : **Général**, **Équipe**, **Notifications**, **Zones de compétence**, **Certifications**, **Paramètres IA**, **Sécurité**.

**Onglet Général**  
Champs : Nom de l’organisation, Email, Téléphone, Adresse, Site web, Description (textarea). Bouton « Enregistrer les modifications ».

**Onglet Équipe**  
- Nombre max de membres (number).  
- Case « Attribution automatique des dossiers » + courte explication.  
- Case « Approbation requise » + courte explication.  
Bouton « Enregistrer ».

**Onglet Notifications**  
Cases à cocher avec label + courte description : email nouveau dossier, email nouveau rapport, alertes, SMS urgents, Slack. Bouton « Enregistrer ».

**Onglet Zones de compétence**  
Texte d’intro. Liste de blocs « Zone » : Nom, Région, Département, Codes postaux + bouton Supprimer. Bouton « Ajouter une zone ». Bouton « Enregistrer ».

**Onglet Certifications**  
Texte d’intro. Liste de blocs : Nom, Référence, Date d’expiration + Supprimer. Bouton « Ajouter une certification ». Bouton « Enregistrer ».

**Onglet Paramètres IA**  
- Seuil de reconnaissance faciale (number 0–1, step 0.05) + description.  
- Case « Analyse automatique activée » + description.  
- Select Priorité d’analyse (Haute, Normale, Basse) + description.  
Bouton « Enregistrer ».

**Onglet Sécurité**  
- Ligne « Changer le mot de passe » + description + bouton.  
- Ligne « Authentification à deux facteurs » + description + bouton Activer.  
- Ligne « Clés API » + description + bouton « Gérer les clés API » (lien vers page Clés API).  
- **Zone danger** : titre « Zone danger », texte d’avertissement « Supprimer l’organisation » + bouton Supprimer (rouge/danger). Confirmation à prévoir en copy.

Design : onglets nets, formulaires aérés, zone danger visuellement séparée (couleur, bordure).

---

## 13. Page Gestion des rôles

- **En-tête** : titre « Gestion des rôles » ou « Rôles et permissions ».
- **Contenu** : liste des rôles (cartes ou lignes) avec pour chacun : nom, description courte, nombre d’utilisateurs, résumé des permissions. Les rôles sont du type : Opérateur saisie, Modérateur, Officier police, Agent gendarmerie, Responsable ONG, Admin organisation.
- **Référentiel** : liste ou bloc des permissions possibles (ex. Voir/Créer/Modifier dossiers, Voir/Approuver/Rejeter rapports, Gérer utilisateurs, Voir statistiques, etc.) pour que ce soit clair dans l’UI.

Design : lecture simple, pas de surcharge, éventuellement lecture seule pour les rôles système.

---

## 14. Page Journaux d’audit

- **En-tête** : titre « Journaux d’audit » ou « Historique des activités ».
- **Filtres** : recherche, filtre par Utilisateur, par Type d’action, par Période/Date.
- **Tableau** : colonnes Date/Heure, Utilisateur, Action (type + détail), Entité (Dossier/Utilisateur/Rapport), Détails, IP optionnelle. Différenciation visuelle par type d’action (couleur ou icône).
- **Action** : bouton **Exporter en CSV**.

Design : tableau dense mais lisible, filtres bien placés.

---

## 15. Page Profil

- **Contenu** : photo de profil (avec action « Changer la photo »), bloc Informations (Nom, Prénom, Email, Téléphone, Date de naissance, Adresse, Ville, Région, Pays, numéro de badge si applicable), bloc Préférences (langue, notifications, géolocalisation, rayon de notification), bloc Sécurité (lien mot de passe, 2FA). Optionnel : stats perso (dernière connexion, etc.).
- **Actions** : Mode lecture avec « Modifier », puis « Enregistrer » et « Annuler » en édition.

Design : fiche profil pro, sections bien séparées.

---

## 16. Page Clés API

- **Retour** : lien « Retour aux paramètres ».
- **En-tête** : titre « Clés API » + court texte d’explication (sécurité, usage).
- **Action** : bouton « Créer une clé » ou « Nouvelle clé ». Après création : modal ou écran avec champ « Nom de la clé », puis affichage unique de la clé avec avertissement « Ne la montrer qu’une fois » + bouton **Copier**.
- **Liste** : pour chaque clé : nom, préfixe (ex. rvl_xxxx…), date de création, statut. Action **Révoquer** (avec confirmation).

Design : liste simple, modal de création claire, zone « copier » bien visible.

---

## 17. Page Workflows

- **Contenu actuel** : titre « Workflows », texte « Fonctionnalité à venir » (ou « Bientôt disponible »), bouton « Retour aux paramètres ».
- **Design** : page minimaliste, pas de fausses promesses (pas de formulaires vides). Optionnel : esquisse de blocs futurs (modèles de dossiers, alertes auto) en grisé ou en « Coming soon ».

---

## 18. Récap pour Stitch

- **À faire** : un design **nouveau et pro** pour chaque écran ci‑dessus. Tous les blocs, boutons et liens listés doivent être présents et identifiables.
- **À ne pas faire** : recopier le design actuel de l’app. Tu pars de zéro côté visuel (couleurs, typo, composants, spacing) tout en gardant la structure et les fonctionnalités.
- **Cohérence** : même design system sur tout l’espace (boutons, cartes, badges, inputs, tables), sidebar et header identiques sur toutes les pages.
- **Responsive** : sidebar en drawer sur mobile, tableaux qui passent en cartes ou scroll horizontal si besoin, onglets adaptés (accordéon ou liste sur petit écran).
- **Accessibilité** : contrastes suffisants, zones cliquables assez grandes, labels sur les champs.

Une fois les maquettes Stitch générées, on les utilisera comme référence pour **reproduire les pages** dans l’application avec ce nouveau design.
