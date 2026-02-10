# JWT au gateway Supabase et vérification dans les Edge Functions

## Contexte

Supabase a introduit des **clés JWT asymétriques (ES256)** pour signer les tokens. Le **gateway** qui appelle les Edge Functions peut encore vérifier les JWT avec l’ancienne logique (clé symétrique / HS256). Résultat : avec un token valide (ES256), le gateway renvoie **« Invalid JWT »** et la requête n’atteint jamais la fonction.

Pour débloquer, on a donc **désactivé la vérification JWT au niveau du gateway** (`verify_jwt = false` dans `config.toml` ou dans le Dashboard) et on **vérifie le JWT dans le code** de chaque fonction avec la librairie **jose** et le **JWKS** du projet.

## Sécurité actuelle

- **Ce n’est pas « sans vérification JWT ».**  
  Les fonctions qui ont besoin d’un utilisateur connecté (admin-invite-user, admin-create-user, donations-create avec user) vérifient le token avec **jose + JWKS** (issuer, audience, signature). Seul le claim `sub` (user id) est utilisé après vérification.
- **Les autres fonctions** (donations-webhook, donations-mock-confirm, huggingface-proxy) n’utilisent pas le JWT utilisateur : elles s’appuient sur un secret (webhook, `confirmToken`) ou sur l’apikey seule (proxy). Les laisser en `verify_jwt = false` est cohérent.

Donc **réactiver le JWT au gateway n’est pas indispensable pour la sécurité** tant que le code continue à faire cette vérification (jose) là où c’est nécessaire.

## Réactiver la vérification JWT au gateway (optionnel)

Si Supabase met à jour le gateway pour accepter correctement les JWT ES256, vous pourrez réactiver la vérification côté gateway pour une **double vérification** (gateway + jose dans la fonction).

### Si vous déployez avec la CLI

1. Dans `supabase/config.toml`, passez à `verify_jwt = true` (ou supprimez la ligne) pour les fonctions concernées, par exemple :
   ```toml
   [functions.admin-invite-user]
   verify_jwt = true
   ```
2. Déployez : `supabase functions deploy admin-invite-user` (idem pour les autres).
3. Testez : si vous obtenez à nouveau **« Invalid JWT »**, le gateway ne gère pas encore correctement les tokens ES256 ; remettez `verify_jwt = false` et gardez la vérification actuelle dans le code.

### Si vous déployez via le Dashboard Supabase

1. Après chaque déploiement, ouvrez **Edge Functions** → la fonction → **Details** (ou **Paramètres**).
2. Activez **« Enforce JWT Verification »** si vous souhaitez que le gateway vérifie aussi le JWT.
3. Si les appels renvoient **« Invalid JWT »**, désactivez à nouveau cette option. La sécurité reste assurée par la vérification **jose** dans la fonction.

## Résumé

| Objectif                         | Action recommandée |
|----------------------------------|--------------------|
| Sécurité actuelle                | Conserver la vérification **jose + JWKS** dans le code ; `verify_jwt = false` au gateway est acceptable. |
| Tester une réactivation gateway  | Mettre `verify_jwt = true` (ou activer dans le Dashboard), redéployer, tester. En cas d’« Invalid JWT », revenir à `verify_jwt = false`. |
| Déploiement via Dashboard        | Penser à (dés)activer « Enforce JWT Verification » par fonction après chaque déploiement si vous changez ce réglage. |

En résumé : le problème vient du gateway qui ne gère pas encore correctement les JWT ES256. La solution en place (vérification dans la fonction avec jose) est sûre ; réactiver le JWT au gateway est optionnel et à tester selon l’évolution de Supabase.
