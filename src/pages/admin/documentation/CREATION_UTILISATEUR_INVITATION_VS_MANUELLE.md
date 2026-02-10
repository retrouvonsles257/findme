# Création d’utilisateurs : invitation seule vs création manuelle

## Contexte actuel

- **Admin organisation** : une seule option, **invitation par email** (page « Inviter un utilisateur »).
- Flux : formulaire (email + rôle) → Edge Function `admin-invite-user` → `auth.admin.inviteUserByEmail` → email avec lien → l’invité définit son mot de passe.
- **Super admin** : création manuelle (insertion directe dans `utilisateur` + `utilisateur_role`), sans création de compte Auth dans l’UI actuelle.

---

## Pourquoi “invitation seule” est souvent le choix initial

| Raison | Explication |
|--------|-------------|
| **Sécurité** | L’admin ne choisit jamais le mot de passe → pas de fuite possible, pas de mot de passe partagé. |
| **Preuve d’email** | L’invité doit cliquer sur le lien → on vérifie qu’il a accès à la boîte. |
| **Conformité / audit** | “Invitation envoyée à X” est un événement clair ; “compte créé avec mot de passe défini par l’admin” est plus sensible. |
| **Bonnes pratiques** | L’utilisateur définit son propre mot de passe (OWASP, RGPD-friendly). |
| **Simplicité** | Un seul flux à maintenir et à sécuriser. |

Donc : **invitation seule, c’est cohérent et “pro” d’un point de vue sécurité et conformité.**

---

## Pourquoi une seule option pose problème en conditions réelles

1. **Emails qui ne partent pas**  
   SMTP en erreur, rate limit, email en spam, domaine bloqué → l’invité ne reçoit rien. Sans alternative, l’admin est bloqué.

2. **Pas de fallback**  
   Si l’invitation échoue (compte déjà existant, erreur Supabase, etc.), il n’y a pas d’autre moyen d’ajouter la personne depuis l’interface.

3. **Cas métier particuliers**  
   - Onboarding sur place : on veut créer le compte et faire se connecter tout de suite avec un mot de passe temporaire.  
   - Personne sans email perso fiable (ex. compte partagé, processus interne).  
   - Environnements de test / démo où on ne veut pas dépendre des emails.

4. **Image “pro”**  
   Dans beaucoup d’outils (Google Workspace, GitHub, Notion, etc.), on a à la fois “Inviter” et “Ajouter / Créer un utilisateur” (avec mot de passe temporaire ou lien). Une seule option peut donner l’impression d’un produit incomplet ou rigide.

---

## Recommandations (approche “pro” et robuste)

### 1. Garder l’invitation comme option principale (recommandé)

- Rester sur **invitation par email** comme flux par défaut : plus sûr et aligné avec les bonnes pratiques.
- Améliorer ce flux avant d’ajouter la création manuelle :
  - L’appel front appelle bien l’Edge Function `admin-invite-user` (nom aligné avec le dossier de la fonction).
  - Gérer les erreurs explicites (email déjà invité / déjà inscrit, rate limit, etc.) avec des messages clairs dans l’UI.
  - Optionnel : lien “Renvoyer l’invitation” sur les utilisateurs “en attente” pour limiter la frustration.

### 2. Ajouter une “création manuelle” en mode fallback

- **Objectif** : permettre d’ajouter un utilisateur quand l’invitation ne convient pas ou ne marche pas.
- **Comportement suggéré** :
  - Formulaire : email, rôle, **mot de passe temporaire** (optionnel si vous prévoyez “réinitialiser le mot de passe” juste après).
  - Côté backend : une **nouvelle Edge Function** (ex. `admin-create-user`) qui :
    - Vérifie que l’appelant est bien admin de l’organisation (comme pour l’invitation).
    - Utilise `auth.admin.createUser({ email, password, email_confirm: true })` (ou équivalent) pour créer le compte Auth.
    - Renseigne `user_metadata` / `app_metadata` (organisation_id, role, etc.) comme pour l’invitation.
    - Crée ou met à jour la ligne dans `utilisateur` (et `utilisateur_role`) pour garder la cohérence avec le reste de l’app.
  - **Sécurité** :
    - Mot de passe temporaire : longueur minimale, affiché une seule fois (ou “envoyer par un canal sécurisé”).
    - Forcer le changement du mot de passe à la première connexion (Supabase le permet).
    - Optionnel : exiger une raison / commentaire (audit) quand on utilise “Création manuelle”.

### 3. Exposer les deux options clairement dans l’UI

- **Liste utilisateurs** : un seul bouton **“Ajouter un utilisateur”** qui ouvre un **choix** :
  - **“Inviter par email”** (par défaut) → formulaire actuel (email + rôle) → envoi d’invitation.
  - **“Créer un compte manuellement”** → formulaire email + rôle + mot de passe temporaire (+ option “forcer changement à la 1re connexion”) → appel à `admin-create-user`.
- Texte d’aide du type :  
  *“Préférez l’invitation par email. Utilisez la création manuelle si l’email ne convient pas ou en cas de problème d’envoi.”*

Cela donne :
- Un flux principal sécurisé (invitation).
- Un filet de secours opérationnel (création manuelle).
- Une UX proche des produits grand public.

### 4. Cohérence avec le super admin

- Aujourd’hui le super admin crée des lignes dans `utilisateur` sans toujours créer un compte Auth. Pour éviter des comptes “fantômes” (profil sans login) :
  - Soit le super admin appelle aussi une logique type “création Auth + utilisateur” (Edge Function avec service_role).
  - Soit on documente clairement que les comptes créés par le super admin sont “à activer” par invitation ou par une autre procédure.

---

## Résumé

| Question | Réponse courte |
|----------|----------------|
| Pourquoi seulement l’invitation aujourd’hui ? | Sécurité, validation d’email, conformité, simplicité. C’est un choix défendable. |
| Est-ce “plus pro” d’avoir les deux ? | Oui : invitation = flux principal ; création manuelle = fallback quand l’invitation ne marche pas ou ne convient pas. |
| Que faire en priorité ? | 1) Corriger / aligner le nom de l’Edge Function d’invitation. 2) Ajouter une Edge Function `admin-create-user` (création Auth + profil). 3) Proposer dans l’UI “Inviter par email” + “Créer un compte manuellement” sous un même point d’entrée “Ajouter un utilisateur”. |

En résumé : **garder l’invitation comme option principale**, **ajouter la création manuelle comme option de secours**, et **présenter les deux clairement** dans l’interface. C’est à la fois pro, robuste et aligné avec les attentes des utilisateurs et la sécurité.
