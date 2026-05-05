/**
 * Citoyen connecté : FCM + jeton, messages premier plan.
 * Aucun polling simulé ici : l'instantané doit venir du push FCM.
 */
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import { envConfig } from '../../../config';
import { supabase } from '../../../config/supabase.config';
import {
  initializeFirebase,
  getFCMToken,
  onForegroundMessage,
  showNotificationFromFcmPayload,
  areNotificationsSupported,
} from '../../../config/firebase.config';
import { fetchNotifications } from '../store/notificationSlice';
import { upsertFcmToken } from '../services/fcmTokenAPI';

export function useCitizenPushSync(userId: string | undefined, opts: { isGuest?: boolean } = {}): void {
  const dispatch = useDispatch<AppDispatch>();
  const { isGuest } = opts;

  useEffect(() => {
    if (!userId || isGuest) return;
    if (!envConfig.ENABLE_PUSH_NOTIFICATIONS || !envConfig.ENABLE_NOTIFICATIONS) return;
    if (!areNotificationsSupported()) return;

    console.info('[useCitizenPushSync] init', {
      userId: `${String(userId).slice(0, 8)}…`,
      pushEnabled: envConfig.ENABLE_PUSH_NOTIFICATIONS,
      notifEnabled: envConfig.ENABLE_NOTIFICATIONS,
    });

    let cancelled = false;
    let unsubForeground: (() => void) | null = null;

    (async () => {
      const ok = await initializeFirebase();
      if (!ok || cancelled) return;

      unsubForeground = onForegroundMessage((payload) => {
        showNotificationFromFcmPayload(payload);
        void dispatch(fetchNotifications(userId));
      });

      try {
        const token = await getFCMToken();
        if (cancelled) return;
        if (!token) {
          console.error(
            '[useCitizenPushSync] Aucun jeton FCM (permission refusée, VAPID manquant/incorrect, ou SW firebase-messaging-sw.js absent). Vérifie .env REACT_APP_FIREBASE_VAPID_KEY / REACT_APP_PUSH_VAPID_PUBLIC_KEY et npm start pour régénérer le SW.',
          );
          return;
        }
        console.info('[useCitizenPushSync] token_obtenu', { tokenHint: `${token.slice(0, 10)}…${token.slice(-6)}` });
        await upsertFcmToken(userId, token);
      } catch (e: any) {
        console.error(
          '[useCitizenPushSync] Échec enregistrement jeton FCM en base :',
          e?.message || e,
          e?.code ? `(code ${e.code})` : '',
          e?.details || e?.hint || '',
        );
      }
    })();

    return () => {
      cancelled = true;
      unsubForeground?.();
    };
  }, [userId, isGuest, dispatch]);

  // INSERT sur mes lignes `notification` → rafraîchissement immédiat (son / bannière via Redux + inAppAlertCue).
  useEffect(() => {
    if (!userId || isGuest) return;
    if (!envConfig.ENABLE_NOTIFICATIONS) return;

    let realtimeOk = false;
    const filter = `id_utilisateur=eq.${userId}`;
    const channel = supabase
      .channel(`citizen-notification-insert:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter,
        },
        (payload) => {
          console.info('[useCitizenPushSync] realtime INSERT reçu', {
            id: (payload as any)?.new?.id,
            type: (payload as any)?.new?.type_notification,
          });
          void dispatch(fetchNotifications(userId));
        },
      )
      .subscribe((status) => {
        console.info('[useCitizenPushSync] realtime_status', { status, userId: `${String(userId).slice(0, 8)}…` });
        if (status === 'SUBSCRIBED') {
          realtimeOk = true;
          console.info('[useCitizenPushSync] Realtime SUBSCRIBED (sync UI uniquement, sans son local).');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (realtimeOk) {
            console.warn('[useCitizenPushSync] Realtime perdu (pas de polling de secours activé).', status);
          } else {
            console.warn(
              '[useCitizenPushSync] Realtime indisponible — appliquer la migration ' +
                '20260507_realtime_publication_notification.sql (publication supabase_realtime + RLS SELECT) ' +
                'puis recharger.',
              status,
            );
          }
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, isGuest, dispatch]);

}
