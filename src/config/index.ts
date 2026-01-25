/**
 * =====================================================
 * RETROUVONSLES - Configuration Index
 * =====================================================
 * Central export point for all application configuration
 */

// Environment Configuration
export { envConfig, validateEnvironment, getPublicEnv } from './env.config';
export type { EnvConfig } from './env.config';

// Application Configuration
export {
  appConfig,
  paginationConfig,
  limitsConfig,
  timingConfig,
  featureFlags,
  cacheConfig,
  validationConfig,
  sortingConfig,
  defaultValues,
  errorConfig,
  securityConfig,
} from './app.config';

// Theme Configuration
export {
  colors,
  typography,
  headings,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  themeConfig,
  mediaQueries,
} from './theme.config';

// Routes Configuration
export {
  publicRoutes,
  authRoutes,
  dashboardRoutes,
  allRoutes,
  isRouteAccessible,
  getAccessibleRoutes,
  getNavigationRoutes,
  findRouteByPath,
} from './routes.config';
export type { RouteConfig } from './routes.config';

// Firebase Configuration
// (Firebase services are initialized via initializeFirebase function in firebase.config.ts)

// Supabase Configuration
export {
  supabase,
  OAUTH_CONFIG,
  authEventManager,
  getCurrentSession,
  getCurrentUser,
  isAuthenticated,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  signInWithFacebook,
  signOut,
  resetPassword,
  updatePassword,
  updateUserMetadata,
  refreshSession,
  query,
  getUserProfile,
  getTableData,
  insertData,
  updateData,
  deleteData,
  personneHelpers,
  alerteHelpers,
  signalementHelpers,
  filiationHelpers,
  photoHelpers,
  uploadToStorage,
  getPublicUrl,
  deleteFromStorage,
  subscribeToTable,
  subscribeToInserts,
  subscribeToUpdates,
  getUserAccessLevel,
  checkUserPermission,
  getUserRole,
  canUserAccessResource,
  getOrganisationUsers,
  validateUserAction,
  initializeSupabase,
  cleanupSupabase,
} from './supabase.config';
export type { QueryResponse } from './supabase.config';

// Cloudinary Configuration
export {
  cloudinaryConfig,
  cloudinaryUploadConfig,
  cloudinaryTransformations,
  cloudinaryVideoTransformations,
  cloudinarySignedUrlConfig,
  cloudinaryUploadWidgetConfig,
  isCloudinaryConfigured,
  getUploadConfig,
  buildCloudinaryUrl,
} from './cloudinary.config';
export type { CloudinaryConfig } from './cloudinary.config';

// Map Configuration
export {
  mapConfig,
  mapDefaultSettings,
  mapStyles,
  markerConfig,
  clusteringConfig,
  heatmapConfig,
  geofenceConfig,
  routingConfig,
  mapSearchConfig,
  isMapProviderConfigured,
  getRegionCenter,
} from './map.config';

// AI/ML Configuration
export {
  aiModelsConfig,
  mlServiceConfig,
  facialRecognitionConfig,
  similarityConfig,
  imageProcessingConfig,
  batchProcessingConfig,
  aiCachingConfig,
  aiMonitoringConfig,
  aiPrivacyConfig,
  aiFeatureFlags,
  isAIServiceConfigured,
  isAIFeatureEnabled,
  getModelConfig,
} from './ia.config';
