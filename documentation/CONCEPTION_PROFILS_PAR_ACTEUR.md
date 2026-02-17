# Conception des profils par acteur — RetrouvonsLes

**Version** : 1.0  
**Références** : `roles_permissions.txt`, `questions_reponses_inscription.txt`, `modele_donnee.sql`

---

## 1. Principe directeur

Dans une application multi-acteurs, **le profil n’est pas un écran unique dupliqué** : chaque rôle a des besoins métier, des champs pertinents et des actions différentes. Un même écran "Profil" pour tous conduit à des incohérences (ex. proposer un "périmètre pour recevoir les alertes" à celui qui **crée** les alertes). La conception doit être **orientée par les permissions et le flux métier**, pas par le partage de composants à l’aveugle.

---

## 2. Qui reçoit quoi : alertes vs notifications

| Acteur | Rôle par rapport aux alertes | Ce qu’il reçoit | Implication profil |
|--------|-----------------------------|------------------|--------------------|
| **Citoyen (0–1)** | **Destinataire** des alertes géolocalisées | Alertes dans un **rayon** (zone géographique) | **Périmètre (rayon_km), géoloc, notifications** : pertinents |
| **Autorités (2–7)** | **Créateurs / diffuseurs** d’alertes | Notifications **métier** (mise à jour dossier, correspondance IA, coordination) | **Pas de rayon d’alertes** ; uniquement **notifications métier + langue** |

**Conséquence** : pour Authority et NGO, la section Préférences ne doit **pas** contenir :
- "Rayon pour recevoir les alertes" (ils ne les reçoivent pas dans un périmètre, ils les créent).
- "Géolocalisation pour les alertes locales" (réservé aux citoyens ciblés par les alertes).

Elle doit contenir :
- **Notifications** : recevoir ou non les notifications métier (dossiers, IA, coordination).
- **Langue** : langue de l’interface.

---

## 3. Flux après clic sur l’avatar (sidebar)

Comportement cible, aligné sur les rôles :

| Zone | Action | Comportement |
|------|--------|--------------|
| **Header (avatar)** | Clic | Navigation directe vers la **page Profil** (lecture). Pas de menu : un clic = aller au profil. |
| **Sidebar (bloc profil)** | Clic | Ouvre un **menu déroulant** (dropdown). |
| **Dropdown** | En-tête | Avatar + **nom complet** + **email** (toujours affichés pour identification). |
| **Dropdown** | "Modifier le profil" | Navigation vers `/…/profile` avec **state `edit: true`** → la page s’ouvre **directement en mode édition** (formulaire actif). |
| **Dropdown** | "Paramètres" | Navigation vers `/…/settings`. |
| **Dropdown** | "Sécurité" | Navigation vers `/…/security` (mot de passe, session). |
| **Dropdown** | "Déconnexion" | `logoutThunk` puis redirection login. |

**Règle** : "Modifier le profil" = **intention d’édition** ; la page profil doit ouvrir en mode édition (boutons Enregistrer / Annuler visibles, champs éditables) sans clic supplémentaire.

**Fermeture** : clic en dehors du dropdown, ou après toute action (navigation, déconnexion). Sur mobile, fermer le sidebar après une navigation.

---

## 4. Profils différenciés par acteur

### 4.1 Citoyen (niveau 0–1)

**Layout** : `CitizenLayout`. Routes : `/citizen/profile`, `/citizen/settings`, `/citizen/security`.

**Sections du profil** :
- **Identité** : nom, prénom, email (lecture seule après vérification), téléphone, date de naissance — éditables.
- **Adresse** : adresse, ville, région, pays — éditables.
- **Préférences** :
  - Recevoir les **notifications** (on/off).
  - **Géolocalisation** pour recevoir les alertes dans ma zone (on/off).
  - **Rayon** pour recevoir les alertes (km) — **pertinent** : il est destinataire des alertes.
  - Langue.
- **Contribution** (lecture seule) : nombre de signalements, score de fiabilité, lien "Historique de mes signalements".
- **Sécurité** : membre depuis, dernière connexion, bouton "Changer le mot de passe" → `/citizen/security`.

**Spécificités** :
- Niveau 0 : bouton "Vérifier mon identité" (upload document + selfie) pour passage niveau 1.
- Niveau 1 : badge "Vérifié" visible.
- **Pas** de numéro de badge ni d’organisation (champs autorité).

---

### 4.2 Opérateur de saisie (niveau 2)

**Layout** : `OperatorLayout`. Routes : `/operator/profile`, `/operator/settings`, `/operator/security`.

**Sections** :
- **Identité** + **Adresse** : comme Authority (champs personnels éditables).
- **Organisation** (lecture seule) : nom, type, contact — **pas éditable** (défini à la création du compte).
- **Préférences** : notifications métier + langue **uniquement** (pas de rayon ni géoloc).
- **Sécurité** : badge (lecture seule), membre depuis, dernière connexion, "Changer le mot de passe".

**Actions spécifiques** : lien optionnel "Dossiers que j’ai créés" (filtre par `id_utilisateur_createur`).

---

### 4.3 Modérateur (niveau 3)

Même structure que Opérateur : identité, adresse, organisation (lecture seule), préférences (notifications + langue), sécurité. Optionnel : indicateurs "Signalements modérés" / "Photos approuvées" si les métriques existent.

---

### 4.4 Officier police / Agent gendarmerie (niveau 4 — Authority)

**Layout** : `AuthorityLayout`. Routes : `/authority/profile`, `/authority/settings`, `/authority/security`.

**Sections** :
- **Carte profil** : avatar (upload), nom, email, statut compte, **stats** (score fiabilité, signalements valides/invalides).
- **Identité** : nom, prénom, téléphone, date de naissance — éditables.
- **Adresse** : adresse, ville, région, pays — éditables.
- **Organisation** (lecture seule) : nom, type, région, ville, contact, email — affichée si `id_organisation` renseigné.
- **Préférences** :
  - **Notifications métier** (on/off) : "Recevoir les notifications (mises à jour dossiers, correspondances IA, coordination)".
  - **Langue** (liste : FR / EN).
  - **Pas** de rayon d’alertes ni de géoloc "pour recevoir les alertes".
- **Sécurité** : numéro de badge (lecture seule), membre depuis, dernière connexion, "Changer le mot de passe".

**Justification** : les autorités **créent et diffusent** les alertes ; elles ne sont pas "abonnées" à un périmètre. Les notifications qu’elles reçoivent sont métier (IA, dossiers, coordination), pas des alertes géolocalisées citoyennes.

---

### 4.5 Responsable ONG (niveau 5 — NGO)

Même logique qu’Authority : identité, adresse, **organisation** (lecture seule), **préférences = notifications métier + langue** (pas de rayon ni géoloc), sécurité. Libellés et contexte "ONG" (ex. rôle affiché "ONG").

---

### 4.6 Admin organisation (niveau 6)

Comme Authority/NGO, avec en plus :
- **Section "Mon organisation"** : lien "Paramètres de l’organisation" vers la config org.
- **Action** : "Gérer les utilisateurs" (liste des utilisateurs de l’organisation, rôles, activation).

---

### 4.7 Super Admin (niveau 7)

Profil personnel (identité, adresse, préférences, sécurité). Organisation "Système" ou N/A. **Action** : "Administration système" (utilisateurs, organisations, paramètres globaux, logs).

---

## 5. Matrice synthétique

| Acteur        | Organisation (affichage) | Badge / Accréditation | Préférences (profil)                    | Actions spécifiques (profil ou menu)     |
|---------------|---------------------------|------------------------|------------------------------------------|------------------------------------------|
| Citoyen 0–1   | Non                       | Non (sauf "Vérifié")   | Notifications + **Géoloc + Rayon** + Langue | "Vérifier mon identité" (niveau 0)       |
| Opérateur     | Lecture seule             | Lecture seule          | Notifications métier + Langue           | —                                        |
| Modérateur    | Lecture seule             | Lecture seule          | Notifications métier + Langue           | —                                        |
| Authority (4) | Lecture seule             | Lecture seule          | Notifications métier + Langue            | —                                        |
| NGO (5)       | Lecture seule             | Lecture seule          | Notifications métier + Langue            | —                                        |
| Admin org (6) | Lecture seule + lien config | Lecture seule       | Notifications métier + Langue            | Config org, Gérer les utilisateurs       |
| Super Admin (7) | N/A / Système          | Optionnel              | Notifications métier + Langue            | Administration système                    |

---

## 6. Implémentation actuelle (Authority & NGO)

- **Header** : clic avatar → navigation directe `/authority/profile` ou `/ngo/profile`.
- **Sidebar** : clic bloc profil → dropdown avec en-tête (avatar, nom, email), puis "Modifier le profil" (→ profile avec `state.edit`), "Paramètres", "Sécurité", "Déconnexion". "Modifier le profil" ouvre la page en mode édition.
- **Préférences Authority/NGO** : uniquement "Notifications métier" (description dédiée `descriptionForAuthority`) et "Langue" (select FR/EN). Pas de géoloc ni de rayon.
- **Organisation** : section "Mon organisation" (lecture seule) si `id_organisation` présent.

---

## 7. Références

- **Rôles et permissions** : `roles_permissions.txt` (Profil, Notifications, Alertes par niveau).
- **Inscription et flux** : `questions_reponses_inscription.txt` (qui reçoit les alertes, qui crée les comptes).
- **Modèle de données** : `documentation/modele_donnee.sql` (tables `utilisateur`, `organisation`, champs préférences).
