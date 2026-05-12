/**
 * Compte connecté (citoyen, autorité, etc.) : FCM + jeton, messages premier plan.
 * Comportement aligné sur CitizenLayout pour le timing notif / push hors espace citoyen.
 */
import { useCallback, useEffect, useRef } from 'react';
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
import { TypeCompte } from '../../../@types/enums.types';
import { fetchNotifications } from '../store/notificationSlice';
import {
  ensureCurrentUserProfile,
  registerNativeWebPushSubscription,
  rotateFcmPushForAccountSwitch,
  unregisterCurrentWebPushDevice,
  upsertFcmToken,
} from '../services/fcmTokenAPI';
import {
  CITIZEN_PERM_NOTIF_ASKED_KEY,
  PUSH_NOTIFICATION_ONBOARDING_DELAY_MS,
} from '../constants/citizenPushOnboarding';

const LOG = '[PushFCM]';
const DEBUG_PUSH_LOGS = false;

function pushDebug(level: 'info' | 'warn' | 'error', ...args: unknown[]): void {
  if (!DEBUG_PUSH_LOGS) return;
  console[level](...args);
}

export type PushSyncLogContext = {
  type_compte?: string;
  role?: string;
  organisation_id?: string;
};

export function useCitizenPushSync(
  userId: string | undefined,
  opts: { isGuest?: boolean; logContext?: PushSyncLogContext } = {},
): void {
  const dispatch = useDispatch<AppDispatch>();
  /** false dès qu’il y a un id de session (y compris Supabase anonyme) ; pas lié à `is_anonymous`. */
  const { isGuest, logContext } = opts;
  const lastFcmPushUserIdRef = useRef<string | undefined>(undefined);
  const CITIZEN_FCM_ROTATED_KEY = `citizen_fcm_rotated_v1:${userId || 'unknown'}`;
  const syncNotificationPreference = useCallback(async (enabled: boolean) => {
    if (!userId) return;
    try {
      const { error } = await (supabase as any)
        .from('utilisateur')
        .update({ accepte_notifications: enabled, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (error) {
        pushDebug('warn', LOG, 'pref_utilisateur_update_skipped', {
          message: error.message,
          code: (error as any).code,
          enabled,
        });
      }
    } catch (e: unknown) {
      pushDebug('warn', LOG, 'pref_utilisateur_update_exception', e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || isGuest) {
      lastFcmPushUserIdRef.current = undefined;
      pushDebug('info', LOG, 'sync_skip', { reason: !userId ? 'no_userId' : 'isGuest', ...logContext });
      return;
    }
    if (!envConfig.ENABLE_PUSH_NOTIFICATIONS || !envConfig.ENABLE_NOTIFICATIONS) {
      pushDebug('warn', LOG, 'sync_skip', {
        reason: 'flags_disabled',
        ENABLE_PUSH_NOTIFICATIONS: envConfig.ENABLE_PUSH_NOTIFICATIONS,
        ENABLE_NOTIFICATIONS: envConfig.ENABLE_NOTIFICATIONS,
        ...logContext,
      });
      return;
    }
    if (!areNotificationsSupported()) {
      pushDebug('warn', LOG, 'sync_skip', { reason: 'notifications_not_supported', ...logContext });
      return;
    }

    let cancelled = false;
    let unsubForeground: (() => void) | null = null;

    (async () => {
      const prevUid = lastFcmPushUserIdRef.current;
      if (prevUid && prevUid !== userId) {
        pushDebug('info', LOG, 'account_switch_rotate_fcm_token', {
          prev: `${prevUid.slice(0, 8)}…`,
          next: `${userId.slice(0, 8)}…`,
          ...logContext,
        });
        await rotateFcmPushForAccountSwitch(prevUid, userId);
        if (cancelled) return;
      }
      lastFcmPushUserIdRef.current = userId;

      pushDebug('info', LOG, 'sync_start', {
        reduxUserId: `${userId.slice(0, 8)}…`,
        ...logContext,
      });

      await ensureCurrentUserProfile();
      if (cancelled) return;

      // Même délai que CitizenLayout avant la demande notif / push (autorité n’a pas ce layout).
      const typeCompte = logContext?.type_compte;
      const isGrandPublic =
        typeCompte == null || typeCompte === '' || typeCompte === TypeCompte.GRAND_PUBLIC;
      if (!isGrandPublic) {
        pushDebug('info', LOG, 'align_citizen_layout_delay_before_fcm', {
          ms: PUSH_NOTIFICATION_ONBOARDING_DELAY_MS,
          ...logContext,
        });
        await new Promise((r) => setTimeout(r, PUSH_NOTIFICATION_ONBOARDING_DELAY_MS));
        if (cancelled) return;
      }

      // On scope l'onboarding par utilisateur, même si la permission navigateur reste par domaine.
      if ('Notification' in window) {
        const notifAskedKey = `${CITIZEN_PERM_NOTIF_ASKED_KEY}:${userId}`;
        const legacyNotifAsked = localStorage.getItem(CITIZEN_PERM_NOTIF_ASKED_KEY) === 'true';
        const notifAsked = localStorage.getItem(notifAskedKey) === 'true';
        if (!notifAsked && Notification.permission === 'default') {
          let permission: NotificationPermission = 'default';
          try {
            permission = await Notification.requestPermission();
          } catch {
            permission = Notification.permission;
          }
          if (permission !== 'default') {
            localStorage.setItem(notifAskedKey, 'true');
          }
        } else if (!notifAsked || legacyNotifAsked) {
          localStorage.setItem(notifAskedKey, 'true');
        }
      }

      const perm =
        typeof window !== 'undefined' && 'Notification' in window
          ? Notification.permission
          : 'unsupported';
      pushDebug('info', LOG, 'after_perm_prompt', { permission: perm, ...logContext });

      const ok = await initializeFirebase();
      if (!ok) {
        pushDebug('error', LOG, 'firebase_init_fail', { ...logContext });
        return;
      }
      if (cancelled) return;
      pushDebug('info', LOG, 'firebase_init_ok', { ...logContext });

      unsubForeground = onForegroundMessage((payload) => {
        showNotificationFromFcmPayload(payload);
        void dispatch(fetchNotifications(userId));
      });

      try {
        if (cancelled) return;
        if ('Notification' in window && Notification.permission !== 'default') {
          await syncNotificationPreference(Notification.permission === 'granted');
        }

        // Ne pas enchaîner forceRefresh ici : deleteToken + getToken aggrave souvent
        // « AbortError: Registration failed - push service error » (Chrome/Edge).
        // La récupération SW est gérée dans getFCMToken (firebase.config).
        const token = await getFCMToken(false, false);
        if (cancelled) return;
        if (!token) {
          pushDebug('error', LOG, 'no_fcm_token', {
            permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'n/a',
            ...logContext,
          });
          const nativeOk = await registerNativeWebPushSubscription(userId);
          pushDebug('info', LOG, 'native_web_push_fallback_result', { ok: nativeOk, ...logContext });
          return;
        }

        const { data: authData } = await supabase.auth.getUser();
        const authUid = authData?.user?.id;
        pushDebug('info', LOG, 'auth_vs_redux', {
          match: authUid === userId,
          reduxUserId: `${userId.slice(0, 8)}…`,
          authUid: authUid ? `${authUid.slice(0, 8)}…` : null,
          ...logContext,
        });
        if (authUid && authUid !== userId) {
          pushDebug('warn', LOG, 'upsert_skip_auth_redux_mismatch', {
            reduxUserId: `${userId.slice(0, 8)}…`,
            authUid: `${authUid.slice(0, 8)}…`,
            ...logContext,
          });
          return;
        }

        await upsertFcmToken(userId, token);
        await unregisterCurrentWebPushDevice(userId);
        pushDebug('info', LOG, 'upsert_done', { ...logContext });
        try {
          const { data: rowByToken } = await (supabase as any)
            .from('utilisateur_fcm_token')
            .select('id_utilisateur')
            .eq('token', token)
            .maybeSingle();
          const storedUid = rowByToken?.id_utilisateur as string | undefined;
          const verifiedForRedux = storedUid === userId;
          pushDebug('info', LOG, 'db_verify_token_row', {
            storedUserId: storedUid ? `${String(storedUid).slice(0, 8)}…` : null,
            matchesRedux: verifiedForRedux,
            ...logContext,
          });
          if (storedUid && typeof window !== 'undefined') {
            localStorage.setItem(CITIZEN_FCM_ROTATED_KEY, 'true');
          }
        } catch {
          // noop
        }
      } catch (e: any) {
        pushDebug('error', LOG, 'upsert_chain_fail', {
          message: e?.message || String(e),
          code: e?.code,
          details: e?.details,
          hint: e?.hint,
          ...logContext,
        });
      }
    })();

    return () => {
      cancelled = true;
      unsubForeground?.();
    };
  }, [userId, isGuest, dispatch, syncNotificationPreference, CITIZEN_FCM_ROTATED_KEY, logContext]);

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
