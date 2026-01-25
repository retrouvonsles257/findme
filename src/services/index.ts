/**
 * =====================================================
 * RETROUVONSLES - SERVICES CENTRALIZED EXPORT
 * =====================================================
 * 
 * RETROUVONSLES est une application de recherche de personnes disparues
 * combinant Supabase, Firebase, WebSocket, MapTiler, Cloudinary et API custom
 * 
 * Ce fichier centralise TOUS les services de l'application
 * Point d'accès unique pour toutes les fonctionnalités
 * 
 * @see projet.txt - Context et objectifs du projet
 * @see structure-projet.txt - Structure complète du projet
 * @see modele_donnee.sql - Modèle de données Supabase
 */

// ============================================
// =========== RUNTIME IMPORTS (Instances) ===========
// ============================================

// Supabase Services
import { supabaseAuthService } from './supabase/auth';
import { DatabaseService } from './supabase/database';
import { StorageService, STORAGE_BUCKETS } from './supabase/storage';
import { RealtimeService } from './supabase/realtime';
import { RealtimeSubscriptionsManager } from './supabase/realtimeSubscriptions';
import { initializeSupabaseFromEnv } from './supabase/supabaseClient';

// WebSocket Services
import { WebSocketService, initializeWebSocketService, getWebSocketService } from './websocket';

// Firebase Services
import { firebaseAuthService } from './firebase/authService';
import { firestoreService } from './firebase/firestoreService';
import { realtimeDatabaseService } from './firebase/realtimeDbService';
import { firebaseStorageService } from './firebase/storageService';
import { firebaseAnalyticsService } from './firebase/analyticsService';
import { firebaseFCMService } from './firebase/fcmService';
import { initializeFirebase, getFirebaseServices, FIREBASE_ERROR_CODES } from './firebase/firebaseConfig';

// API Services
import { apiClient } from './api/apiClient';
import { API_ENDPOINTS } from './api/endpoints';

// Cloudinary Services
import { cloudinaryService } from './cloudinary/cloudinaryService';
import { uploadFileToCloudinary, transformImage } from './cloudinary';
import { UPLOAD_CONFIGS, TRANSFORMATION_PRESETS } from './cloudinary/cloudinaryConfig';
import { maptilerConfig, mapService, geocodingService, routingService, MAPTILER_STYLES, ROUTING_PROFILES } from './maptiler';

// ============================================
// =========== SUPABASE SERVICES ===========
// ============================================

export {
  SupabaseClientManager,
  SupabaseClientError,
  SupabaseConnectionError,
  SupabaseAuthError,
  SupabaseDatabaseError,
  SupabaseStorageError,
  SupabaseRealtimeError,
  initializeSupabaseFromEnv,
  retryWithBackoff,
  handleSupabaseError,
  buildFilterQuery,
  type SupabaseConfig,
  type SupabaseErrorResponse,
} from './supabase/supabaseClient';

export {
  supabaseAuthService,
  type AuthError,
  type AuthResult,
} from './supabase/auth';

export {
  DatabaseService,
  type QueryOptions,
  type FilterOptions,
  type DatabaseResult,
  type BatchOperationResult,
} from './supabase/database';

export {
  StorageService,
  STORAGE_BUCKETS,
  type FileUploadOptions,
  type UploadedFile,
  type StorageResult,
  type ListFilesOptions,
} from './supabase/storage';

export {
  validateFile as validateSupabaseFile,
  validateFileSize,
  validateFileMimeType,
  validateFileExtension,
  compressImage,
  getImageDimensions,
  createThumbnail,
  uploadUserPhoto,
  uploadDocument,
  uploadEvidence,
  generateUserPath,
  generateTimestampedFilename,
  getFileExtension,
  getFileNameWithoutExtension,
  buildStorageUrl,
  getUserPhotoUrl,
  getDocumentUrl,
  getEvidenceUrl,
  type ImageOptions,
  type FileValidationOptions,
  type ImageMetadata,
} from './supabase/storageHelpers';

export {
  RealtimeService,
  type RealtimeEvent,
  type ChannelOptions,
  type EventCallback,
  type PresenceCallback,
  type StatusCallback,
} from './supabase/realtime';

export {
  RealtimeSubscriptionsManager,
  type SubscriptionConfig,
  type ActiveSubscription,
} from './supabase/realtimeSubscriptions';

// ============================================
// =========== WEBSOCKET SERVICES ===========
// ============================================

export {
  WebSocketClientManager,
  WebSocketError,
  WebSocketConnectionError,
  WebSocketTimeoutError,
  type WebSocketConfig,
  type WebSocketMessage,
  type WebSocketEvent,
} from './websocket/websocketClient';

export {
  WebSocketService,
  type Notification,
  type UserActivity,
  type ChatMessage,
  type TypingIndicator,
  type LocationUpdate,
  type DossierUpdate,
  type PersonneMatch,
} from './websocket/websocketService';

export {
  initializeWebSocketService,
  getWebSocketService,
} from './websocket';

// ============================================
// =========== FIREBASE SERVICES ===========
// ============================================

export {
  initializeFirebase,
  getFirebaseServices,
  isFirebaseConfigured,
  isServiceAvailable,
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
} from './firebase/firebaseConfig';

export {
  firebaseAuthService,
  type SignUpData,
  type SignInData,
  type UserProfile,
  type PasswordResetResult,
} from './firebase/authService';

export {
  firebaseAnalyticsService,
  type AnalyticsEventParams,
  type UserProperties,
  type PageViewParams,
  type SearchParams,
} from './firebase/analyticsService';

export {
  firebaseFCMService,
  type NotificationPayload,
  type NotificationToken,
  type PushNotificationOptions,
} from './firebase/fcmService';

export {
  firestoreService,
  type FirestoreDocument,
  type BatchOperation,
  type QueryResult,
  type Transaction,
} from './firebase/firestoreService';

export {
  firebaseStorageService,
  type UploadProgress,
  type DownloadResult,
  type FileMetadata,
} from './firebase/storageService';

export {
  realtimeDatabaseService,
  type DatabaseQuery,
  type DataChangeCallback,
  type ChildChangeCallback,
} from './firebase/realtimeDbService';

// ============================================
// =========== API SERVICES ===========
// ============================================

export {
  api,
  apiClient,
  type ApiResponse,
  type ApiError,
} from './api/apiClient';

export {
  API_ENDPOINTS,
  getApiUrl,
} from './api/endpoints';

export {
  ErrorType,
  parseApiError,
  getUserFriendlyMessage,
  logError,
  isRetryableError,
  requiresReauth,
  formatValidationErrors,
  type ApiErrorResponse,
} from './api/errorHandler';

export {
  setupAllInterceptors,
  setupRequestInterceptor,
  setupResponseInterceptor,
} from './api/interceptors';

export {
  REQUEST_TIMEOUT,
  DEFAULT_REQUEST_CONFIG,
  getRequestConfig,
  buildQueryString,
  buildSortString,
  getPaginationParams,
  DEFAULT_PAGINATION,
  buildCacheKey,
  FILE_UPLOAD_CONFIG,
  validateFile as validateApiFile,
  buildFormData,
  RETRY_CONFIG,
  getRetryDelay,
  isRetryableStatus,
  REQUEST_DEDUP_CONFIG,
  type QueryParams,
  type PaginationParams,
  type FilterParams,
  type SortParams,
} from './api/requestConfig';

// ============================================
// =========== CLOUDINARY SERVICES ===========
// ============================================

export {
  cloudinaryConfig,
  isCloudinaryConfigured,
  getUploadConfig,
  getTransformationPreset,
  validateFile as validateCloudinaryFile,
  isFileTypeAllowed,
  isFileSizeValid,
  getFileIcon,
  formatFileSize,
  buildCloudinaryUrl,
  buildTransformationString,
  extractPublicId,
  getResourceType,
  UPLOAD_CONFIGS,
  TRANSFORMATION_PRESETS,
  SIGNED_URL_CONFIG,
  UPLOAD_WIDGET_CONFIG,
  type CloudinaryConfig,
  type UploadConfig,
  type CloudinaryTransformation,
  type UploadResponse,
  type DeleteResponse,
  type TransformationResult,
} from './cloudinary/cloudinaryConfig';

export {
  uploadFileToCloudinary,
  uploadMultipleFiles,
  uploadBlob,
  uploadFromUrl,
  uploadWithTransformation,
  uploadWithRetry,
  getUploadUrl,
  type UploadOptions,
  type UploadProgress as CloudinaryUploadProgress,
  type UploadResult as CloudinaryUploadResult,
} from './cloudinary/cloudinaryUpload';

export {
  transformImage,
  applyPreset,
  resize,
  thumbnail,
  avatar,
  createSrcSet,
  getResponsiveUrls,
  optimizeForWeb,
  convertFormat,
  applyEffect,
  blurForPrivacy,
  pixelateForPrivacy,
  autoBlurFaces,
  cropToFace,
  addBorder,
  addShadow,
  rotate,
  adjustColors,
  addWatermark,
  addTextOverlay,
  chainTransformations,
  buildTransformUrl,
  deleteImage,
  createImageVariants,
  type TransformOptions,
  type TransformedUrl,
} from './cloudinary/cloudinaryTransform';

export {
  cloudinaryService,
  type CloudinaryServiceConfig,
  type FileUploadSession,
} from './cloudinary/cloudinaryService';

// ============================================
// =========== MAPTILER SERVICES ===========
// ============================================

export {
  MapTilerConfigService,
  maptilerConfig,
  MapService,
  mapService,
  GeocodingService,
  geocodingService,
  RoutingService,
  routingService,
  MAPTILER_API_URLS,
  MAPTILER_STYLES,
  MAP_STYLE_PRESETS,
  GEOCODING_TYPES,
  ROUTING_PROFILES,
  DEFAULT_MAP_CONFIG,
  DEFAULT_GEOCODING_OPTIONS,
  DEFAULT_ROUTING_OPTIONS,
  DISTANCE_UNITS,
  DEFAULT_BOUNDS,
  FRANCE_CENTERS,
  MARKER_COLORS,
  MARKER_PRESETS,
  MAPTILER_ERROR_CODES,
  MAPTILER_ERROR_MESSAGES,
  API_TIMEOUT,
  API_RETRY_CONFIG,
  MAPTILER_FEATURES,
  type MapTilerApiConfig,
  type MapConfiguration,
  type GeocodingOptions,
  type RoutingOptions,
  type MarkerConfig,
  type LayerConfig,
  type GeoJSONFeature,
  type GeoJSONGeometry,
  type GeoJSONFeatureCollection,
  type GeocodingResult,
  type GeocodingContext,
  type GeocodingType,
  type RoutingResult,
  type Route,
  type RouteLeg,
  type RouteStep,
  type Maneuver,
  type Waypoint,
  type MatrixRequest,
  type MatrixResponse,
  type MapStyle,
  type MapEventType,
  type ReverseGeocodingOptions,
  type SearchOptions,
  type Bounds,
  type DistanceMatrixOptions,
  type ControlOptions,
  type PopupOptions,
  type MapEventHandler,
  type MapClickEvent,
  type MarkerInstance,
  type LayerInstance,
  type MapSource,
  type MapStatistics,
  type CacheEntry,
  type AutocompleteSuggestion,
  type RoutingRequest,
  type DistanceResult,
  type RouteCacheEntry,
  GeocodingError,
  RoutingError,
} from './maptiler';

// ============================================
// =========== CONVENIENCE ACCESSORS ===========
// ============================================

/**
 * Get Supabase services
 * Returns typed access to all Supabase service modules
 */
export function getSupabaseServices() {
  return {
    auth: supabaseAuthService,
    database: DatabaseService,
    storage: StorageService,
    realtime: RealtimeService,
    realtimeSubscriptions: RealtimeSubscriptionsManager,
  } as any;
}

/**
 * Get API Client instance
 */
export function getApiClient() {
  return apiClient;
}

/**
 * Get Cloudinary Service instance
 */
// @ts-ignore
export function getCloudinaryService() {
  return cloudinaryService as any;
}

/**
 * Get MapTiler Services
 */
export function getMaptilerServices() {
  return {
    config: maptilerConfig,
    map: mapService,
    geocoding: geocodingService,
    routing: routingService,
  };
}

// ============================================
// =========== GROUPED EXPORTS ===========
// ============================================

/**
 * All services grouped by category  
 * Provides organized access to all service modules
 * 
 * Services are lazy-loaded to avoid initialization issues
 */
// @ts-ignore
export const services: any = {
  supabase: {
    auth: supabaseAuthService,
    database: DatabaseService,
    storage: StorageService,
    realtime: RealtimeService,
    realtimeSubscriptions: RealtimeSubscriptionsManager,
  },

  websocket: {
    service: WebSocketService,
    initialize: initializeWebSocketService,
  },

  firebase: {
    auth: firebaseAuthService,
    firestore: firestoreService,
    realtimeDb: realtimeDatabaseService,
    storage: firebaseStorageService,
    analytics: firebaseAnalyticsService,
    fcm: firebaseFCMService,
    initialize: initializeFirebase,
    getServices: getFirebaseServices,
  },

  api: {
    client: apiClient,
    endpoints: API_ENDPOINTS,
  },

  cloudinary: {
    service: cloudinaryService,
    upload: uploadFileToCloudinary,
    transform: transformImage,
  },

  maptiler: {
    config: maptilerConfig,
    map: mapService,
    geocoding: geocodingService,
    routing: routingService,
  },
};

// ============================================
// =========== COMBINED INITIALIZATION ===========
// ============================================

/**
 * Initialize all services at once
 */
export async function initializeAllServices(config?: {
  supabase?: { url: string; key: string };
  firebase?: Record<string, any>;
  websocket?: { url: string; userId: string; reconnectInterval?: number };
  cloudinary?: Record<string, any>;
  maptiler?: { apiKey: string };
}) {
  const initializedServices: Record<string, any> = {};

  try {
    // Initialize Supabase
    if (config?.supabase) {
      initializedServices.supabase = services.supabase;
      console.log('[Services] ✓ Supabase configured');
    }

    // Initialize Firebase (no config passed, uses env vars)
    try {
      await initializeFirebase();
      initializedServices.firebase = services.firebase;
      console.log('[Services] ✓ Firebase initialized');
    } catch (err) {
      console.warn('[Services] Firebase initialization skipped:', err);
    }

    // Initialize WebSocket
    if (config?.websocket) {
      await initializeWebSocketService(
        config.websocket.userId,
        config.websocket.url,
        config.websocket.reconnectInterval || 5000
      );
      initializedServices.websocket = services.websocket;
      console.log('[Services] ✓ WebSocket initialized');
    }

    // Cloudinary (auto-configured via env)
    if (config?.cloudinary) {
      initializedServices.cloudinary = services.cloudinary;
      console.log('[Services] ✓ Cloudinary configured');
    }

    // MapTiler (auto-configured via env, optional apiKey override)
    if (config?.maptiler?.apiKey) {
      // Config is already set from env, just log
      initializedServices.maptiler = services.maptiler;
      console.log('[Services] ✓ MapTiler configured');
    }

    console.log('[Services] ✓ All services initialized successfully');
    return initializedServices;
  } catch (error) {
    console.error('[Services] ✗ Error initializing services:', error);
    throw error;
  }
}

// ============================================
// =========== MAIN EXPORT ===========
// ============================================

/**
 * Main services export object
 */
// @ts-ignore
const servicesExport: any = {
  // Grouped services
  services,

  // Service accessors
  getSupabaseServices,
  getWebSocketService,
  getFirebaseServices,
  getApiClient: () => apiClient,
  getCloudinaryService,
  getMaptilerServices,

  // Initialization
  initializeAllServices,
  initializeSupabaseFromEnv,
  initializeFirebase,
  initializeWebSocketService,

  // Constants
  API_ENDPOINTS,
  STORAGE_BUCKETS,
  FIREBASE_ERROR_CODES,
  UPLOAD_CONFIGS,
  TRANSFORMATION_PRESETS,
  MAPTILER_STYLES,
  ROUTING_PROFILES,
};

export default servicesExport;
