/**
 * =====================================================
 * RETROUVONSLES - Firebase Configuration Service
 * =====================================================
 * Firebase initialization and configuration
 */

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';
import { getMessaging, Messaging, isSupported as isMessagingSupported } from 'firebase/messaging';
import { getRemoteConfig, RemoteConfig } from 'firebase/remote-config';
import { getPerformance } from 'firebase/performance';

// ============================================
// FIREBASE CONFIG INTERFACE
// ============================================

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  databaseURL?: string;
}

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  realtimeDb: Database;
  storage: FirebaseStorage;
  analytics: Analytics | null;
  messaging: Messaging | null;
  remoteConfig: RemoteConfig;
  performance: any;
}

// ============================================
// FIREBASE CONFIGURATION
// ============================================

/**
 * Get Firebase configuration from environment variables
 */
const getFirebaseConfig = (): FirebaseConfig => {
  const config: FirebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  };

  // Validate required fields
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = requiredFields.filter((field) => !config[field as keyof FirebaseConfig]);

  if (missingFields.length > 0) {
    console.warn(`Missing Firebase config: ${missingFields.join(', ')}`);
  }

  return config;
};

// ============================================
// FIREBASE INITIALIZATION
// ============================================

let firebaseServices: FirebaseServices | null = null;

/**
 * Initialize Firebase services
 */
export const initializeFirebase = (): FirebaseServices => {
  if (firebaseServices) {
    return firebaseServices;
  }

  const config = getFirebaseConfig();

  // Initialize Firebase App
  const app = initializeApp(config);

  // Initialize services
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const realtimeDb = getDatabase(app);
  const storage = getStorage(app);
  const remoteConfig = getRemoteConfig(app);

  // Initialize optional services (browser-dependent)
  let analytics: Analytics | null = null;
  let messaging: Messaging | null = null;
  let performance: any = null;

  // Initialize Analytics (only if supported)
  if (typeof window !== 'undefined') {
    isSupported().then((supported: boolean) => {
      if (supported) {
        analytics = getAnalytics(app);
      }
    });

    // Initialize Messaging (only if supported)
    isMessagingSupported().then((supported: boolean) => {
      if (supported) {
        messaging = getMessaging(app);
      }
    });

    // Initialize Performance Monitoring
    // (getPerformance returns actual Performance object, no need for isSupported)
    try {
      performance = getPerformance(app);
    } catch (e) {
      // Performance monitoring not available
    }
  }

  firebaseServices = {
    app,
    auth,
    firestore,
    realtimeDb,
    storage,
    analytics,
    messaging,
    remoteConfig,
    performance,
  } as FirebaseServices;

  return firebaseServices;
};

/**
 * Get Firebase services (must be initialized first)
 */
export const getFirebaseServices = (): FirebaseServices => {
  if (!firebaseServices) {
    return initializeFirebase();
  }
  return firebaseServices;
};

/**
 * Check if Firebase is properly configured
 */
export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  return requiredFields.every((field) => !!config[field as keyof FirebaseConfig]);
};

/**
 * Check if specific service is available
 */
export const isServiceAvailable = (service: 'analytics' | 'messaging' | 'performance'): boolean => {
  if (!firebaseServices) {
    return false;
  }

  switch (service) {
    case 'analytics':
      return firebaseServices.analytics !== null;
    case 'messaging':
      return firebaseServices.messaging !== null;
    case 'performance':
      return firebaseServices.performance !== null;
    default:
      return false;
  }
};

// ============================================
// FIREBASE CONSTANTS
// ============================================

/**
 * Authentication providers
 */
export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  PHONE: 'phone',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  TWITTER: 'twitter',
  GITHUB: 'github',
  APPLE: 'apple',
  ANONYMOUS: 'anonymous',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  ORGANIZATION: 'organization',
  CITIZEN: 'citizen',
  STAFF: 'staff',
} as const;

/**
 * Collections
 */
export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  PERSONNES: 'personnes',
  DOSSIERS: 'dossiers_disparition',
  SIGNALEMENTS: 'signalements',
  ORGANISATIONS: 'organisations',
  DOCUMENTS: 'documents',
  NOTIFICATIONS: 'notifications',
  ANALYTICS_EVENTS: 'analytics_events',
  FEEDBACK: 'feedback',
  REPORTS: 'reports',
  AUDIT_LOG: 'audit_log',
} as const;

/**
 * Firestore sub-collections
 */
export const FIRESTORE_SUBCOLLECTIONS = {
  PHOTOS: 'photos',
  ATTACHMENTS: 'attachments',
  COMMENTS: 'comments',
  UPDATES: 'updates',
  HISTORY: 'history',
  MEMBERS: 'members',
  PERMISSIONS: 'permissions',
} as const;

/**
 * Realtime Database paths
 */
export const REALTIME_DB_PATHS = {
  ACTIVE_USERS: '/active_users',
  LIVE_UPDATES: '/live_updates',
  SESSIONS: '/sessions',
  PRESENCE: '/presence',
  NOTIFICATIONS: '/notifications',
  TYPING_INDICATORS: '/typing_indicators',
} as const;

/**
 * Firebase storage buckets
 */
export const STORAGE_PATHS = {
  USER_PROFILES: 'user_profiles/',
  PERSONNE_PHOTOS: 'personne_photos/',
  DOCUMENTS: 'documents/',
  DOSSIER_ATTACHMENTS: 'dossier_attachments/',
  SIGNALEMENT_PHOTOS: 'signalement_photos/',
  ORGANIZATION_LOGOS: 'organization_logos/',
  TEMP: 'temp/',
} as const;

/**
 * Analytics event names
 */
export const ANALYTICS_EVENTS = {
  // User events
  USER_LOGIN: 'user_login',
  USER_SIGNUP: 'user_signup',
  USER_LOGOUT: 'user_logout',
  USER_PROFILE_UPDATED: 'user_profile_updated',
  USER_DELETED: 'user_deleted',

  // Personne events
  PERSONNE_CREATED: 'personne_created',
  PERSONNE_UPDATED: 'personne_updated',
  PERSONNE_FOUND: 'personne_found',
  PERSONNE_ARCHIVED: 'personne_archived',
  PERSONNE_PHOTO_ADDED: 'personne_photo_added',

  // Dossier events
  DOSSIER_CREATED: 'dossier_created',
  DOSSIER_UPDATED: 'dossier_updated',
  DOSSIER_CLOSED: 'dossier_closed',
  DOSSIER_SHARED: 'dossier_shared',

  // Signalement events
  SIGNALEMENT_CREATED: 'signalement_created',
  SIGNALEMENT_VERIFIED: 'signalement_verified',
  SIGNALEMENT_REJECTED: 'signalement_rejected',

  // Search events
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  FILTER_APPLIED: 'filter_applied',

  // Content events
  CONTENT_VIEWED: 'content_viewed',
  CONTENT_SHARED: 'content_shared',
  CONTENT_REPORTED: 'content_reported',

  // Engagement events
  PAGE_VIEW: 'page_view',
  SCROLL_DEPTH: 'scroll_depth',
  TIME_ON_PAGE: 'time_on_page',
  BUTTON_CLICK: 'button_click',
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  FORM_ABANDON: 'form_abandon',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  PERSONNE_UPDATE: 'personne_update',
  DOSSIER_UPDATE: 'dossier_update',
  SIGNALEMENT_NEW: 'signalement_new',
  SIGNALEMENT_VERIFIED: 'signalement_verified',
  MESSAGE: 'message',
  SYSTEM: 'system',
  ALERT: 'alert',
  REMINDER: 'reminder',
} as const;

/**
 * Error codes
 */
export const FIREBASE_ERROR_CODES = {
  // Auth errors
  AUTH_EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  AUTH_INVALID_EMAIL: 'auth/invalid-email',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_TOO_MANY_REQUESTS: 'auth/too-many-requests',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_OPERATION_NOT_ALLOWED: 'auth/operation-not-allowed',
  AUTH_ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL: 'auth/account-exists-with-different-credential',

  // Firestore errors
  FIRESTORE_PERMISSION_DENIED: 'permission-denied',
  FIRESTORE_NOT_FOUND: 'not-found',
  FIRESTORE_ALREADY_EXISTS: 'already-exists',
  FIRESTORE_INVALID_ARGUMENT: 'invalid-argument',

  // Storage errors
  STORAGE_OBJECT_NOT_FOUND: 'storage/object-not-found',
  STORAGE_BUCKET_NOT_FOUND: 'storage/bucket-not-found',
  STORAGE_PROJECT_NOT_FOUND: 'storage/project-not-found',
  STORAGE_QUOTA_EXCEEDED: 'storage/quota-exceeded',
  STORAGE_NOT_AUTHENTICATED: 'storage/not-authenticated',
  STORAGE_NOT_AUTHORIZED: 'storage/not-authorized',
  STORAGE_RETRY_LIMIT_EXCEEDED: 'storage/retry-limit-exceeded',
  STORAGE_INVALID_CHECKSUM: 'storage/invalid-checksum',
  STORAGE_CANCELED: 'storage/canceled',

  // Messaging errors
  MESSAGING_INVALID_REGISTRATION_TOKEN: 'messaging/invalid-registration-token',
  MESSAGING_REGISTRATION_TOKEN_NOT_REGISTERED: 'messaging/registration-token-not-registered',
  MESSAGING_MISMATCHED_CREDENTIAL: 'messaging/mismatched-credential',
  MESSAGING_MESSAGE_RATE_EXCEEDED: 'messaging/message-rate-exceeded',
} as const;

/**
 * Query constraints for Firestore
 */
export const QUERY_OPERATORS = {
  EQUAL: '==',
  NOT_EQUAL: '!=',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '<=',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '>=',
  ARRAY_CONTAINS: 'array-contains',
  ARRAY_CONTAINS_ANY: 'array-contains-any',
  IN: 'in',
  NOT_IN: 'not-in',
} as const;

/**
 * Order by directions
 */
export const ORDER_DIRECTIONS = {
  ASCENDING: 'asc',
  DESCENDING: 'desc',
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type AuthProvider = typeof AUTH_PROVIDERS[keyof typeof AUTH_PROVIDERS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type FirestoreCollection = typeof FIRESTORE_COLLECTIONS[keyof typeof FIRESTORE_COLLECTIONS];
export type FirestoreSubcollection = typeof FIRESTORE_SUBCOLLECTIONS[keyof typeof FIRESTORE_SUBCOLLECTIONS];
export type RealtimeDbPath = typeof REALTIME_DB_PATHS[keyof typeof REALTIME_DB_PATHS];
export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];
export type AnalyticsEventName = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
export type QueryOperator = typeof QUERY_OPERATORS[keyof typeof QUERY_OPERATORS];
export type OrderDirection = typeof ORDER_DIRECTIONS[keyof typeof ORDER_DIRECTIONS];

const firebaseConfigExports = {
  initializeFirebase,
  getFirebaseServices,
  isFirebaseConfigured,
  isServiceAvailable,
  AUTH_PROVIDERS,
  USER_ROLES,
  FIRESTORE_COLLECTIONS,
  FIRESTORE_SUBCOLLECTIONS,
  REALTIME_DB_PATHS,
  STORAGE_PATHS,
  ANALYTICS_EVENTS,
  NOTIFICATION_TYPES,
  FIREBASE_ERROR_CODES,
  QUERY_OPERATORS,
  ORDER_DIRECTIONS,
};

export default firebaseConfigExports;
