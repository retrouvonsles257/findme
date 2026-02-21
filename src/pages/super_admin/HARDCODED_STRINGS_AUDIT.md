# Hardcoded user-facing strings (not in t('...')) — Super Admin pages

Strings that need translation: button labels, placeholders, table headers, messages, modal titles, form labels, option text, aria-label, title attributes, and text between `>` and `<`.  
Excluded: import paths, style names, technical keys.

---

## SystemLogsPage.tsx

| Line | String |
|------|--------|
| ~232 | Type d'action |
| ~235 | Tous |
| ~241 | Du |
| ~245 | Au |
| ~252 | Réinitialiser |
| ~256 | Exporter CSV |
| ~268 | entrées au total |
| ~269 | Page … sur … |
| ~282 | Aucune entrée dans le journal |
| ~291 | Type |
| ~292 | Description |
| ~293 | Utilisateur |
| ~294 | IP |
| ~312 | Système |
| ~332 | Précédent |
| ~361 | Suivant |
| ~371 | Détails du journal |
| ~375 | ID: |
| ~376 | Date: |
| ~377 | Type action: |
| ~379 | Action détaillée: |
| ~381 | Utilisateur: |
| ~382 | Système (in span) |
| ~383 | IP: |
| ~384 | User Agent: |
| ~386 | Localisation: |
| ~389 | Dossier: |
| ~392 | Signalement: |
| ~395 | Alerte: |
| ~399 | Description: |
| ~404 | Données avant: |
| ~412 | Données après: |
| ~416 | Fermer |
| 136–150 | getTypeLabel: Connexion, Déconnexion, Création, Modification, Suppression, Consultation, Signalement, Alerte, Autre |
| 193 | CSV headers: Date, Type, Utilisateur, Email, Description, IP |
| 219 | Erreur lors de l'export: … |

---

## GlobalStatsPage.tsx

| Line | String |
|------|--------|
| 405 | Statistiques globales (fallback) |
| 367–399 | statCards labels: Total dossiers, Retrouvés, En cours, Taux de succès, Signalements, Organisations |
| 428 | Évolution mensuelle |
| 431–432 | Dossiers, Signalements (legend) |
| 368 | Analyse par région |
| 371 | Aucune donnée régionale disponible |
| 374–377 | Table: Région, Total, Retrouvés, Taux |
| 396 | Analyse par tranche d'âge |
| 399 | Aucune donnée d'âge disponible |
| 402–405 | Tranche d'âge, Total, Retrouvés, Taux |
| 426 | Analyse par sexe |
| 429 | Aucune donnée de sexe disponible |
| 432–435 | Sexe, Total, Retrouvés, Taux |
| 456 | Analyse par type de disparition |
| 459 | Aucune donnée de type disponible |
| 462–465 | Type, Total, Retrouvés, Taux |
| 486 | Tendances quotidiennes (30 derniers jours) |
| 489–491 | Dossiers créés, Signalements, Retrouvés (legend) |
| 459–461 | title: … dossiers, … signalements, … retrouvés |
| 232–241 | typeLabels: Fugue, Enlèvement présumé, etc. |
| 244 | Inconnu (age group) |
| 309–311 | Masculin, Féminin, Inconnu, Non précisé |
| 145 | Non spécifié (region) |

---

## SuperAdminLayout.tsx

| Line | String |
|------|--------|
| ~269 | RetrouvonsLes (logo) |
| ~276 | Ouvrir le menu / Réduire le menu (title) |
| ~374 | English / Français (language toggle) |
| ~391 | Search... (placeholder fallback) |
| ~399 | Notifications (title fallback) |
| ~424 | RetrouvonsLes (mobile app name) |
| ~206 | Super Admin (getUserLabel fallback) |

---

## Dashboardpage.tsx

| Line | String |
|------|--------|
| ~136 | Signalements (fallback) |
| ~137 | En attente (fallback) |
| ~138–142 | Notifications système, Notifications non lues, Photos en attente, Commentaires confidentiels, Documents joints |
| ~149 | Gérer les rôles / Permissions (fallback) |
| ~150 | Cas urgents (fallback) |
| ~151 | Validation (fallback) |
| ~152 | Finances (fallback) |
| ~153 | Sensibilisation (fallback) |

---

## ProfilePage.tsx

| Line | String |
|------|--------|
| ~341, 349 | Mon Profil (title) |
| ~105 | Non connecté |
| ~166 | Erreur lors de l'upload Cloudinary. |
| ~180 | Photo de profil mise à jour |
| ~183 | Erreur lors de l'upload |
| ~205 | Format JSON invalide pour les préférences de notification |
| ~242 | Profil mis à jour avec succès |
| ~260 | Les mots de passe ne correspondent pas |
| ~264 | Le mot de passe doit contenir au moins 8 caractères |
| ~273 | Mot de passe modifié avec succès |
| ~309, 332 | aria-label: Diminuer, Augmenter |
| ~365 | Avatar (alt) |
| ~373 | Changer la photo (aria-label / title) |
| ~391 | Super Administrateur |
| ~296 | Informations personnelles |
| ~300 | Nom * |
| ~306 | Votre nom (placeholder) |
| ~311 | Prénom |
| ~313 | Votre prénom |
| ~318 | Téléphone |
| ~321 | +237 6XX XXX XXX |
| ~326 | Ville |
| ~329 | Votre ville |
| ~334 | Pays |
| ~337 | Votre pays |
| ~342 | Adresse |
| ~345 | Votre adresse complète |
| ~350 | Région |
| ~353 | Votre région |
| ~358 | Date de naissance |
| ~363 | Numéro de badge |
| ~366 | Numéro de badge (si applicable) |
| ~371 | Document d'accréditation |
| ~374 | Référence du document d'accréditation |
| ~377 | Localisation |
| ~379 | Latitude |
| ~386 | Longitude |
| ~393 | Rayon de notification (km) |
| ~398 | Préférences |
| ~401 | Langue préférée |
| ~406–407 | Français, English (options) |
| ~414 | Accepter les notifications |
| ~422 | Accepter la géolocalisation |
| ~416 | Préférences de notification (JSON) |
| ~419 | Format JSON valide requis… |
| ~424 | Enregistrer les modifications |
| ~430 | Sécurité |
| ~436 | Modifier mon mot de passe |
| ~441 | Nouveau mot de passe * |
| ~449 | Minimum 8 caractères |
| ~455 | Confirmer le mot de passe * |
| ~462 | Confirmez le mot de passe |
| ~468 | Annuler |
| ~472 | Modifier le mot de passe |
| ~481 | Informations du compte |
| ~483 | Compte créé le … |
| ~486 | Dernière modification le … |
| ~489 | Dernière connexion le … |
| ~492 | Statut: |
| ~495 | Type de compte: |
| ~498 | Score de fiabilité: |
| ~501–502 | Signalements: … valides, … invalides |

---

## DonsPage.tsx

| Line | String |
|------|--------|
| ~241 | Gestion des Dons (title) |
| ~251 | Total dons |
| ~259 | Complétés |
| ~267 | En attente |
| ~275 | Moyenne |
| ~284 | Rechercher donateur, référence... |
| ~295 | Exporter CSV |
| ~300 | Tous statuts |
| ~301–305 | En attente, Réussi, Échoué, Remboursé, Annulé (options) |
| ~311 | Tous modes |
| ~312–316 | Carte bancaire, Mobile Money, Virement, PayPal, Autre |
| ~335 | Aucun don trouvé |
| ~343–349 | Date, Donateur, Montant, Mode, Statut, Dossier, Actions |
| ~358 | Anonyme |
| ~387–388 | Précédent, Suivant |
| ~386 | Page … sur … |
| ~397 | Détails du don |
| ~399–406 | Date:, Montant:, Mode:, Statut:, Type:, Référence:, Donateur:, Message: |
| ~410 | Fermer |
| 213–221 | getStatutLabel: En attente, Réussi, etc. |
| 224–230 | getModeLabel: Carte bancaire, etc. |
| 164 | CSV headers |
| 219 | Erreur lors de l'export: … |

---

## OrganisationsPage.tsx

| Line | String |
|------|--------|
| ~424 | Types & Certifications (button) |
| ~429 | Exporter CSV |
| ~455 | Chargement… |
| ~458 | Aucun utilisateur |
| ~468 | Tél. |
| ~471 | Dernière connexion: … |
| ~478 | Modifier |
| ~479 | Fermer |
| ~519 | Gérer les types d'organisations et certifications (modal title) |
| ~527 | Certifications disponibles |
| ~538 | Ajouter une certification... (placeholder) |
| ~559 | Ajouter |
| ~567 | Types d'organisations |
| ~583 | Actif |
| ~593 | Certifications requises pour ce type : |
| ~616 | Ajouter une certification... (option) |
| ~631 | Annuler |
| ~638 | Enregistrer |
| 56–116 | DEFAULT_ORGANISATIONS_CONFIG labels/descriptions (Police, Gendarmerie, ONG Humanitaire, etc.) |
| 266 | Configuration des types d'organisations sauvegardée avec succès |
| 319 | Organisation créée avec succès / Organisation modifiée avec succès |
| 392 | Actif / Inactif (view modal) |
| 393 | Utilisateurs: |
| 396 | Liste des utilisateurs (…) |

---

## SignalementValidationPage.tsx

| Line | String |
|------|--------|
| ~393 | Validation des Signalements (title) |
| ~401 | Total signalements |
| ~409 | En attente |
| ~417 | Validés |
| ~325 | Rejetés |
| ~332 | Tous les statuts |
| ~333–338 | En attente, En cours de vérification, Validé, Invalide, Spam, Doublon |
| ~355 | Exporter CSV |
| ~368 | Aucun signalement trouvé |
| ~375–381 | Date, Signaleur, Dossier, Lieu, Fiabilité, Statut, Actions |
| ~386 | Anonyme |
| ~430–431 | title: Voir détails, Modifier |
| ~419 | Valider |
| ~426 | Invalider |
| ~434 | Supprimer |
| ~434–435 | Précédent, Suivant |
| ~433 | Page … sur … |
| ~442 | Détails du signalement |
| ~447–541 | All modal labels (Numéro signalement, Date de création, Signaleur, etc.) |
| ~524 | Aucune description |
| ~531 | Commentaire vérification (optionnel) |
| ~532 | Ajouter un commentaire avant de valider/invalider... |
| ~541–558 | Invalider, Marquer Spam, Marquer Doublon, Valider |
| ~559 | Fermer |
| ~566 | Modifier le signalement |
| ~570 | Statut |
| ~572–577 | Option labels (En attente, etc.) |
| ~580 | Commentaire vérification |
| ~581 | Optionnel |
| ~585 | Annuler |
| ~587 | Enregistrer |
| ~594 | Supprimer le signalement |
| ~598 | Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible. |
| ~601 | Annuler |
| ~603 | Supprimer |
| 378–385 | getStatutLabel |

---

## SystemUsersPage.tsx

| Line | String |
|------|--------|
| ~437 | Organisation (table header) |
| ~447 | Actif, Bloqué, Suspendu, Inactif (badge) |
| ~459 | Réinitialiser mot de passe (title) |
| ~461 | Désactiver / Activer (title) |
| ~464 | Bloquer définitivement (title) |
| ~467 | Gérer dates expiration rôles (title) |
| ~478 | Modifier |
| ~479 | Fermer |
| ~491 | Organisation (form label) |
| ~492 | -- Aucune -- |
| ~496 | Statut compte |
| ~498–502 | Actif, En attente vérification, Suspendu, Désactivé, Bloqué |
| ~506 | Type compte |
| ~508–509 | Grand public, Autorité |
| ~346 | Êtes-vous sûr de vouloir bloquer définitivement … ? |
| ~374 | Utilisateur … bloqué définitivement |
| ~411 | Dates d'expiration des rôles mises à jour |
| ~449 | Statut de … changé en … |
| ~468 | Envoyer un email de réinitialisation du mot de passe à … ? |
| ~376 | Email de réinitialisation envoyé à … |
| ~386 | Erreur lors de l'envoi de l'email: … |
| ~534 | Gérer dates d'expiration des rôles — … (modal title) |
| ~538 | Aucun rôle assigné. Modifiez l'utilisateur pour ajouter des rôles. |
| ~547 | (Expire le …) |
| ~561 | Laisser vide pour aucune expiration |
| ~566 | Annuler |
| ~569 | Enregistrer |
| ~441 | aria-label: Fermer |

---

## RolesPage.tsx

| Line | String |
|------|--------|
| ~341 | Gestion des Rôles (title) |
| ~351 | Rechercher un rôle... |
| ~366 | Exporter CSV |
| ~369 | Nouveau rôle |
| ~404 | Aucun rôle |
| ~416 | Niveau … |
| ~322 | utilisateur(s) |
| ~331–334 | title: Voir détails, Modifier, Supprimer |
| ~352 | Confirmer la suppression ? |
| ~362 | Nouveau rôle / Modifier rôle (modal) |
| ~367 | Nom du rôle * |
| ~372 | Sélectionner un rôle... |
| ~375 | NOM_ROLE_OPTIONS labels (Super Admin, Admin Organisation, etc.) |
| ~379 | Description |
| ~382 | Description des permissions et responsabilités... |
| ~385 | Niveau d'accréditation (1-100) * |
| ~392 | Actuel: … \| 1-19: Invité, … |
| ~396 | Permissions (JSON) |
| ~399 | placeholder JSON |
| ~401 | Format JSON valide requis. Exemple: … |
| ~406 | Annuler |
| ~408 | Enregistrer |
| ~417 | Détails du rôle |
| ~426 | Nom du rôle: |
| ~432 | Description: |
| ~435 | Niveau d'accréditation: |
| ~439 | Nombre d'utilisateurs: |
| ~443 | Liste des utilisateurs (…) |
| ~447 | Chargement… |
| ~450 | Aucun utilisateur |
| ~457 | Tél. |
| ~463 | Date de création: |
| ~465 | Permissions: |
| ~471 | Fermer |
| ~472 | Modifier |
| 31–40 | NOM_ROLE_OPTIONS labels |
| 272–278 | getNiveauLabel: Super Admin, Admin, Gestionnaire, Opérateur, Utilisateur, Invité |
| 194 | Format JSON invalide pour les permissions |
| 216, 224 | Rôle créé/modifié avec succès |
| 251 | Impossible de supprimer: des utilisateurs utilisent ce rôle |

---

## DossiersPage.tsx

| Line | String |
|------|--------|
| ~458 | Gestion des Dossiers (title) |
| ~462 | Gestion des Dossiers |
| ~463 | Créez, modifiez et gérez tous les dossiers de disparition |
| ~468 | Exporter CSV |
| ~472 | Créer un dossier |
| ~480 | Rechercher par numéro ou lieu... |
| ~486–491 | Tous les statuts, En cours, Retrouvé vivant, etc. |
| ~494–498 | Tous les niveaux, Critique, Urgent, Normal, Faible |
| ~501 | Les dossiers archivés restent… (hint) |
| ~519 | Aucun dossier trouvé |
| ~527–534 | Numéro, Personne, Date, Lieu, Type, Statut, Urgence, Actions |
| ~538 | Voir le détail complet (title) |
| ~528–532 | Modifier le dossier, Voir détail, Archiver, Supprimer |
| ~534 | Modifier |
| ~537 | Voir détail |
| ~556–557 | Précédent, Suivant |
| ~555 | Page … sur … |
| ~567 | Créer un dossier / Modifier le dossier (modal) |
| ~573 | Numéro de dossier |
| ~574 | Laissé vide pour génération automatique |
| ~579 | Date de disparition * |
| ~586 | Lieu de disparition |
| ~593 | Ville |
| ~600 | Région |
| ~607 | Type de disparition * |
| ~612–619 | Fugue, Enlèvement présumé, Accident, etc. |
| ~624 | Statut * |
| ~629–634 | En cours, Retrouvé vivant, etc. |
| ~639 | Niveau d'urgence * |
| ~644–647 | Critique, Urgent, Normal, Faible |
| ~652 | Personne |
| ~653 | Sélectionner une personne |
| ~661 | Organisation responsable |
| ~662 | Aucune |
| ~669 | Circonstances |
| ~677 | Visible publiquement |
| ~682 | Annuler |
| ~684 | Créer / Enregistrer |
| ~651 | aria-label: Fermer |
| ~647 | Confirmer la suppression |
| ~651 | Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible. |
| ~654 | Annuler |
| ~656 | Supprimer |
| 419 | Erreur lors de l'export: … |

---

## DossiersCritiquesPage.tsx

| Line | String |
|------|--------|
| ~279 | Dossiers Critiques (title) |
| ~287 | Critiques / Dossiers (stat label) |
| ~298–301 | Tous niveaux, Critique, Élevée, Normale, Basse |
| ~307–310 | Tous statuts, En cours, Résolu, Clos, Archivé |
| ~317 | Exporter CSV |
| ~337 | Aucun dossier trouvé |
| ~355 | jours |
| ~371 | Disparu(e) le … |
| ~378 | signalement(s) |
| ~385 | Voir détail complet |
| ~389 | Aperçu rapide |
| ~305–306 | Précédent, Suivant |
| ~304 | Page … sur … |
| ~321 | aria-label: Fermer |
| ~328 | Titre:, Niveau urgence:, Statut:, etc. |
| ~341 | Âge: … ans |
| ~347 | Créé le: |
| ~351 | Voir détail complet |
| ~353 | Modifier |
| ~355 | Fermer |
| 249–255 | getUrgenceLabel |
| 257–264 | getStatutLabel |
| 221 | Erreur lors de l'export: … |
| 133 | Disparition (titre fallback) |

---

## DocumentsPage.tsx

| Line | String |
|------|--------|
| ~126 | Gestion Documents (title) |
| ~129 | Gestion des Documents |
| ~130 | Consultez et gérez tous les documents joints |
| ~137 | Tous types |
| ~138–146 | Plainte officielle, Rapport police, Témoignage écrit, etc. |
| ~153–154 | Tous, Confidentiels, Publics |
| ~158 | Exporter CSV |
| ~181 | Aucun document trouvé |
| ~185–193 | Nom fichier, Type, Format, Taille, Confidentiel, Dossier, Uploadé par, Date, Actions |

---

## CampagnesPage.tsx

| Line | String |
|------|--------|
| ~245 | Campagne créée avec succès / Campagne modifiée avec succès |
| (rest of file) | Title, filters, table headers, modal labels, form labels, buttons (Nouvelle campagne, Exporter CSV, etc.) — full scan recommended for all French/EN strings. |

---

## AlertesPage.tsx

| Line | String |
|------|--------|
| (throughout) | Page title, stats labels, filter options, table headers, modal titles, form labels (Titre, Message, Type alerte, Rayon km, etc.), button labels (Créer alerte, Exporter CSV, Valider, Annuler, Fermer), success/error messages. Full file scan recommended. |

---

## ResultatsIAPage.tsx

| Line | String |
|------|--------|
| ~218 | Veuillez sélectionner au moins un résultat |
| ~242 | résultat(s) confirmé(s) / infirmé(s) / marqué(s) comme incertain(s)… |
| ~247 | Erreur lors de la validation en masse: … |
| ~192 | Erreur lors de la validation: … |
| (rest) | Page title, stats (Total, Validés, En attente, Score moyen), filters, table headers, modal labels, buttons (Voir, Confirmer, Infirmer, Incertain, Exporter CSV, Précédent, Suivant, Fermer), empty/error messages. |

---

## SystemSettingsPage.tsx

| Line | String |
|------|--------|
| ~144 | Paramètres système (fallback) |
| ~109 | Configuration système sauvegardée avec succès |
| ~174 | Informations système |
| ~179 | Nom du système |
| ~186 | Version |
| ~195 | Langue par défaut |
| ~202–204 | Français, English, العربية |
| ~212 | Mode maintenance |
| ~218 | Mode maintenance activé |
| ~230 | Message de maintenance |
| ~246 | Configuration email |
| ~252 | Notifications email activées |
| ~38 | Le système est en maintenance. Veuillez réessayer plus tard. |
| ~132, 136 | aria-label: Diminuer, Augmenter |

---

## DossierDetailPage.tsx

| Line | String |
|------|--------|
| ~195 | Dossier — … / Détail dossier (title) |
| ~190 | Commentaires (tab label) |
| ~191 | Résultats IA (tab label) |

---

## LiensFiliationPage.tsx

| Line | String |
|------|--------|
| ~131 | Liens de Filiation (title) |
| ~133 | Gestion des Liens de Filiation |
| ~134 | Consultez et gérez tous les liens de filiation |
| ~142 | Tous types |
| ~143–148 | Père biologique, Mère biologique, Enfant biologique, Frère biologique, Sœur biologique, Conjoint |
| 94–101 | getTypeLabel (same labels) |

---

## CommentairesPage.tsx

| Line | String |
|------|--------|
| ~117 | Commentaires Confidentiels (title) |
| ~119 | Commentaires Confidentiels |
| ~120 | Consultez tous les commentaires confidentiels |
| ~127 | Tous types |
| ~128–134 | Note enquête, Coordination, Info complémentaire, Mise à jour, Question, Réponse, Autre |
| ~138–139 | Tous, Confidentiels, Publics |
| ~144 | Exporter CSV |

---

## PhotosPage.tsx

| Line | String |
|------|--------|
| ~115 | Erreur: … (setError) |
| ~135 | Erreur: … (setError) |
| (rest) | Page title, filters (Tous types, Approuvées/Non, Visible), table headers, modal labels, Approuver / Rejeter buttons, Exporter CSV, Précédent, Suivant, Fermer, Aucune photo trouvée. |

---

## NotificationsSystemPage.tsx

| Line | String |
|------|--------|
| (throughout) | Page title, filters (type, canal, statut, lue), table headers (Type, Titre, Message, Canal, Priorité, Statut, Lue, Date, Utilisateur, Dossier, Actions), modal labels, Exporter CSV, Précédent, Suivant, Fermer, empty/error messages. |

---

*Generated for translation audit. Replace each listed string with a key and use `t('key')` (or `t("key")`) from `useI18n()`.*
