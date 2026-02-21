# Analyse – Badge « messages de coordination » (non lus)

## Comportement attendu
Le badge dans le header doit afficher le **nombre de messages non lus** envoyés par les **autres** utilisateurs (pas par l’utilisateur connecté), et ce nombre doit diminuer quand l’utilisateur ouvre le dropdown ou consulte la page Coordination.

## Chaîne de données

1. **Messages** : `useCoordinationMessages()` charge les commentaires `type_commentaire = 'coordination'`, mappe `author_id = id_utilisateur` (UUID).
2. **Utilisateur connecté** :
   - **Hook / contexte** : `useAuth().user` (Supabase Auth) → `user.id` (UUID).
   - **Header** : `selectCurrentUser` (Redux) → `currentUser.id`.
3. **Non lus** : `unreadCount = messages` où `author_id !== user?.id` **et** `!readCommentIds.has(m.id)`.
4. **Marquer comme lu** : à l’ouverture du dropdown / onglet messages, on appelle `markAsRead(ids)` avec les ids des messages « des autres ».

## Bugs identifiés

### Bug 1 – User non chargé (auth en cours)
- **Où** : `useCoordinationMessages`, calcul de `unreadCount`.
- **Quand** : Au premier rendu ou tant que `useAuth().user` est encore `null` (loading).
- **Effet** : `user?.id` est `undefined`, donc `m.author_id !== user?.id` est équivalent à `m.author_id !== undefined`. Tous les messages avec un `author_id` sont alors considérés comme « des autres » et non lus → le badge affiche le **total** des messages des autres au lieu du nombre réel de non lus.
- **Correctif** : Si `!user?.id`, retourner `unreadCount = 0` (ne pas afficher de comptage tant que l’utilisateur n’est pas connu).

### Bug 2 – Deux sources d’id (Auth vs Redux)
- **Où** : Header, filtre « messages des autres » pour `markAsRead`.
- **Quoi** : Le header utilise `currentUser?.id` (Redux) pour construire la liste des messages « des autres », alors que le hook calcule `unreadCount` avec `user?.id` (useAuth). Si Redux n’est pas encore rempli ou si l’id stocké (ex. table `utilisateur`) n’est pas strictement le même que `auth.uid()`, les messages marqués comme lus ne correspondent pas à ceux pris en compte dans le décompte.
- **Correctif** : Utiliser la **même** source que le hook : `useAuth().user?.id` dans le header pour le filtre « des autres » (au lieu de `currentUser?.id`).

### Bug 3 – Comparaison d’ids (robustesse)
- **Risque** : `author_id` (Supabase) et `user.id` (Auth) peuvent être string vs null/undefined, ou formats légèrement différents. Une comparaison stricte `!==` peut donner des résultats incohérents.
- **Correctif** : Normaliser en `String(...)` pour la comparaison et ne compter que si `user?.id` est défini.

## Fichiers modifiés
- `useCoordinationMessages.ts` : `unreadCount` à 0 si `!user?.id`, comparaison d’ids en string.
- `AuthorityHeader.tsx` : utiliser `useAuth().user?.id` pour le filtre « des autres » (et pour la condition d’appel à `markAsRead`).
