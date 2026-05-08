/**
 * Persistance des jetons FCM (Web Push) par utilisateur — Supabase.
 */
import { supabase } from '../../../config';

const LOG_FCM = '[FCMToken]';

export async function upsertFcmToken(userId: string, token: string): Promise<void> {
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
    console.error(LOG_FCM, 'upsert_fail', {
      userId: String(userId).slice(0, 8) + '…',
      message: error.message,
      code: (error as any).code,
      details: (error as any).details,
    });
    throw error;
  }

}

export async function deleteAllFcmTokensForUser(userId: string): Promise<void> {
  const { error } = await (supabase as any).from('utilisateur_fcm_token').delete().eq('id_utilisateur', userId);
  if (error) throw error;
}
