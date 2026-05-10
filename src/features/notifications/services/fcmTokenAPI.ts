/**
 * Persistance des jetons FCM (Web Push) par utilisateur — Supabase.
 */
import { supabase } from '../../../config';
import {
  clearFcmTokenClientCache,
  deleteFCMToken,
  initializeFirebase,
} from '../../../config/firebase.config';

const LOG_FCM = '[PushFCM]';

function tokenHint(t: string): string {
  return t.length > 12 ? `${t.slice(0, 8)}…${t.slice(-4)}` : '(court)';
}

export async function upsertFcmToken(userId: string, token: string): Promise<void> {
  console.info(LOG_FCM, 'upsert_start', {
    reduxUserId: String(userId).slice(0, 8) + '…',
    tokenHint: tokenHint(token),
  });

  const { error: rpcErr } = await (supabase as any).rpc('register_fcm_token', { p_token: token });
  if (!rpcErr) {
    console.info(LOG_FCM, 'register_fcm_token_ok', { rpc: 'register_fcm_token' });
    return;
  }

  console.warn(LOG_FCM, 'register_fcm_token_rpc_fallback', {
    userId: String(userId).slice(0, 8) + '…',
    message: rpcErr.message,
    code: (rpcErr as any).code,
  });

  const { error: pruneErr } = await (supabase as any)
    .from('utilisateur_fcm_token')
    .delete()
    .eq('id_utilisateur', userId)
    .neq('token', token);
  if (pruneErr) {
    console.error(LOG_FCM, 'prune_old_tokens_fail', {
      userId: String(userId).slice(0, 8) + '…',
      message: pruneErr.message,
      code: (pruneErr as any).code,
    });
    throw pruneErr;
  }
  const { error } = await (supabase as any).from('utilisateur_fcm_token').upsert(
    {
      id_utilisateur: userId,
      token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) {
    console.error(LOG_FCM, 'table_upsert_fail', {
      userId: String(userId).slice(0, 8) + '…',
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
    });
    throw error;
  }

  // Même effet que la fin de `register_fcm_token` : sans ça, notification-fcm-send
  // ignore l’utilisateur si `accepte_notifications` était false / null (ex. RPC indisponible).
  const { error: prefErr } = await (supabase as any)
    .from('utilisateur')
    .update({ accepte_notifications: true, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (prefErr) {
    console.warn(LOG_FCM, 'fallback_pref_notif_update_skipped', {
      message: prefErr.message,
      code: (prefErr as any).code,
    });
  }

  console.info(LOG_FCM, 'table_upsert_ok', { userId: String(userId).slice(0, 8) + '…' });
}

export async function deleteAllFcmTokensForUser(userId: string): Promise<void> {
  const { error } = await (supabase as any).from('utilisateur_fcm_token').delete().eq('id_utilisateur', userId);
  if (error) throw error;
}

/**
 * Déconnexion / changement de compte : une souscription push = un jeton par navigateur ;
 * on retire ce navigateur de la BDD pour l’utilisateur courant, on révoque le jeton côté Firebase
 * et on vide le cache pour que le prochain `getToken` ré-enregistre le bon `auth.uid()`.
 */
export async function revokeFcmPushForLogout(userId: string): Promise<void> {
  try {
    await deleteAllFcmTokensForUser(userId);
  } catch (e) {
    console.warn(LOG_FCM, 'logout_delete_db_tokens', e);
  }
  try {
    const ok = await initializeFirebase();
    if (ok) {
      await deleteFCMToken();
    } else {
      clearFcmTokenClientCache();
    }
  } catch (e) {
    console.warn(LOG_FCM, 'logout_delete_browser_token', e);
    clearFcmTokenClientCache();
  }
}
