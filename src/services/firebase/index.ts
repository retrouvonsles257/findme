/**
 * =====================================================
 * RETROUVONSLES - Firebase Services Barrel Export
 * =====================================================
 * Centralized export point for all Firebase services
 * Usage: import { firebaseAuthService, firestoreService, ... } from '@/services/firebase'
 */

// ============================================
// CONFIGURATION & INITIALIZATION
// ============================================

export {
  initializeFirebase,
  getFirebaseServices,
  isFirebaseConfigured,
  isServiceAvailable,
  type FirebaseServices,
  type AuthProvider,
  type UserRole,
  type FirestoreCollection,
  type FirestoreSubcollection,
  type RealtimeDbPath,
  type StoragePath,
  type AnalyticsEventName,
  type NotificationType,
  type QueryOperator,
  type OrderDirection,
} from './firebaseConfig';

// ============================================
// CONFIGURATION CONSTANTS
// ============================================

export {
  AUTH_PROVIDERS,
  FIRESTORE_COLLECTIONS,
  REALTIME_DB_PATHS,
  STORAGE_PATHS,
  ANALYTICS_EVENTS,
  QUERY_OPERATORS,
  ORDER_DIRECTIONS,
  FIREBASE_ERROR_CODES,
  NOTIFICATION_TYPES,
  USER_ROLES,
  FIRESTORE_SUBCOLLECTIONS,
} from './firebaseConfig';

// ============================================
// FIREBASE ANALYTICS SERVICE
// ============================================

export {
  firebaseAnalyticsService,
  type AnalyticsEventParams,
  type UserProperties,
  type PageViewParams,
  type SearchParams,
} from './analyticsService';

// ============================================
// FIREBASE CLOUD MESSAGING SERVICE
// ============================================

export {
  firebaseFCMService,
  type NotificationPayload,
  type NotificationToken,
  type PushNotificationOptions,
} from './fcmService';

// ============================================
// FIREBASE AUTHENTICATION SERVICE
// ============================================

export {
  firebaseAuthService,
  type SignUpData,
  type SignInData,
  type UserProfile,
  type AuthError,
  type AuthResult,
  type PasswordResetResult,
} from './authService';

// ============================================
// FIRESTORE DATABASE SERVICE
// ============================================

export {
  firestoreService,
  type FirestoreDocument,
  type QueryOptions,
  type BatchOperation,
  type QueryResult,
  type Transaction,
} from './firestoreService';

// ============================================
// FIREBASE STORAGE SERVICE
// ============================================

export {
  firebaseStorageService,
  type UploadProgress,
  type UploadResult,
  type DownloadResult,
  type FileMetadata,
} from './storageService';

// ============================================
// FIREBASE REALTIME DATABASE SERVICE
// ============================================

export {
  realtimeDatabaseService,
  type DatabaseQuery,
  type DataChangeCallback,
  type ChildChangeCallback,
} from './realtimeDbService';
