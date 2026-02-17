# Textes en dur – espace modérateur

Liste de tous les textes affichés à l’utilisateur (header, sidebar, pages) qui ne passent pas encore par l’i18n. À remplacer par `t('moderator.xxx')` ou `common.xxx` et à ajouter dans `fr/moderator.json` et `en/moderator.json`.

---

## ModerationLayout.tsx (header + sidebar)

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 217 | `title` bouton toggle menu | `'Ouvrir le menu'` / `'Réduire le menu'` (fallback si `t('common.openMenu')` / `t('common.closeMenu')` vide) |
| 313 | Menu utilisateur (langue) | `'English'` / `'Français'` |

---

## SignalementsValidationPage.tsx

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 398 | placeholder recherche | `'Rechercher par lieu, description...'` (fallback après `t('moderator.searchPlaceholder')`) |

---

## Reportspage.tsx

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 128 | Titre layout | `"Rapports de Modération"` |
| 132 | Titre H1 | `"Rapports de Modération"` |
| 133-134 | Sous-titre | `"Statistiques et analyses des signalements modérés."` |
| 139 | Message chargement | `"Chargement des rapports..."` |
| 145 | Label filtre | `"Période"` |
| 151-153 | Options période | `"Derniers 7 jours"`, `"Dernier mois"`, `"Tous les temps"` |
| 178 | Titre section | `"Distribution des Statuts"` |
| 181 | Label statut | `"Nouveaux"` |
| 213 | Label statut | `"Validés"` |
| 247 | Label statut | `"Rejetés"` |
| 249 | Label statut | `"Fermés"` (si présent) |
| 265 | Titre section | `"Top 10 Lieux de Signalement"` (si présent) |
| 268 | Libellé count | `"X signalements"` (dans item liste) |
| 282 | Titre section | `"Activité par Date (Derniers 10 jours)"` (si présent) |
| 296 | Libellé count | `"X signalements"` (dans item activité) |
| 91 (code) | Fallback lieu | `'Non spécifié'` (dans `lieu_observation \|\| ...`) |

---

## DonationsPage.tsx (modérateur)

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 53 | Hero titre | `"Soutenir RetrouvonsLes"` |
| 54-55 | Hero sous-titre | `"Orange Money / MTN MoMo (mode dev/mock par défaut). Les confirmations réelles passent par webhook."` |
| 62 | Pill | `"Orange Money"`, `"MTN MoMo"` |
| 65 | Pill | `"Paiement sécurisé (webhook)"` |
| 68 | Pill | `"Mode dev: mock par défaut"` |
| 76 | Titre carte | `"Faire un don"` |
| 77 | Hint | `"Orange / MTN • XAF"` |
| 82-85 | Note | `"En dev, le paiement est simulé via une Edge Function. En production, la confirmation viendra via webhook de la passerelle."` |
| 93 | Titre carte | `"Mes dons"` |

---

## MapViewPage.tsx

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 347 | Titre panneau | `"Sur la carte (X)"` |
| 366, 412, 461 | Fallback lieu | `'Lieu non spécifié'` |
| 384 | Message | `"+ X autres sur la carte"` |
| 391-392 | Titre + count | `"Sans GPS (X)"` |
| 431 | Message | `"+ X autres sans coordonnées"` |
| 464 | Texte (sans GPS) | `"(sans GPS)"` |
| 477 | Label | `"Coordonnées manquantes"` |
| 541 | Label modal | `"Coordonnées"` |
| 548 | Label | `"Date d'observation"` |
| 552 | Label | `"Statut"` |
| 561 | Label | `"Score"` |
| 569 | Label | `"Description"` |
| 581 | Bouton | Texte du bouton « Voir » (déjà `t('common.view')` si fait) |

---

## IAResultsPage.tsx

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 367 | Titre layout | `"Résultats IA"` |
| 373-374 | Titre H1 | `"Résultats d'Analyse IA"` |
| 376-378 | Sous-titre | `"Consultez les correspondances et analyses effectuées par l'intelligence artificielle."` + `"Note : La validation des résultats est réservée aux autorités (niveau 4+)."` |
| 389 | Placeholder | `"Rechercher par dossier, signalement..."` |
| 399 | Bouton | `"Filtres"` |
| 414 | Label | `"Type d'analyse"` |
| 419-426 | Options type | `"Tous"`, `"Reconnaissance faciale"`, `"Comparaison photos"`, `"Prédiction localisation"`, `"Détection similitudes"`, `"Analyse biométrique"`, `"Regroupement cas"`, `"Estimation âge"` |
| 431 | Label | `"Statut"` |
| 436-441 | Options statut | `"Tous"`, `"En attente"`, `"Confirmés"`, `"Infirmés"`, `"Incertains"`, `"À vérifier"` |
| 446 | Label | `"Score minimum"` |
| 451 | Option | `"Tous"` |
| 459 | Label | `"Période"` |
| 464-467 | Options période | `"Toutes"`, `"7 derniers jours"`, `"30 derniers jours"`, `"90 derniers jours"` |
| 480 | Label stat | `"Total analyses"` |
| 487 | Label stat | `"En attente"` |
| 494 | Label stat | `"Confirmés"` |
| 501 | Label stat | `"Score moyen"` |
| 550 | Label | `"Confiance"` |
| 557 | Libellé | `"Dossier:"` |
| 588 | Bouton | `"Voir détails"` |
| 597 | Message vide | `"Aucun résultat d'analyse IA trouvé"` |
| 611 | Pagination | `"Précédent"` |
| 612 | Pagination | `"Page X / Y"` |
| 617 | Pagination | `"Suivant"` |
| 664 | Label | `"Score de confiance"` |
| 666 | Texte | `"Seuil de décision: X%"` |
| 673 | Titre | `"Informations"` |
| 676, 681, 687, 693, 699, 705, 711 | Labels | `"Date d'analyse"`, `"Modèle IA"`, `"Version"`, `"Temps de traitement"`, `"Dossier"`, `"Signalement"`, `"Action générée"` |
| 724 | Bouton | `"Masquer"` / `"Afficher la comparaison"` |
| 738, 755 | Labels | `"Photo analysée"`, `"Photo de référence"` |
| 744 | Message | `"Photo non disponible"` |
| 752 | Texte | `"similarité"` |
| 761 | Message | `"Référence non disponible"` |
| 775, 783, 791, 799 | Titres | `"Photo analysée"`, `"Facteurs clés"`, `"Correspondances trouvées"`, `"Commentaire de validation"` |
| 810 | Texte | `"Validé le ..."` (date) |
| 815 | Titre | `"Signaler un faux positif évident"` |
| 823 | Bouton | `"Signaler"` |
| 831-833 | Paragraphe info | Texte explicatif faux positif |
| 838 | Placeholder | `"Décrivez pourquoi ce résultat est un faux positif évident..."` |
| 849 | Bouton | `"Annuler"` |
| 856 | Bouton | `"Envoi..."` / `"Envoyer le signalement"` |
| 868 | Message | `"Ce résultat a été signalé comme faux positif potentiel"` |
| 868 | Message succès | `flagSuccess` : `"Faux positif signalé avec succès. Un officier examinera ce résultat."` (l.297) |
| 884-886 | Note | `"En tant que modérateur, vous pouvez consulter..."` |
| 330-339 | Labels types analyse (getTypeAnalyseInfo) | `"Reconnaissance faciale"`, `"Comparaison photos"`, etc. |
| 347-351 | Labels statuts (getStatusInfo) | `"En attente"`, `"Confirmé"`, `"Infirmé"`, `"Incertain"`, `"À vérifier"` |

---

## IdentityVerificationPage.tsx

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 190 | Message erreur | `"Erreur lors du chargement des demandes"` |
| 259 | Message erreur | `"Erreur lors du traitement"` |
| 243-246 | Messages succès | `"Identité vérifiée avec succès !"`, `"Demande rejetée"`, `"Complément demandé"` |
| 268-272 | Badges statut | `"En attente"`, `"En cours"`, `"Approuvé"`, `"Rejeté"`, `"Complément demandé"` |
| 286 | Titre | `"Vérification d'identité des citoyens"` |
| 289-290 | Sous-titre | `"Examinez les documents d'identité soumis par les citoyens pour valider leur passage au niveau \"Citoyen Vérifié\" (badge de confiance)."` |
| 300 | Placeholder | `"Rechercher par nom, email..."` |
| 325 | Label | `"Statut"` |
| 330-335 | Options statut | `"Tous"`, `"En attente"`, `"En cours"`, `"Approuvés"`, `"Rejetés"`, `"Complément demandé"` |
| 340 | Label | `"Type de document"` |
| 345-348 | Options type | `"Tous"`, `"CNI"`, `"Passeport"`, `"Autre"` |
| 353 | Label | `"Période"` |
| 358 | Option | `"Toutes"` (et options 7/30 jours si présentes) |
| 387, 394, 401, 408 | Labels stats | `"Total"`, `"En attente"`, `"Vérifiés"`, `"Rejetés"` |
| 600 | Titre | `"Document d'identité"` |
| 604-605 | Type doc | `"Carte Nationale d'Identité"`, `"Passeport"`, `"Autre document"` |
| 612 | alt image | `"Document d'identité"` |
| 621 | Lien | `"Voir en plein écran"` |
| 627 | Message | `"Aucun document soumis"` |
| 638 | Titre | `"Décision de vérification"` |
| 650, 664, 673 | Boutons | `"Approuver"`, `"Rejeter"`, `"Demander complément"` |
| 676 | Label | `"Raison du rejet *"` |
| 684-690 | Options raison | `"Sélectionner une raison"`, `"Document illisible"`, `"Document expiré"`, etc. |
| 696 | Label | `"Notes (optionnel)"` |
| 698 | Placeholder | `"Notes internes..."` |
| 716 | Texte | `"Traitement..."` |
| 723 | Bouton | `"Confirmer la décision"` |
| 734-741 | Message déjà traité | `"Cette demande a été approuvée / rejetée / traitée (complément demandé) le ..."` |
| 751 | Titre layout | `"Vérification d'identité"` |

---

## PhotosModerationPage.tsx

| Ligne | Contexte | Texte en dur |
|-------|----------|--------------|
| 181 | Message erreur | `"Erreur lors du chargement des photos"` |
| 225 | Message erreur | `"Erreur lors de l'approbation"` |
| 263 | Message erreur | `"Erreur lors du rejet"` |
| 291 | Message erreur | `"Erreur"` |
| 403 | Message succès | `"Zones de floutage enregistrées avec succès"` |
| 409 | Message erreur | `"Erreur lors de la sauvegarde"` |
| 420, 423, 425 | Labels badge (getStatusBadge) | `"Approuvée"`, `"Rejetée"`, `"En attente"` |
| 449 | Placeholder | `"Rechercher..."` |
| 476 | Label | `"Statut"` |
| 481-484 | Options statut | `"Tous"`, `"En attente"`, `"Approuvées"`, `"Rejetées"` |
| 489 | Label | `"Type"` |
| 494-501 | Options type | `"Tous"`, `"Portrait"`, `"Corps entier"`, `"Signalement"`, `"Lieu"`, `"Objet personnel"`, `"Document"`, `"Autre"` |
| 506 | Label | `"Qualité"` |
| 511-515 | Options qualité | `"Toutes"`, `"Excellente"`, `"Bonne"`, `"Moyenne"`, `"Faible"` |
| 539 | Pagination | `"Page X / Y"` |
| 561 | alt image | `"Photo"` (ou `photo.titre`) |
| 633, 646 | Boutons | `"Approuver"`, `"Rejeter"` |
| 655 | Message vide | `"Aucune photo trouvée"` |
| 668, 674 | Pagination | `"Précédent"`, `"Suivant"` |
| 709 | Texte | `"Dessinez des rectangles sur les zones à flouter"` |
| 717 | title | `"Effacer tout"` |
| 724 | Bouton | `"Annuler"` |
| 737 | Bouton | `"Enregistrer (X)"` |
| 927-928 | Label | `"Type de photo"` |
| 934-940 | Options type (modal) | `"Portrait"`, `"Corps entier"`, `"Signalement"`, `"Lieu de disparition"`, etc. |
| 953 | Label | `"Visible publiquement"` |
| 958 | Label | `"Notes (optionnel)"` |
| 961 | Placeholder | `"Notes de modération..."` |
| 977, 991 | Boutons | `"Approuver"`, `"Rejeter"` |
| 1001-1004 | Message | `"Cette photo a déjà été approuvée / rejetée le ..."`, `"date inconnue"` |
| 252 (code) | Description rejet | `"Non spécifiée"` (dans description journal) |

---

## Fichiers déjà bien couverts en i18n

- **DashboardPage.tsx** : titres, stats, actions, libellés utilisent déjà `t()`.
- **NotificationsPage.tsx** : libellés, filtres, messages, dates en `t()`.
- **ActivityHistoryPage.tsx** : libellés, filtres, messages en `t()`.
- **ModerationLayout** : sidebar (appName, roleModerator, nav) et header utilisent `t()`, sauf les deux fallbacks et le libellé de langue dans le menu.

---

## Récap par fichier à traiter

1. **ModerationLayout.tsx** : 2 fallbacks + libellé « English » / « Français ».
2. **SignalementsValidationPage.tsx** : 1 fallback placeholder.
3. **Reportspage.tsx** : titre, sous-titre, chargement, période, options, sections, labels (Nouveaux, Validés, Rejetés, Fermés, etc.) + fallback `Non spécifié`.
4. **DonationsPage.tsx** : hero, pills, titres cartes, note (tout le bloc dons).
5. **MapViewPage.tsx** : « Sur la carte », fallbacks lieu, « Sans GPS », « Coordonnées manquantes », labels modal, « autres sur la carte », « autres sans coordonnées ».
6. **IAResultsPage.tsx** : titre page, header, filtre, labels, options, stats, pagination, modal (tous les labels, boutons, messages, note modérateur, faux positif).
7. **IdentityVerificationPage.tsx** : titre, sous-titre, erreurs, succès, badges, filtres, options, formulaire décision, messages déjà traité.
8. **PhotosModerationPage.tsx** : erreurs, succès, badges, recherche, filtres, options, pagination, boutons, modal (floutage, formulaire, messages).

Ce document peut servir de checklist pour remplacer chaque entrée par une clé i18n et ajouter les traductions dans `fr/moderator.json` et `en/moderator.json`.
