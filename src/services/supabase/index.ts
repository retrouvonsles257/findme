/**
 * =====================================================
 * RETROUVONSLES - Supabase Services Barrel Export
 * =====================================================
 * 
 * Consolidation de tous les services Supabase
 * Point d'entrée principal pour l'utilisation
 */

// ============================================
// IMPORTS
// ============================================

import { DatabaseService } from './database';
import { StorageService } from './storage';
import { RealtimeService } from './realtime';
import { RealtimeSubscriptionsManager } from './realtimeSubscriptions';
import {
  initializeSupabaseFromEnv,
  retryWithBackoff,
  handleSupabaseError,
} from './supabaseClient';

// ============================================
// CLIENT & CONFIG
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
} from './supabaseClient';

export type {
  SupabaseConfig,
  SupabaseErrorResponse,
} from './supabaseClient';

// ============================================
// AUTHENTICATION SERVICE
// ============================================

export { supabaseAuthService } from './auth';

export type {
  AuthError,
  AuthResult,
} from './auth';

// ============================================
// DATABASE SERVICE
// ============================================

export { DatabaseService } from './database';

export type {
  QueryOptions,
  FilterOptions,
  DatabaseResult,
  BatchOperationResult,
} from './database';

// ============================================
// STORAGE SERVICE
// ============================================

export { StorageService, STORAGE_BUCKETS } from './storage';

export type {
  FileUploadOptions,
  UploadedFile,
  StorageResult,
  ListFilesOptions,
} from './storage';

// ============================================
// STORAGE HELPERS
// ============================================

export {
  validateFile,
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
} from './storageHelpers';

export type {
  ImageOptions,
  FileValidationOptions,
  ImageMetadata,
} from './storageHelpers';

// ============================================
// REALTIME SERVICE
// ============================================

export { RealtimeService } from './realtime';

export type {
  RealtimeEvent,
  ChannelOptions,
  EventCallback,
  PresenceCallback,
  StatusCallback,
} from './realtime';

// ============================================
// REALTIME SUBSCRIPTIONS MANAGER
// ============================================

export { RealtimeSubscriptionsManager } from './realtimeSubscriptions';

export type {
  SubscriptionConfig,
  ActiveSubscription,
} from './realtimeSubscriptions';

// ============================================
// DEFAULT EXPORTS
// ============================================

const supabaseServicesExport = {
  // Services
  DatabaseService,
  StorageService,
  RealtimeService,
  RealtimeSubscriptionsManager,

  // Functions
  initializeSupabaseFromEnv,
  retryWithBackoff,
  handleSupabaseError,
};

export default supabaseServicesExport;
