/**
 * Persistance des jetons FCM (Web Push) par utilisateur — Supabase.
 */
import { supabase } from '../../../config';
import {
  clearFcmTokenClientCache,
  deleteFCMToken,
  getFCMToken,
  getNativeWebPushVapidPublicKey,
  getStoredToken,
  initializeFirebase,
  registerMessagingServiceWorker,
  requestNotificationPermission,
} from '../../../config/firebase.config';

const LOG_FCM = '[PushFCM]';

/** true = logs détaillés ; les erreurs bloquantes passent toujours par console.warn */
const DEBUG_PUSH_LOGS = false;

function pushWarn(...args: unknown[]): void {
  console.warn(...args);
}
const FCM_DEVICE_ID_KEY = 'retrouvonsles_fcm_device_id_v1';
const LAST_PUSH_DIAGNOSTIC_KEY = 'retrouvonsles_last_push_diagnostic_v1';
const LAST_FCM_SYNC_KEY = 'retrouvonsles_last_fcm_sync_v1';
const FCM_SYNC_THROTTLE_MS = 10 * 60 * 1000;

function tokenHint(t: string): string {
  return t.length > 12 ? `${t.slice(0, 8)}…${t.slice(-4)}` : '(court)';
}

function pushDebug(level: 'info' | 'warn' | 'error', ...args: unknown[]): void {
  if (!DEBUG_PUSH_LOGS) return;
  console[level](...args);
}

function createFallbackId(): string {
  return `device-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export function getFcmDeviceId(): string {
  if (typeof window === 'undefined') return createFallbackId();
  try {
    const existing = window.localStorage.getItem(FCM_DEVICE_ID_KEY);
    if (existing) return existing;
    const next =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : createFallbackId();
    window.localStorage.setItem(FCM_DEVICE_ID_KEY, next);
    return next;
  } catch {
    return createFallbackId();
  }
}

function getNotificationPermissionForDb(): string {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function getClientPlatform(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  return navigator.platform || 'unknown';
}

function getClientUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

function base64UrlToUint8Array(value: string): Uint8Array {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function pushSubscriptionToPayload(subscription: PushSubscription): {
  endpoint: string;
  p256dh: string;
  auth: string;
} | null {
  const json = subscription.toJSON();
  const endpoint = json.endpoint || subscription.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) return null;
  return { endpoint, p256dh, auth };
}

async function collectNativePushDiagnostics(
  swReg?: ServiceWorkerRegistration | null,
  applicationServerKey?: Uint8Array,
): Promise<Record<string, unknown>> {
  const diag: Record<string, unknown> = {
    href: typeof window !== 'undefined' ? window.location.href : null,
    protocol: typeof window !== 'undefined' ? window.location.protocol : null,
    host: typeof window !== 'undefined' ? window.location.host : null,
    isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : null,
    notificationPermission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
    hasServiceWorker: typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
    hasPushManager: typeof window !== 'undefined' && 'PushManager' in window,
    hasIndexedDb: typeof indexedDB !== 'undefined',
    userAgent: getClientUserAgent(),
    platform: getClientPlatform(),
    vendor: typeof navigator !== 'undefined' ? navigator.vendor : null,
    serviceWorkerController: typeof navigator !== 'undefined' ? navigator.serviceWorker?.controller?.scriptURL || null : null,
    activeScript: swReg?.active?.scriptURL || null,
    activeState: swReg?.active?.state || null,
    waitingScript: swReg?.waiting?.scriptURL || null,
    installingScript: swReg?.installing?.scriptURL || null,
    scope: swReg?.scope || null,
  };

  try {
    if (swReg?.pushManager) {
      const existing = await swReg.pushManager.getSubscription();
      diag.existingSubscription = existing
        ? {
            endpointHost: new URL(existing.endpoint).host,
            endpointPrefix: existing.endpoint.slice(0, 48),
          }
        : null;
    }
  } catch (e: any) {
    diag.existingSubscriptionError = e?.message || String(e);
  }

  try {
    if (swReg?.pushManager && applicationServerKey) {
      diag.permissionState = await swReg.pushManager.permissionState({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }
  } catch (e: any) {
    diag.permissionStateError = e?.message || String(e);
  }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      diag.registrations = regs.map((r) => ({
        scope: r.scope,
        active: r.active?.scriptURL || null,
        waiting: r.waiting?.scriptURL || null,
        installing: r.installing?.scriptURL || null,
      }));
    }
  } catch (e: any) {
    diag.registrationsError = e?.message || String(e);
  }

  return diag;
}

function logNativePushDiagnostics(label: string, diagnostics: Record<string, unknown>): void {
  if (!DEBUG_PUSH_LOGS) return;
  let json = '';
  try {
    json = JSON.stringify(diagnostics);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_PUSH_DIAGNOSTIC_KEY, json);
    }
  } catch {
    json = String(diagnostics);
  }
  pushDebug('info', LOG_FCM, label, json);
}

async function markPushServiceUnavailable(
  userId: string,
  error: { name?: string; message?: string },
  diagnostics: Record<string, unknown>,
): Promise<void> {
  try {
    const { data: row } = await (supabase as any)
      .from('utilisateur')
      .select('preferences_notification')
      .eq('id', userId)
      .maybeSingle();
    const prefs = ((row as any)?.preferences_notification || {}) as Record<string, unknown>;
    await (supabase as any)
      .from('utilisateur')
      .update({
        preferences_notification: {
          ...prefs,
          push_service_unavailable: true,
          push_service_last_error: {
            name: error.name || null,
            message: error.message || null,
            at: new Date().toISOString(),
            protocol: diagnostics.protocol || null,
            host: diagnostics.host || null,
            permissionState: diagnostics.permissionState || null,
            activeScript: diagnostics.activeScript || null,
            userAgent: diagnostics.userAgent || null,
          },
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
  } catch {
    // Diagnostic non bloquant : le realtime reste disponible quand l'app est ouverte.
  }
}

export async function ensureCurrentUserProfile(): Promise<void> {
  const { error } = await (supabase as any).rpc('ensure_current_user_profile');
  if (error) {
    pushDebug('warn', LOG_FCM, 'ensure_current_user_profile_skipped', {
      message: error.message,
      code: (error as any).code,
    });
  }
}

export type PushRegistrationResult = {
  ok: boolean;
  authUserId: string | null;
  fcmRegistered: boolean;
  webPushRegistered: boolean;
  reason?: string;
};

async function countPushEndpointsForUser(userId: string): Promise<{ fcm: number; webPush: number }> {
  const fcmRes = await (supabase as any)
    .from('utilisateur_fcm_token')
    .select('token', { count: 'exact', head: true })
    .eq('id_utilisateur', userId);

  let webPush = 0;
  const webRes = await (supabase as any)
    .from('utilisateur_web_push_subscription')
    .select('endpoint', { count: 'exact', head: true })
    .eq('id_utilisateur', userId);
  if (webRes.error?.code === '42P01') {
    webPush = 0;
  } else {
    webPush = webRes.count ?? 0;
  }

  return {
    fcm: fcmRes.count ?? 0,
    webPush,
  };
}

/**
 * Enregistre FCM (et repli Web Push) pour auth.uid() — à appeler après connexion,
 * activation des notifs dans les paramètres, ou si les logs Edge indiquent no_push_tokens.
 */
export async function syncPushRegistrationForCurrentUser(options?: {
  forceRefresh?: boolean;
  requestPermission?: boolean;
}): Promise<PushRegistrationResult> {
  const forceRefresh = options?.forceRefresh ?? false;
  const mayRequestPermission = options?.requestPermission ?? true;

  const { data: authData } = await supabase.auth.getUser();
  const authUserId = authData?.user?.id ?? null;
  if (!authUserId) {
    return { ok: false, authUserId: null, fcmRegistered: false, webPushRegistered: false, reason: 'not_authenticated' };
  }

  await ensureCurrentUserProfile();

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'default' && mayRequestPermission) {
      await requestNotificationPermission();
    }
    if (Notification.permission === 'granted') {
      await (supabase as any)
        .from('utilisateur')
        .update({ accepte_notifications: true, updated_at: new Date().toISOString() })
        .eq('id', authUserId);
    } else if (Notification.permission === 'denied') {
      pushWarn(LOG_FCM, 'sync_skip_browser_permission_denied');
      return {
        ok: false,
        authUserId,
        fcmRegistered: false,
        webPushRegistered: false,
        reason: 'permission_denied',
      };
    }
  }

  const firebaseOk = await initializeFirebase();
  if (!firebaseOk) {
    pushWarn(LOG_FCM, 'sync_skip_firebase_init_failed');
    return {
      ok: false,
      authUserId,
      fcmRegistered: false,
      webPushRegistered: false,
      reason: 'firebase_init_failed',
    };
  }

  let fcmRegistered = false;
  let webPushRegistered = false;

  const token = await getFCMToken(mayRequestPermission, forceRefresh);
  if (token) {
    try {
      let skipUpsert = false;
      if (!forceRefresh && typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(LAST_FCM_SYNC_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as { userId?: string; token?: string; at?: number };
            if (
              parsed.userId === authUserId &&
              parsed.token === token &&
              typeof parsed.at === 'number' &&
              Date.now() - parsed.at < FCM_SYNC_THROTTLE_MS
            ) {
              skipUpsert = true;
            }
          }
        } catch {
          /* ignore */
        }
      }
      if (!skipUpsert) {
        await upsertFcmToken(authUserId, token);
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(
              LAST_FCM_SYNC_KEY,
              JSON.stringify({ userId: authUserId, token, at: Date.now() }),
            );
          } catch {
            /* ignore */
          }
        }
        pushWarn(LOG_FCM, 'sync_fcm_token_registered', {
          userId: `${authUserId.slice(0, 8)}…`,
          tokenHint: tokenHint(token),
        });
      }
      await unregisterCurrentWebPushDevice(authUserId);
      fcmRegistered = true;
    } catch (e: unknown) {
      pushWarn(LOG_FCM, 'sync_fcm_upsert_failed', e);
    }
  } else {
    pushWarn(LOG_FCM, 'sync_no_fcm_token_trying_web_push', {
      permission: typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'n/a',
    });
    webPushRegistered = await registerNativeWebPushSubscription(authUserId);
    if (webPushRegistered) {
      pushWarn(LOG_FCM, 'sync_web_push_registered', { userId: `${authUserId.slice(0, 8)}…` });
    }
  }

  const counts = await countPushEndpointsForUser(authUserId);
  const ok = counts.fcm > 0 || counts.webPush > 0 || fcmRegistered || webPushRegistered;

  if (!ok) {
    pushWarn(LOG_FCM, 'sync_no_push_endpoints_in_db', {
      userId: `${authUserId.slice(0, 8)}…`,
      hint: 'Autoriser les notifications du site puis réessayer (Paramètres → notifications push).',
    });
    return {
      ok: false,
      authUserId,
      fcmRegistered,
      webPushRegistered,
      reason: 'no_push_tokens',
    };
  }

  return { ok: true, authUserId, fcmRegistered: counts.fcm > 0 || fcmRegistered, webPushRegistered: counts.webPush > 0 || webPushRegistered };
}

export async function registerNativeWebPushSubscription(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    pushDebug('warn', LOG_FCM, 'native_web_push_unsupported');
    return false;
  }
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    pushDebug('warn', LOG_FCM, 'native_web_push_skip_permission', {
      permission: 'Notification' in window ? Notification.permission : 'unsupported',
    });
    return false;
  }

  const publicKey = getNativeWebPushVapidPublicKey();
  if (!publicKey) {
    pushDebug('warn', LOG_FCM, 'native_web_push_missing_vapid_public_key');
    return false;
  }

  const deviceId = getFcmDeviceId();
  try {
    const swReg = await registerMessagingServiceWorker();
    if (!swReg) return false;
    const applicationServerKey = base64UrlToUint8Array(publicKey);
    const existing = await swReg.pushManager.getSubscription();
    const subscription =
      existing ||
      (await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      }));
    const payload = pushSubscriptionToPayload(subscription);
    if (!payload) {
      pushDebug('warn', LOG_FCM, 'native_web_push_invalid_subscription');
      return false;
    }

    const { error } = await (supabase as any).rpc('register_web_push_subscription', {
      p_endpoint: payload.endpoint,
      p_p256dh: payload.p256dh,
      p_auth: payload.auth,
      p_device_id: deviceId,
      p_permission: getNotificationPermissionForDb(),
      p_user_agent: getClientUserAgent(),
      p_platform: getClientPlatform(),
    });
    if (error) {
      pushDebug('warn', LOG_FCM, 'native_web_push_register_fail', {
        message: error.message,
        code: (error as any).code,
      });
      return false;
    }

    pushDebug('info', LOG_FCM, 'native_web_push_register_ok', {
      userId: String(userId).slice(0, 8) + '…',
      deviceId: `${deviceId.slice(0, 8)}…`,
    });
    return true;
  } catch (e: any) {
    const diagnostics = await collectNativePushDiagnostics(null);
    await markPushServiceUnavailable(
      userId,
      { name: e?.name, message: e?.message || String(e) },
      diagnostics,
    );
    pushDebug('warn', LOG_FCM, 'native_web_push_subscribe_fail', {
      message: e?.message || String(e),
      name: e?.name,
      diagnostics,
    });
    logNativePushDiagnostics('native_web_push_subscribe_fail_json', {
      errorName: e?.name,
      errorMessage: e?.message || String(e),
      ...diagnostics,
    });
    return false;
  }
}

export async function upsertFcmToken(userId: string, token: string): Promise<void> {
  const deviceId = getFcmDeviceId();
  pushDebug('info', LOG_FCM, 'upsert_start', {
    reduxUserId: String(userId).slice(0, 8) + '…',
    deviceId: `${deviceId.slice(0, 8)}…`,
    tokenHint: tokenHint(token),
  });

  const { error: rpcErr } = await (supabase as any).rpc('register_fcm_token', {
    p_token: token,
    p_device_id: deviceId,
    p_permission: getNotificationPermissionForDb(),
    p_user_agent: getClientUserAgent(),
    p_platform: getClientPlatform(),
  });
  if (!rpcErr) {
    pushDebug('info', LOG_FCM, 'register_fcm_token_ok', {
      rpc: 'register_fcm_token',
      deviceId: `${deviceId.slice(0, 8)}…`,
    });
    return;
  }

  pushDebug('warn', LOG_FCM, 'register_fcm_token_rpc_fallback', {
    userId: String(userId).slice(0, 8) + '…',
    message: rpcErr.message,
    code: (rpcErr as any).code,
  });

  const { error: pruneErr } = await (supabase as any).from('utilisateur_fcm_token').delete().eq('token', token);
  if (pruneErr) {
    pushDebug('error', LOG_FCM, 'prune_old_tokens_fail', {
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
      device_id: deviceId,
      permission: getNotificationPermissionForDb(),
      user_agent: getClientUserAgent(),
      platform: getClientPlatform(),
      last_seen_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id_utilisateur,device_id' },
  );
  if (error) {
    pushDebug('error', LOG_FCM, 'table_upsert_fail', {
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
    pushDebug('warn', LOG_FCM, 'fallback_pref_notif_update_skipped', {
      message: prefErr.message,
      code: (prefErr as any).code,
    });
  }

  pushDebug('info', LOG_FCM, 'table_upsert_ok', {
    userId: String(userId).slice(0, 8) + '…',
    deviceId: `${deviceId.slice(0, 8)}…`,
  });
}

async function getNativeWebPushEndpoint(): Promise<string | null> {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    const swReg = await navigator.serviceWorker.getRegistration('/');
    const sub = await swReg?.pushManager.getSubscription();
    return sub?.endpoint || null;
  } catch {
    return null;
  }
}

export async function unregisterCurrentWebPushDevice(userId: string, endpoint?: string | null): Promise<void> {
  const deviceId = getFcmDeviceId();
  const endpointValue = endpoint ?? (await getNativeWebPushEndpoint());
  const { error } = await (supabase as any).rpc('unregister_current_web_push_device', {
    p_device_id: deviceId,
    p_endpoint: endpointValue || null,
  });
  if (error) {
    pushDebug('warn', LOG_FCM, 'native_web_push_unregister_fail', {
      userId: String(userId).slice(0, 8) + '…',
      message: error.message,
      code: (error as any).code,
    });
  }
}

export async function unregisterWebPushEndpointValue(endpoint: string | null | undefined): Promise<void> {
  if (!endpoint) return;
  const { error } = await (supabase as any).rpc('unregister_web_push_endpoint_value', { p_endpoint: endpoint });
  if (error) {
    pushDebug('warn', LOG_FCM, 'native_web_push_unregister_endpoint_fail', {
      message: error.message,
      code: (error as any).code,
    });
  }
}

export async function unsubscribeNativeWebPushBrowserSubscription(): Promise<void> {
  try {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const swReg = await navigator.serviceWorker.getRegistration('/');
    const sub = await swReg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    // Non bloquant : la ligne BDD est deja retiree via RPC.
  }
}

export async function deleteAllFcmTokensForUser(userId: string): Promise<void> {
  const { error } = await (supabase as any).from('utilisateur_fcm_token').delete().eq('id_utilisateur', userId);
  if (error) throw error;
}

export async function unregisterCurrentFcmDevice(userId: string, token?: string | null): Promise<void> {
  const deviceId = getFcmDeviceId();
  const { error: rpcErr } = await (supabase as any).rpc('unregister_current_fcm_device', {
    p_device_id: deviceId,
    p_token: token || null,
  });
  if (!rpcErr) {
    pushDebug('info', LOG_FCM, 'unregister_current_device_ok', {
      userId: String(userId).slice(0, 8) + '…',
      deviceId: `${deviceId.slice(0, 8)}…`,
    });
    return;
  }

  pushDebug('warn', LOG_FCM, 'unregister_current_device_rpc_fallback', {
    userId: String(userId).slice(0, 8) + '…',
    deviceId: `${deviceId.slice(0, 8)}…`,
    message: rpcErr.message,
    code: (rpcErr as any).code,
  });

  let query = (supabase as any).from('utilisateur_fcm_token').delete().eq('id_utilisateur', userId);
  if (token) {
    query = query.eq('token', token);
  } else {
    query = query.eq('device_id', deviceId);
  }
  const { error } = await query;
  if (error) throw error;
}

export async function unregisterFcmTokenValue(token: string | null | undefined): Promise<void> {
  if (!token) return;
  const { error } = await (supabase as any).rpc('unregister_fcm_token_value', { p_token: token });
  if (error) {
    pushDebug('warn', LOG_FCM, 'unregister_token_value_skipped', {
      tokenHint: tokenHint(token),
      message: error.message,
      code: (error as any).code,
    });
  }
}

export async function rotateFcmPushForAccountSwitch(previousUserId: string, nextUserId: string): Promise<void> {
  const token = getStoredToken();
  const nativeEndpoint = await getNativeWebPushEndpoint();
  pushDebug('info', LOG_FCM, 'account_switch_rotate_start', {
    previousUserId: `${previousUserId.slice(0, 8)}…`,
    nextUserId: `${nextUserId.slice(0, 8)}…`,
    tokenHint: token ? tokenHint(token) : null,
  });

  try {
    await unregisterFcmTokenValue(token);
    await unregisterWebPushEndpointValue(nativeEndpoint);
  } catch (e) {
    pushDebug('warn', LOG_FCM, 'account_switch_unregister_old_token', e);
  }

  try {
    const ok = await initializeFirebase();
    if (ok) {
      await deleteFCMToken();
    } else {
      clearFcmTokenClientCache();
    }
    await unsubscribeNativeWebPushBrowserSubscription();
  } catch (e) {
    pushDebug('warn', LOG_FCM, 'account_switch_delete_browser_token', e);
    clearFcmTokenClientCache();
  }
}

/**
 * Déconnexion / changement de compte : une souscription push = un jeton par navigateur ;
 * on retire seulement ce navigateur de la BDD pour l’utilisateur courant, on révoque le jeton côté Firebase
 * et on vide le cache pour que le prochain `getToken` ré-enregistre le bon `auth.uid()`.
 */
export async function revokeFcmPushForLogout(userId: string): Promise<void> {
  const token = getStoredToken();
  const nativeEndpoint = await getNativeWebPushEndpoint();
  try {
    await unregisterCurrentFcmDevice(userId, token);
    await unregisterCurrentWebPushDevice(userId, nativeEndpoint);
  } catch (e) {
    pushDebug('warn', LOG_FCM, 'logout_delete_current_device_token', e);
  }
  try {
    const ok = await initializeFirebase();
    if (ok) {
      await deleteFCMToken();
    } else {
      clearFcmTokenClientCache();
    }
    await unsubscribeNativeWebPushBrowserSubscription();
  } catch (e) {
    pushDebug('warn', LOG_FCM, 'logout_delete_browser_token', e);
    clearFcmTokenClientCache();
  }
}
