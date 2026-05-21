# Push FCM — chaîne complète

Les lignes `notification` sont bien créées (`insert_notification_ok` dans les logs), mais **le push navigateur** part uniquement si l’Edge Function `notification-fcm-send` est appelée après chaque INSERT.

## Option A — Webhook Supabase (recommandé)

1. Déployer la fonction : `supabase functions deploy notification-fcm-send --no-verify-jwt`
2. Secrets Edge : `FIREBASE_SERVICE_ACCOUNT`, `NOTIFICATION_FCM_SECRET`, `PUBLIC_APP_URL`
3. Dashboard → **Database** → **Webhooks** → Create hook :
   - Table : `public.notification`
   - Events : **Insert**
   - URL : `https://yvzxebrudijuwygzpvnf.supabase.co/functions/v1/notification-fcm-send`
   - Header : `x-notification-fcm-secret: <NOTIFICATION_FCM_SECRET>`

## Option B — Trigger SQL (migration `20260525`)

Après `supabase db push`, insérer dans `configuration_systeme` une ligne `categorie = 'notifications'` :

```json
{
  "notification_fcm_dispatch_url": "https://yvzxebrudijuwygzpvnf.supabase.co/functions/v1/notification-fcm-send",
  "notification_fcm_dispatch_secret": "<même secret que NOTIFICATION_FCM_SECRET>"
}
```

## Côté citoyen (token)

- Autoriser les notifications dans le navigateur
- Vérifier `utilisateur.accepte_notifications = true`
- Vérifier une ligne dans `utilisateur_fcm_token` pour l’`id_utilisateur` citoyen
- Logs Edge : `no_push_tokens` = token non enregistré

## SOS « marquer traité » (400)

La migration `20260525` corrige le trigger qui utilisait `priorite = 'normale'` (valeur **invalide** pour l’enum `priorite_traitement`). L’UPDATE SOS échouait donc en 400 avec seulement un bip d’erreur côté UI.
