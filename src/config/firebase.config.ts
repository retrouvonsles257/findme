/**
 * =====================================================
 * RETROUVONSLES - Configuration Firebase
 * Firebase Cloud Messaging (FCM) pour notifications push
 * =====================================================
 */

import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { 
  getMessaging, 
  getToken, 
  onMessage, 
  Messaging,
  MessagePayload,
  isSupported,
  deleteToken
} from 'firebase/messaging';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { envConfig } from './env.config';
import { APP_LOGO_SRC } from './branding';

// ============================================
// VARIABLES D'ENVIRONNEMENT
// ============================================

const firebaseConfig: FirebaseOptions = {
  apiKey: envConfig.REACT_APP_FIREBASE_API_KEY,
  authDomain: envConfig.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.REACT_APP_FIREBASE_APP_ID,
};

// Clé Web Push FCM (Firebase Console → Cloud Messaging) ou fallback .env PUSH_VAPID
const VAPID_KEY =
  (envConfig.REACT_APP_FIREBASE_VAPID_KEY || '').trim() ||
  (envConfig.REACT_APP_PUSH_VAPID_PUBLIC_KEY || '').trim();

export const getWebPushVapidPublicKey = (): string => VAPID_KEY;
export const getNativeWebPushVapidPublicKey = (): string =>
  (envConfig.REACT_APP_NATIVE_WEB_PUSH_VAPID_PUBLIC_KEY || '').trim() || VAPID_KEY;

// ============================================
// VALIDATION DE LA CONFIGURATION
// ============================================

const validateFirebaseConfig = (): boolean => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(
    field => !firebaseConfig[field as keyof FirebaseOptions]
  );

  if (missingFields.length > 0) {
    firebasePushDebug(
      'error',
      '[Firebase] Configuration incomplète. Champs manquants:',
      missingFields
    );
    return false;
  }

  if (!VAPID_KEY || VAPID_KEY.includes('your-vapid')) {
    firebasePushDebug('error', '[Firebase] VAPID Key manquante ou placeholder (REACT_APP_FIREBASE_VAPID_KEY / REACT_APP_PUSH_VAPID_PUBLIC_KEY)');
    return false;
  }

  return true;
};

// ============================================
// INITIALISATION FIREBASE
// ============================================

let firebaseApp: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let analytics: Analytics | null = null;
let isFirebaseInitialized = false;
let cachedFCMToken: string | null = null;
let tokenExpirationTime: number | null = null;

const TOKEN_STORAGE_KEY = 'retrouvonsles_fcm_token';
const TOKEN_EXPIRATION_DAYS = 60; // FCM tokens typically expire after ~60 days
const DEBUG_FIREBASE_PUSH_LOGS = false;

function firebasePushDebug(level: 'warn' | 'error', ...args: unknown[]): void {
  if (!DEBUG_FIREBASE_PUSH_LOGS) return;
  console[level](...args);
}

/**
 * Initialise Firebase App
 */
export const initializeFirebase = async (): Promise<boolean> => {
  if (isFirebaseInitialized) {

    return true;
  }

  try {
    // Valider la configuration
    if (!validateFirebaseConfig()) {
      firebasePushDebug('error', '[Firebase] Impossible d\'initialiser - configuration invalide');
      return false;
    }

    // Initialiser l'app Firebase
    firebaseApp = initializeApp(firebaseConfig);

    // Vérifier si les notifications sont supportées
    const messagingSupported = await isSupported();

    if (messagingSupported) {
      messaging = getMessaging(firebaseApp);
    }

    try {
      analytics = getAnalytics(firebaseApp);
    } catch {
      void 0;
    }

    isFirebaseInitialized = true;
    return true;
  } catch (error) {
    firebasePushDebug('error', '[Firebase] Erreur d\'initialisation:', error);
    return false;
  }
};

/**
 * Récupère l'instance Firebase App
 */
export const getFirebaseApp = (): FirebaseApp | null => {
  return firebaseApp;
};

/**
 * Récupère l'instance Messaging
 */
export const getFirebaseMessaging = (): Messaging | null => {
  return messaging;
};

/**
 * Récupère l'instance Analytics
 */
export const getFirebaseAnalytics = (): Analytics | null => {
  return analytics;
};

// ============================================
// GESTION DES NOTIFICATIONS PUSH
// ============================================

/**
 * Enregistre le service worker FCM (fichier généré dans public/).
 */
export const registerMessagingServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (error) {
    firebasePushDebug('error', '[Firebase] Échec enregistrement firebase-messaging-sw.js:', error);
    return null;
  }
};

function isPushRegistrationFailedError(e: unknown): boolean {
  const msg = `${e instanceof Error ? e.message : String(e)}`.toLowerCase();
  return (
    msg.includes('push service') ||
    msg.includes('registration failed') ||
    msg.includes('messaging/registration') ||
    (typeof DOMException !== 'undefined' &&
      e instanceof DOMException &&
      e.name === 'AbortError' &&
      msg.includes('registration'))
  );
}

function isFirebaseIndexedDbStoreError(e: unknown): boolean {
  const msg = `${e instanceof Error ? e.message : String(e)}`.toLowerCase();
  return (
    msg.includes('firebase-installations-store') ||
    msg.includes('firebase-messaging-store') ||
    (msg.includes('object store') && msg.includes('not a known object store')) ||
    (msg.includes('object store') && msg.includes('not found'))
  );
}

function deleteIndexedDbDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve();
      return;
    }

    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
      req.onblocked = () => {
        firebasePushDebug('warn', '[Firebase] Suppression IndexedDB bloquée:', name);
        resolve();
      };
    } catch {
      resolve();
    }
  });
}

async function resetFirebaseIndexedDbState(): Promise<void> {
  clearFcmTokenClientCache();
  await Promise.all([
    deleteIndexedDbDatabase('firebase-installations-database'),
    deleteIndexedDbDatabase('firebase-messaging-database'),
  ]);
  await new Promise((r) => setTimeout(r, 500));
}

/** Révoque l’ancien SW FCM + souscription pour repartir d’un état propre (erreur « push service » Chrome/Edge). */
async function resetFirebaseMessagingServiceWorker(m: Messaging): Promise<void> {
  try {
    await deleteToken(m);
  } catch (e) {
    if (isFirebaseIndexedDbStoreError(e)) {
      await resetFirebaseIndexedDbState();
    }
  }
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const urls = [
        reg.active?.scriptURL,
        reg.waiting?.scriptURL,
        reg.installing?.scriptURL,
      ].filter(Boolean) as string[];
      if (urls.some((u) => u.includes('firebase-messaging-sw'))) {
        await reg.unregister();
      }
    }
  } catch {
    /* noop */
  }
  await new Promise((r) => setTimeout(r, 1200));
}

/** Attend que le SW firebase-messaging soit actif (évite getToken avant subscription push). */
async function waitForFirebaseSwActive(reg: ServiceWorkerRegistration, timeoutMs: number): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const url = reg.active?.scriptURL || '';
    if (url.includes('firebase-messaging-sw')) {
      return;
    }
    await new Promise((r) => setTimeout(r, 120));
  }
  firebasePushDebug('warn', '[Firebase] firebase-messaging-sw.js pas encore actif après', timeoutMs, 'ms (tentative getToken quand même)');
}

/**
 * Demande la permission pour les notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!('Notification' in window)) {
      firebasePushDebug('error', '[Firebase] Les notifications ne sont pas supportées');
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {

      return true;
    } else if (permission === 'denied') {

      return false;
    } else {

      return false;
    }
  } catch (error) {
    firebasePushDebug('error', '[Firebase] Erreur demande permission:', error);
    return false;
  }
};

/**
 * Récupère le token FCM avec cache et gestion d'expiration
 */
export const getFCMToken = async (
  allowPermissionPrompt: boolean = true,
  forceRefresh: boolean = false,
): Promise<string | null> => {
  try {
    if (!messaging) {
      firebasePushDebug('error', '[Firebase] Messaging non initialisé');
      return null;
    }

    if (!VAPID_KEY) {
      firebasePushDebug('error', '[Firebase] VAPID Key manquante');
      return null;
    }

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1') {
        firebasePushDebug(
          'error',
          '[Firebase] Push FCM nécessite un contexte sécurisé (HTTPS ou localhost). Hôte actuel :',
          host,
        );
        return null;
      }
    }

    if (forceRefresh) {
      try {
        await deleteToken(messaging);
        // Laisser le navigateur révoquer l’ancienne souscription push avant d’en créer une nouvelle
        await new Promise((r) => setTimeout(r, 350));
      } catch (e) {
        if (isFirebaseIndexedDbStoreError(e)) {
          await resetFirebaseIndexedDbState();
        }
      }
      cachedFCMToken = null;
      tokenExpirationTime = null;
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch {
        // noop
      }
    }

    // Vérifier le cache et l'expiration
    if (!forceRefresh && cachedFCMToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {

      return cachedFCMToken;
    }

    // Vérifier la permission
    if (Notification.permission !== 'granted') {
      if (!allowPermissionPrompt) {
        return null;
      }
      const granted = await requestNotificationPermission();
      if (!granted) {
        return null;
      }
    }

    const applyToken = (token: string): string => {
      cachedFCMToken = token;
      tokenExpirationTime = Date.now() + (TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
      storeTokenSecurely(token);
      return token;
    };

    const tryGetTokenWithReg = async (
      swReg: ServiceWorkerRegistration,
    ): Promise<{ token: string | null; lastError: unknown }> => {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const token = await getToken(messaging!, {
            vapidKey: VAPID_KEY,
            serviceWorkerRegistration: swReg,
          });
          if (token) {
            return { token: applyToken(token), lastError: null };
          }
        } catch (e) {
          lastError = e;
          if (isFirebaseIndexedDbStoreError(e)) {
            firebasePushDebug('warn', '[Firebase] IndexedDB Firebase incohérent — reset ciblé avant nouvelle tentative');
            await resetFirebaseIndexedDbState();
          }
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          }
        }
      }
      return { token: null, lastError };
    };

    /** Fallback : laisser le SDK résoudre le SW (évite certains échecs « push service » si l’association explicite pose problème). */
    const tryGetTokenImplicitSw = async (): Promise<{ token: string | null; lastError: unknown }> => {
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const token = await getToken(messaging!, { vapidKey: VAPID_KEY });
          if (token) {
            return { token: applyToken(token), lastError: null };
          }
        } catch (e) {
          lastError = e;
          if (isFirebaseIndexedDbStoreError(e)) {
            firebasePushDebug('warn', '[Firebase] IndexedDB Firebase incohérent — reset ciblé avant fallback');
            await resetFirebaseIndexedDbState();
          }
          if (attempt < 1) {
            await new Promise((r) => setTimeout(r, 600));
          }
        }
      }
      return { token: null, lastError };
    };

    let swReg = await registerMessagingServiceWorker();
    if (!swReg) {
      return null;
    }
    try {
      await swReg.update();
    } catch {
      /* noop */
    }
    await waitForFirebaseSwActive(swReg, 15000);

    let { token: tok, lastError } = await tryGetTokenWithReg(swReg);
    if (tok) {
      return tok;
    }

    if (lastError && isPushRegistrationFailedError(lastError)) {
      firebasePushDebug('warn', '[Firebase] Échec push service — reset SW FCM + nouvelle tentative');
      await resetFirebaseMessagingServiceWorker(messaging);
      swReg = await registerMessagingServiceWorker();
      if (swReg) {
        try {
          await swReg.update();
        } catch {
          /* noop */
        }
        await waitForFirebaseSwActive(swReg, 15000);
        const second = await tryGetTokenWithReg(swReg);
        if (second.token) {
          return second.token;
        }
        lastError = second.lastError;
      }
    }

    if (lastError && isFirebaseIndexedDbStoreError(lastError)) {
      firebasePushDebug('warn', '[Firebase] Dernière tentative après reset IndexedDB Firebase');
      await resetFirebaseIndexedDbState();
      swReg = await registerMessagingServiceWorker();
      if (swReg) {
        try {
          await swReg.update();
        } catch {
          /* noop */
        }
        await waitForFirebaseSwActive(swReg, 15000);
        const repaired = await tryGetTokenWithReg(swReg);
        if (repaired.token) {
          return repaired.token;
        }
        lastError = repaired.lastError;
      }
    }

    if (lastError && isPushRegistrationFailedError(lastError)) {
      firebasePushDebug('warn', '[Firebase] Dernière tentative getToken sans serviceWorkerRegistration explicite');
      const third = await tryGetTokenImplicitSw();
      if (third.token) {
        return third.token;
      }
      lastError = third.lastError;
    }

    firebasePushDebug('error', '[Firebase] Erreur récupération token:', lastError, {
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : undefined,
      protocol: typeof window !== 'undefined' ? window.location.protocol : undefined,
      host: typeof window !== 'undefined' ? window.location.hostname : undefined,
    });
    return null;
  } catch (error) {
    firebasePushDebug('error', '[Firebase] Erreur récupération token:', error);
    return null;
  }
};

/**
 * Stocke le token FCM de manière sécurisée
 */
const storeTokenSecurely = (token: string): void => {
  try {
    // Préférer sessionStorage pour plus de sécurité
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else if (typeof localStorage !== 'undefined') {
      // Fallback sur localStorage
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  } catch {
    void 0;
  }
};

/**
 * Récupère le token stocké
 */
export const getStoredToken = (): string | null => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  } catch (error) {

    return null;
  }
};

/**
 * Supprime le token FCM et nettoie le cache
 */
/**
 * Vide le cache mémoire + stockage local du jeton (changement de compte ou déconnexion).
 * N’appelle pas l’API Firebase — utiliser avec {@link deleteFCMToken} pour révoquer la souscription push.
 */
export const clearFcmTokenClientCache = (): void => {
  cachedFCMToken = null;
  tokenExpirationTime = null;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    void 0;
  }
};

export const deleteFCMToken = async (): Promise<boolean> => {
  try {
    if (!messaging) {
      clearFcmTokenClientCache();
      return false;
    }

    await deleteToken(messaging);
    clearFcmTokenClientCache();
    return true;
  } catch (error) {
    firebasePushDebug('error', '[Firebase] Erreur suppression token:', error);
    if (isFirebaseIndexedDbStoreError(error)) {
      await resetFirebaseIndexedDbState();
    }
    clearFcmTokenClientCache();
    return false;
  }
};

/**
 * Type pour les callbacks de notification
 */
export type NotificationCallback = (payload: MessagePayload) => void;

/**
 * Écoute les messages en foreground
 */
export const onForegroundMessage = (callback: NotificationCallback): (() => void) => {
  if (!messaging) {
    firebasePushDebug('error', '[Firebase] Messaging non initialisé');
    return () => {};
  }

  const unsubscribe = onMessage(messaging, (payload) => {

    callback(payload);
  });

  return unsubscribe;
};

/**
 * Affiche une notification locale
 */
export const showLocalNotification = (
  title: string,
  options?: NotificationOptions
): void => {
  if (!('Notification' in window)) {
    firebasePushDebug('error', '[Firebase] Notifications non supportées');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: APP_LOGO_SRC,
      badge: APP_LOGO_SRC,
      vibrate: [180, 120, 180],
      ...options,
    });

    setTimeout(() => {
      notification.close();
    }, 8000);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      notification.close();
    };
  }
};

const DEFAULT_NOTIF_ICON = APP_LOGO_SRC;

/**
 * Bannière système à partir d’un message FCM (app au premier plan).
 */
export const showNotificationFromFcmPayload = (payload: MessagePayload): void => {
  if (!('Notification' in window)) {
    return;
  }
  if (Notification.permission !== 'granted') {
    return;
  }
  const n = payload.notification;
  const title = (n?.title as string) || 'RetrouvonsLes';
  const body = (n?.body as string) || '';
  const data = (payload.data || {}) as Record<string, string>;
  const clickPath = data.clickUrl || '/citizen/notifications';
  const tag = data.tag || `rll-${Date.now()}`;

  const inst = new Notification(title, {
    body,
    icon: DEFAULT_NOTIF_ICON,
    badge: DEFAULT_NOTIF_ICON,
    tag,
    renotify: true,
    vibrate: [180, 120, 180],
    silent: false,
    requireInteraction: false,
    data: { clickUrl: clickPath } as NotificationOptions['data'],
  });

  setTimeout(() => inst.close(), 8000);
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 880;
      o.type = 'sine';
      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.2);
    }
  } catch {
    /* son optionnel selon navigateur */
  }
  inst.onclick = () => {
    inst.close();
    window.focus();
    window.location.assign(new URL(clickPath, window.location.origin).href);
  };
};

// ============================================
// GESTION DES TOPICS (SUJETS)
// ============================================

/**
 * Interface pour les topics
 */
export interface NotificationTopic {
  name: string;
  description: string;
}

/**
 * Topics disponibles pour l'application
 */
export const NOTIFICATION_TOPICS: Record<string, NotificationTopic> = {
  // Alertes critiques
  ALL_ALERTS: {
    name: 'all_alerts',
    description: 'Toutes les alertes de disparition',
  },
  AMBER_ALERTS: {
    name: 'amber_alerts',
    description: 'Alertes enlèvement critique',
  },
  REGIONAL_ALERTS: {
    name: 'regional_alerts',
    description: 'Alertes de votre région',
  },

  // Personnes et filiation
  FOUND_PERSONS: {
    name: 'found_persons',
    description: 'Personnes retrouvées',
  },
  FILIATION_MATCHES: {
    name: 'filiation_matches',
    description: 'Correspondances de filiation trouvées',
  },

  // Analyse IA
  IA_ANALYSIS_RESULTS: {
    name: 'ia_analysis_results',
    description: 'Résultats d\'analyse par IA',
  },
  FACIAL_RECOGNITION_MATCHES: {
    name: 'facial_recognition_matches',
    description: 'Correspondances de reconnaissance faciale',
  },

  // Organisations et utilisateurs
  ORGANISATION_UPDATES: {
    name: 'organisation_updates',
    description: 'Mises à jour de votre organisation',
  },
  USER_VERIFICATION: {
    name: 'user_verification',
    description: 'Notifications de vérification de compte',
  },

  // Campagnes et dons
  CAMPAIGN_UPDATES: {
    name: 'campaign_updates',
    description: 'Mises à jour des campagnes',
  },
  DONATION_NOTIFICATIONS: {
    name: 'donation_notifications',
    description: 'Notifications de donation et financement',
  },

  // Système
  SYSTEM_UPDATES: {
    name: 'system_updates',
    description: 'Mises à jour système',
  },
  MAINTENANCE_ALERTS: {
    name: 'maintenance_alerts',
    description: 'Alertes de maintenance',
  },
};

/**
 * S'abonner à un topic (doit être fait côté serveur)
 * Cette fonction prépare les données pour l'API backend
 */
export const prepareTopicSubscription = (
  fcmToken: string,
  topic: string
): { token: string; topic: string } => {
  return {
    token: fcmToken,
    topic: topic,
  };
};

// ============================================
// ANALYTICS
// ============================================

/**
 * Log un événement dans Analytics
 */
export const logAnalyticsEvent = (
  eventName: string,
  eventParams?: Record<string, any>
): void => {
  if (!analytics) {

    return;
  }

  try {
    // L'import dynamique évite les erreurs si analytics n'est pas supporté
    import('firebase/analytics').then(({ logEvent }) => {
      if (analytics) {
        logEvent(analytics, eventName, eventParams);

      }
    });
  } catch (error) {
    firebasePushDebug('error', '[Firebase] Erreur log événement:', error);
  }
};

/**
 * Événements Analytics prédéfinis
 */
export const ANALYTICS_EVENTS = {
  // Authentification
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_SIGNUP: 'user_signup',
  USER_PROFILE_UPDATED: 'user_profile_updated',

  // Dossiers
  DOSSIER_VIEWED: 'dossier_viewed',
  DOSSIER_SHARED: 'dossier_shared',
  DOSSIER_CREATED: 'dossier_created',
  DOSSIER_UPDATED: 'dossier_updated',
  DOSSIER_CLOSED: 'dossier_closed',

  // Personnes
  PERSONNE_CREATED: 'personne_created',
  PERSONNE_VIEWED: 'personne_viewed',
  PERSONNE_FOUND: 'personne_found',
  PERSONNE_MATCHED: 'personne_matched',

  // Signalements
  SIGNALEMENT_CREATED: 'signalement_created',
  SIGNALEMENT_VALIDATED: 'signalement_validated',
  SIGNALEMENT_REJECTED: 'signalement_rejected',
  SIGNALEMENT_SHARED: 'signalement_shared',

  // Alertes
  ALERT_RECEIVED: 'alert_received',
  ALERT_CLICKED: 'alert_clicked',
  ALERT_SHARED: 'alert_shared',
  ALERT_CREATED: 'alert_created',
  ALERT_DELETED: 'alert_deleted',

  // Filiation
  FILIATION_LINK_CREATED: 'filiation_link_created',
  FILIATION_LINK_CONFIRMED: 'filiation_link_confirmed',
  FILIATION_MATCH_FOUND: 'filiation_match_found',

  // Analyse IA
  IA_ANALYSIS_TRIGGERED: 'ia_analysis_triggered',
  IA_ANALYSIS_COMPLETED: 'ia_analysis_completed',
  FACIAL_RECOGNITION_PERFORMED: 'facial_recognition_performed',
  FACIAL_RECOGNITION_MATCH_FOUND: 'facial_recognition_match_found',

  // Carte
  MAP_VIEWED: 'map_viewed',
  GEOFENCE_ALERT_TRIGGERED: 'geofence_alert_triggered',
  LOCATION_SHARED: 'location_shared',

  // Recherche
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_REFINED: 'search_refined',
  FILTER_APPLIED: 'filter_applied',
  ADVANCED_SEARCH_USED: 'advanced_search_used',

  // Campagnes
  CAMPAIGN_VIEWED: 'campaign_viewed',
  CAMPAIGN_SHARED: 'campaign_shared',
  CAMPAIGN_CREATED: 'campaign_created',

  // Donations
  DONATION_VIEWED: 'donation_viewed',
  DONATION_INITIATED: 'donation_initiated',
  DONATION_COMPLETED: 'donation_completed',
  DONATION_FAILED: 'donation_failed',

  // Engagement
  PAGE_VIEW: 'page_view',
  PAGE_DURATION: 'page_duration',
  USER_ENGAGEMENT: 'user_engagement',
  FEATURE_USAGE: 'feature_usage',

  // Notifications
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_OPENED: 'notification_opened',
  NOTIFICATION_DISMISSED: 'notification_dismissed',
  NOTIFICATION_SETTINGS_UPDATED: 'notification_settings_updated',

  // Organisations
  ORGANISATION_VIEWED: 'organisation_viewed',
  ORGANISATION_JOINED: 'organisation_joined',

  // Erreurs et performances
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  PERFORMANCE_ISSUE: 'performance_issue',
} as const;

// ============================================
// HELPERS
// ============================================

/**
 * Vérifie si les notifications sont supportées
 */
export const areNotificationsSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Récupère le statut de permission des notifications
 */
export const getNotificationPermissionStatus = (): NotificationPermission => {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
};

/**
 * Vérifie si Firebase est initialisé
 */
export const isFirebaseReady = (): boolean => {
  return isFirebaseInitialized && firebaseApp !== null;
};

// ============================================
// NETTOYAGE
// ============================================

/**
 * Nettoie les ressources Firebase
 */
export const cleanupFirebase = (): void => {
  // Firebase ne nécessite pas de nettoyage explicite
  // mais on peut réinitialiser les flags

};

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

const firebaseModule = {
  initializeFirebase,
  registerMessagingServiceWorker,
  getFCMToken,
  getStoredToken,
  clearFcmTokenClientCache,
  deleteFCMToken,
  requestNotificationPermission,
  onForegroundMessage,
  showLocalNotification,
  showNotificationFromFcmPayload,
  logAnalyticsEvent,
  areNotificationsSupported,
  getNotificationPermissionStatus,
  isFirebaseReady,
  NOTIFICATION_TOPICS,
  ANALYTICS_EVENTS,
};

export default firebaseModule;