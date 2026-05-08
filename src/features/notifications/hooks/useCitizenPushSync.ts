/**
 * Citoyen connecté : FCM + jeton, messages premier plan.
 * Aucun polling simulé ici : l'instantané doit venir du push FCM.
 */
import { useCallback, useEffect } from 'react';
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
  const CITIZEN_FCM_ROTATED_KEY = `citizen_fcm_rotated_v1:${userId || 'unknown'}`;
  const syncNotificationPreference = useCallback(async (enabled: boolean) => {
    if (!userId) return;
    try {
      await (supabase as any)
        .from('utilisateur')
        .update({ accepte_notifications: enabled, updated_at: new Date().toISOString() })
        .eq('id', userId);
    } catch {
      // non-bloquant
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || isGuest) return;
    if (!envConfig.ENABLE_PUSH_NOTIFICATIONS || !envConfig.ENABLE_NOTIFICATIONS) return;
    if (!areNotificationsSupported()) return;

    let cancelled = false;
    let unsubForeground: (() => void) | null = null;

    (async () => {
      // Même clé que CitizenLayout : une seule demande « navigateur », tous espaces (citoyen / autorité).
      const PERM_NOTIF_ASKED_KEY = 'citizen_perm_notif_asked_v1';
      if ('Notification' in window) {
        const notifAsked = localStorage.getItem(PERM_NOTIF_ASKED_KEY) === 'true';
        if (!notifAsked && Notification.permission === 'default') {
          localStorage.setItem(PERM_NOTIF_ASKED_KEY, 'true');
          try {
            await Notification.requestPermission();
          } catch {
            // noop
          }
        } else if (!notifAsked) {
          localStorage.setItem(PERM_NOTIF_ASKED_KEY, 'true');
        }
      }

      const ok = await initializeFirebase();
      if (!ok || cancelled) return;

      unsubForeground = onForegroundMessage((payload) => {
        showNotificationFromFcmPayload(payload);
        void dispatch(fetchNotifications(userId));
      });

      try {
        if (cancelled) return;
        if ('Notification' in window && Notification.permission !== 'default') {
          await syncNotificationPreference(Notification.permission === 'granted');
        }

        // Ne jamais forcer deleteToken au premier enregistrement : `!alreadyRotated` provoquait
        // forceRefresh=true → AbortError « push service error » sur Chrome/Edge.
        let token = await getFCMToken(false, false);
        if (cancelled) return;
        if (
          !token &&
          typeof window !== 'undefined' &&
          Notification.permission === 'granted'
        ) {
          token = await getFCMToken(false, true);
        }
        if (cancelled) return;
        if (!token) {
          console.error(
            '[useCitizenPushSync] Aucun jeton FCM (permission refusée ou échec d’enregistrement push).',
          );
          return;
        }

        await upsertFcmToken(userId, token);
        try {
          const { data: verifyRows } = await (supabase as any)
            .from('utilisateur_fcm_token')
            .select('token')
            .eq('id_utilisateur', userId)
            .eq('token', token)
            .limit(1);
          if ((verifyRows || []).length > 0 && typeof window !== 'undefined') {
            localStorage.setItem(CITIZEN_FCM_ROTATED_KEY, 'true');
          }
        } catch {
          // noop
        }
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
  }, [userId, isGuest, dispatch, syncNotificationPreference, CITIZEN_FCM_ROTATED_KEY]);

  // INSERT sur mes lignes `notification` → rafraîchissement immédiat (son / bannière via Redux + inAppAlertCue).
  useEffect(() => {
    if (!userId || isGuest) return;
    if (!envConfig.ENABLE_NOTIFICATIONS) return;

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
        () => {
          void dispatch(fetchNotifications(userId));
        },
      )
      .subscribe(() => {});

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, isGuest, dispatch]);

}
