# Push FCM — chaîne complète (prod)

Les lignes `notification` sont créées côté app (`insert_notification_ok`), mais **le push** ne part que si l’Edge Function `notification-fcm-send` est invoquée après chaque INSERT.

## 1. Déployer l’Edge Function

```bash
supabase functions deploy notification-fcm-send --no-verify-jwt
```

Secrets (Dashboard → Edge Functions → `notification-fcm-send`) :

| Secret | Rôle |
|--------|------|
| `FIREBASE_SERVICE_ACCOUNT` | JSON compte de service Firebase |
| `NOTIFICATION_FCM_SECRET` | Optionnel si webhook utilise la service role (voir ci‑dessous) |
| `PUBLIC_APP_URL` | `https://retrouvonsles.te-sea.com` |
| `SUPABASE_SERVICE_ROLE_KEY` | Injecté automatiquement par Supabase |

L’auth accepte **soit** `x-notification-fcm-secret`, **soit** les en-têtes par défaut du Database Webhook (`Authorization` + `apikey` = service role).

## 2. Webhook Supabase (recommandé prod)

Dashboard → **Database** → **Webhooks** → Create hook :

- **Table** : `public.notification`
- **Events** : Insert
- **URL** : `https://yvzxebrudijuwygzpvnf.supabase.co/functions/v1/notification-fcm-send`
- **HTTP Headers** : laisser les en-têtes par défaut Supabase (Bearer + apikey service role) **ou** ajouter `x-notification-fcm-secret: <NOTIFICATION_FCM_SECRET>`

Sans webhook ni config SQL (option B), les INSERT ne déclenchent **aucun** push.

## 3. Option B — Trigger SQL (`20260525`)

Après migration, une ligne `configuration_systeme` (`categorie = 'notifications'`) :

```json
{
  "notification_fcm_dispatch_url": "https://yvzxebrudijuwygzpvnf.supabase.co/functions/v1/notification-fcm-send",
  "notification_fcm_dispatch_secret": "<NOTIFICATION_FCM_SECRET>"
}
```

## 4. Migrations citoyen (alertes + notifs)

Appliquer en prod, dans l’ordre :

- `20260526_notifications_citizen_alerte_routing.sql`
- `20260527_citizen_alertes_rls_fcm_webhook.sql` — lecture alertes grand_public + RPC `list_citizen_alertes` / `get_citizen_alerte_by_id`

## 5. Côté client (token) — cause la plus fréquente en prod

Log Edge **`no_push_tokens`** avec `accepte_notifications: true` = la chaîne webhook/FCM fonctionne, mais **aucune ligne** dans `utilisateur_fcm_token` (ni Web Push) pour cet `id_utilisateur`.

Actions :

1. Se connecter avec le **compte citoyen** qui doit recevoir les alertes (pas seulement l’autorité).
2. Autoriser les notifications du site (`https://retrouvonsles.te-sea.com`).
3. **Paramètres citoyen** → « Réenregistrer » les notifications push (ou sauvegarder avec push activé).
4. Vérifier en SQL : `select * from utilisateur_fcm_token where id_utilisateur = '<uuid citoyen>';`
5. Console navigateur : messages `[PushFCM] sync_fcm_token_registered` ou `sync_no_push_endpoints_in_db`.

Un autre compte sur le même navigateur peut avoir un jeton (`fcm_ok` pour `9ed8e524…`) alors que le citoyen `dbf01bb3…` n’en a pas : chaque utilisateur doit enregistrer son propre jeton.

Autres logs Edge : `auth_fail` (webhook), `accepte_notifications_false`.

## 6. Clic alerte / notif

URL : `/citizen/alerts?alerte=<uuid>` — panneau détail + fetch RPC même si l’alerte n’est pas dans la grille.
