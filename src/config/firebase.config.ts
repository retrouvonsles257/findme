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
    console.error(
      '[Firebase] Configuration incomplète. Champs manquants:',
      missingFields
    );
    return false;
  }

  if (!VAPID_KEY || VAPID_KEY.includes('your-vapid')) {
    console.error('[Firebase] VAPID Key manquante ou placeholder (REACT_APP_FIREBASE_VAPID_KEY / REACT_APP_PUSH_VAPID_PUBLIC_KEY)');
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
      console.error('[Firebase] Impossible d\'initialiser - configuration invalide');
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
    console.error('[Firebase] Erreur d\'initialisation:', error);
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
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (error) {
    console.error('[Firebase] Échec enregistrement firebase-messaging-sw.js:', error);
    return null;
  }
};

/**
 * Demande la permission pour les notifications
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!('Notification' in window)) {
      console.error('[Firebase] Les notifications ne sont pas supportées');
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
    console.error('[Firebase] Erreur demande permission:', error);
    return false;
  }
};

/**
 * Récupère le token FCM avec cache et gestion d'expiration
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.error('[Firebase] Messaging non initialisé');
      return null;
    }

    if (!VAPID_KEY) {
      console.error('[Firebase] VAPID Key manquante');
      return null;
    }

    // Vérifier le cache et l'expiration
    if (cachedFCMToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {

      return cachedFCMToken;
    }

    // Vérifier la permission
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        return null;
      }
    }

    const swReg = await registerMessagingServiceWorker();
    if (!swReg) {

      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      // Mettre en cache le token
      cachedFCMToken = token;
      tokenExpirationTime = Date.now() + (TOKEN_EXPIRATION_DAYS * 24 * 60 * 60 * 1000);

      // Stocker de manière sécurisée
      storeTokenSecurely(token);

      return token;
    } else {

      return null;
    }
  } catch (error) {
    console.error('[Firebase] Erreur récupération token:', error);
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
export const deleteFCMToken = async (): Promise<boolean> => {
  try {
    if (!messaging) {
      console.error('[Firebase] Messaging non initialisé');
      return false;
    }

    await deleteToken(messaging);

    // Nettoyer le cache
    cachedFCMToken = null;
    tokenExpirationTime = null;

    // Supprimer du stockage
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

    return true;
  } catch (error) {
    console.error('[Firebase] Erreur suppression token:', error);
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
    console.error('[Firebase] Messaging non initialisé');
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
    console.error('[Firebase] Notifications non supportées');
    return;
  }

  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/android/mipmap-xxxhdpi/ic_launcher.png',
      badge: '/android/mipmap-xxxhdpi/ic_launcher.png',
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

const DEFAULT_NOTIF_ICON = '/android/mipmap-xxxhdpi/ic_launcher.png';

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
    console.error('[Firebase] Erreur log événement:', error);
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