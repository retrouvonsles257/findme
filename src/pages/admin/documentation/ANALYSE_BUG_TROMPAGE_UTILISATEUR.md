# Analyse approfondie – Bug de tromperie d’utilisateur (Authority)

## Symptôme

Après déconnexion puis reconnexion en tant qu’authority (police/gendarme), l’interface affiche parfois :
- l’utilisateur **précédent** (A) au lieu du nouveau (B), ou  
- un **« pseudo » utilisateur** (nom par défaut, rôle incorrect).

## Cause racine : double source de vérité

L’espace Authority utilise **deux sources différentes** pour « l’utilisateur courant » :

| Zone | Source | D’où viennent les données |
|------|--------|----------------------------|
| **Sidebar** (AuthoritySidebar) | `useAuth().user` | **AuthProvider** → mis à jour par `onAuthStateChange` avec `session.user` (Supabase **auth.users** + **user_metadata**) |
| **Header** (AuthorityHeader) | `useAuth().user` | Idem |
| **Pages** (Dashboard, Alertes, Dossiers, etc.) | `selectCurrentUser` (Redux) | **loginThunk / restoreSessionThunk** → profil issu de **get_user_with_role** (table **utilisateur**) |

Conséquences :

1. **Redux** (auth + users) est mis à jour de façon fiable par le **login** et le **restore session** : on y met le profil retourné par `get_user_with_role` (table `utilisateur`), donc le bon utilisateur (B) avec nom, prénom, rôle à jour.

2. **AuthProvider** est mis à jour par **Supabase `onAuthStateChange`** avec `session.user`. Ce `user` :
   - a le bon `id` (B) après connexion ;
   - mais son **user_metadata** peut être **vide**, **ancien** ou **non synchronisé** avec la table `utilisateur` (car `user_metadata` est souvent rempli à l’inscription / par des triggers, pas rafraîchi à chaque connexion).

3. Le **sidebar et le header** affichent nom / initiales à partir de **user_metadata** :
   - `userMetadata?.prenom`, `userMetadata?.nom`, sinon fallback `user?.email` ou `'Utilisateur'`.
   - Si `user_metadata` est vide ou obsolète → affichage « pseudo » (ex. « Utilisateur ») ou ancien nom (A).

4. **Ordre des événements** : `onAuthStateChange` peut émettre plusieurs événements (ex. `INITIAL_SESSION` puis `SIGNED_IN`). Selon le timing, le contexte peut temporairement garder l’ancien utilisateur (A) ou un état partiel, alors que Redux a déjà le bon utilisateur (B).

En résumé : **même utilisateur connecté (B), mais sidebar/header lisent le contexte (Supabase user_metadata) et les pages lisent Redux (table utilisateur)**. Dès que le contexte est en retard ou mal rempli, on voit un mauvais ou pseudo utilisateur.

## Preuves dans le code

- **AuthoritySidebar.tsx** (l.82–88) : `user` et `userRole` viennent de `useAuth()` ; nom / prénom depuis `user?.user_metadata`.
- **AuthorityHeader.tsx** (l.70, 106) : `user` depuis `useAuth()` ; initiales depuis `user?.user_metadata`.
- **Pages authority** : toutes utilisent `selectCurrentUser` (Redux), cohérent avec login/restoreSession.

## Solution retenue : une seule source – Redux

Utiliser **Redux comme seule source** pour l’affichage de l’utilisateur courant dans tout le layout Authority :

- **AuthoritySidebar** : remplacer `useAuth().user` / `useAuth().userRole` par **selectCurrentUser** et **selectUserRole** (Redux). Afficher nom, prénom, email, photo à partir de `currentUser` (et éventuellement table `utilisateur` pour la photo, comme aujourd’hui).
- **AuthorityHeader** : idem, utiliser **selectCurrentUser** pour initiales et photo.

Ainsi, sidebar, header et pages affichent toujours le **même** utilisateur, celui mis en place par **loginThunk** et **restoreSessionThunk** (profil table `utilisateur`), sans dépendre à l’affichage du `user_metadata` Supabase.

---

## Extension : pages Profil

Le même bug a été corrigé sur les pages Profil : Authority et Admin utilisent **selectCurrentUser** au lieu de `useAuth().user` ; Super Admin utilise **selectUser** (Redux) au lieu de `supabase.auth.getUser()` dans `loadProfile`. Citizen utilisait déjà **selectUser** (Redux).
