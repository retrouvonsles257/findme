# Déploiement de la Edge Function admin-invite-user

La fonction permet à l’admin d’organisation d’inviter des utilisateurs par email (avec rôle et organisation).  
Le code dans le repo est dans `functions/admin-invite-user/`. Sur Supabase, la fonction peut être déployée sous le nom **admin-invite-user** (CLI) ou créée manuellement sous un autre nom (ex. **hyper-responder**).  
**Le frontend doit appeler le nom exact de la fonction déployée** : si tu as créé la fonction sous le nom `hyper-responder` dans le dashboard, l’app utilise ce nom (voir `adminOrganisationAPI.ts`). Si tu redéploies avec la CLI sous le nom `admin-invite-user`, il faudra remettre `admin-invite-user` dans le code.

## Prérequis

1. **CLI Supabase** installé et connecté :
   ```bash
   npm install -g supabase
   supabase login
   ```

2. **Project ref** : celui de ton projet (ex. `yvzxebrudijuwygzpvnf`), visible dans l’URL du dashboard Supabase.

## Déploiement

À la racine du repo (ou depuis le dossier `supabase`) :

```bash
# Depuis la racine du projet
supabase functions deploy admin-invite-user --project-ref yvzxebrudijuwygzpvnf
```

Si tu es déjà dans `supabase/` :

```bash
cd supabase
supabase functions deploy admin-invite-user --project-ref yvzxebrudijuwygzpvnf
```

Remplace `yvzxebrudijuwygzpvnf` par ton **Project ref** si différent.

## Secrets

La fonction utilise :

- **SUPABASE_URL** et **SUPABASE_SERVICE_ROLE_KEY** : fournis automatiquement par Supabase, pas besoin de les définir.
- **SITE_URL** (optionnel) : URL de ton app (ex. `https://retrouvonsles.vercel.app`) pour le lien de redirection après acceptation de l’invitation. Si absent, un fallback est utilisé.

Pour définir l’URL du site (recommandé en production) :

```bash
supabase secrets set SITE_URL=https://ton-site.com --project-ref yvzxebrudijuwygzpvnf
```

## Vérification

Après déploiement, la fonction doit répondre à :

```
https://yvzxebrudijuwygzpvnf.supabase.co/functions/v1/admin-invite-user
```

Test rapide (remplace `ANON_KEY` par ta clé anon du projet) :

```bash
curl -X OPTIONS \
  "https://yvzxebrudijuwygzpvnf.supabase.co/functions/v1/admin-invite-user" \
  -H "Origin: http://localhost:3000"
```

Tu dois obtenir une réponse **204** (et non 404). Ensuite, l’invitation depuis l’écran admin doit fonctionner (avec un utilisateur connecté en admin d’organisation).

## Erreurs fréquentes

| Erreur | Cause | Solution |
|--------|--------|----------|
| **404** sur `/functions/v1/admin-invite-user` | Fonction non déployée | Déployer avec la commande ci-dessus |
| **CORS preflight did not succeed** | Souvent lié au 404 (le preflight renvoie 404) | Déployer la fonction |
| **401 Unauthorized** | JWT absent ou invalide | Vérifier que l’utilisateur est bien connecté (session Supabase) |
| **403 Forbidden** | Utilisateur pas admin de l’organisation | Vérifier `utilisateur_role` et `id_organisation` |
