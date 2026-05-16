# URLs de production — retrouvonsles.te-sea.com

Référence unique pour l’environnement prod.  
**URL de base :** `https://retrouvonsles.te-sea.com`

---

## Code & config (repo)

| Fichier | Rôle | Valeur prod |
|---------|------|-------------|
| `supabase/functions/notification-fcm-send/index.ts` | Fallback si `PUBLIC_APP_URL` absent | `https://retrouvonsles.te-sea.com` |
| `src/config/supabase.config.ts` | Fallback OAuth `/auth/callback` (SSR) | `https://retrouvonsles.te-sea.com/auth/callback` |
| `src/config/env.config.ts` | Fallback `REACT_APP_API_BASE_URL` | `https://retrouvonsles.te-sea.com` |
| `.env` | URL de base API (hébergeur / build front) | `REACT_APP_API_BASE_URL=https://retrouvonsles.te-sea.com` |
| `src/config/app.config.ts` | Site, CGU, confidentialité, CORS | `https://retrouvonsles.te-sea.com` (+ localhost en dev local) |
| `src/features/notifications/hooks/useNotificationSubscription.ts` | WebSocket (commenté) | Ex. `wss://retrouvonsles.te-sea.com` via `REACT_APP_WS_URL` |
| `supabase/DEPLOY_ADMIN_INVITE_FUNCTION.md` | Exemple curl CORS | `Origin: https://retrouvonsles.te-sea.com` |

---

## Supabase (dashboard — secrets & Auth)

| Emplacement | Variable / réglage | Valeur prod |
|-------------|----------------------|-------------|
| Edge Functions → **Secrets** → `PUBLIC_APP_URL` | Push FCM, e-mail vérif. SOS | `https://retrouvonsles.te-sea.com` |
| Edge Functions → **Secrets** → `SITE_URL` | Invitation admin (`admin-invite-user`) | `https://retrouvonsles.te-sea.com` |
| Authentication → **Site URL** | E-mails Auth (inscription, reset, magic link) | `https://retrouvonsles.te-sea.com` |
| Authentication → **Redirect URLs** | OAuth / callback | `https://retrouvonsles.te-sea.com/auth/callback` (+ autres chemins utilisés) |

```bash
supabase secrets set PUBLIC_APP_URL=https://retrouvonsles.te-sea.com
supabase secrets set SITE_URL=https://retrouvonsles.te-sea.com
```

---

## Chemins utiles (prod)

| Usage | URL |
|-------|-----|
| Accueil | `https://retrouvonsles.te-sea.com/` |
| Auth callback | `https://retrouvonsles.te-sea.com/auth/callback` |
| Signaler (invité) | `https://retrouvonsles.te-sea.com/signaler` |
| Contact (e-mail affiché) | `info@retrouvonsles.te-sea.com` |

---

## Notes

- **`window.location.origin`** : en prod, auth, partage dossier, SOS et dons utilisent automatiquement `https://retrouvonsles.te-sea.com` lorsque le front est servi sur ce domaine.
- **`src/config/firebase.config.ts`** : `localhost` sert uniquement à détecter un contexte sécurisé en dev (HTTPS ou localhost) — pas une URL de redirection.
- **Dev local** : conserver `http://localhost:3000` dans les Redirect URLs Supabase et dans `allowedOrigins` si vous développez encore en local ; la prod reste centrée sur `retrouvonsles.te-sea.com`.
