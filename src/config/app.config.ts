/**
 * =====================================================
 * RETROUVONSLES - Application Configuration
 * =====================================================
 * Core application settings, feature flags, and constants
 */

import { envConfig } from './env.config';

// ============================================
// APPLICATION METADATA
// ============================================

export const appConfig = {
  // App Identity
  name: 'Retrouvons-Les',
  version: '1.0.0',
  description: 'Platform for finding and reunifying missing persons in Africa',
  author: 'Retrouvons-Les Team',

  // Environment
  isDevelopment: envConfig.NODE_ENV === 'development',
  isProduction: envConfig.NODE_ENV === 'production',
  isTest: envConfig.NODE_ENV === 'test',

  // Support
  supportEmail: 'support@retrouvonsles.com',
  supportPhone: '+237-XXX-XXX-XXXX',
  websiteUrl: 'https://retrouvonsles.com',
  termsUrl: 'https://retrouvonsles.com/terms',
  privacyUrl: 'https://retrouvonsles.com/privacy',
};

// ============================================
// PAGINATION & LIMITS
// ============================================

export const paginationConfig = {
  defaultPageSize: 20,
  maxPageSize: 100,
  defaultOffset: 0,
  pageSizeOptions: [10, 20, 50, 100],
};

export const limitsConfig = {
  // File uploads
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxProfilePhotoSize: 5 * 1024 * 1024, // 5MB
  maxDocumentSize: 20 * 1024 * 1024, // 20MB

  // Forms
  maxNameLength: 100,
  maxEmailLength: 255,
  maxPhoneLength: 20,
  maxBioLength: 500,
  maxAddressLength: 255,
  minPasswordLength: 8,
  maxPasswordLength: 128,

  // Search & Filtering
  maxSearchQueryLength: 200,
  maxFilterOptions: 10,
  maxResults: 1000,

  // Geographic
  defaultNotificationRadiusKm: 50,
  minNotificationRadiusKm: 1,
  maxNotificationRadiusKm: 500,

  // Media
  allowedImageFormats: ['jpeg', 'jpg', 'png', 'webp'],
  allowedDocumentFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
};

// ============================================
// TIMING & INTERVALS
// ============================================

export const timingConfig = {
  // Request timeouts (ms)
  apiTimeout: envConfig.REACT_APP_API_TIMEOUT,
  uploadTimeout: 120000,
  syncTimeout: 30000,

  // Debounce delays (ms)
  searchDebounce: 300,
  filterDebounce: 250,
  resizeDebounce: 150,
  scrollDebounce: 100,

  // Throttle delays (ms)
  scrollThrottle: 100,
  resizeThrottle: 200,

  // Auto-refresh intervals (ms)
  notificationRefreshInterval: 30000,
  locationUpdateInterval: 60000,
  sessionCheckInterval: 300000, // 5 minutes

  // Animations
  toastDuration: 4000,
  tooltipDelay: 500,
  transitionDuration: 300,
};

// ============================================
// FEATURE FLAGS
// ============================================

export const featureFlags = {
  // Core Features
  facialRecognition: envConfig.ENABLE_FACIAL_RECOGNITION,
  geolocation: envConfig.ENABLE_GEOLOCATION,
  notifications: envConfig.ENABLE_NOTIFICATIONS,
  pushNotifications: envConfig.ENABLE_PUSH_NOTIFICATIONS,
  analytics: envConfig.ENABLE_ANALYTICS,

  // Social Features
  messaging: true,
  socialSharing: true,
  userRatings: true,

  // Admin Features
  bulkUpload: true,
  advancedReporting: true,
  userManagement: true,
  organizationManagement: true,

  // Beta Features
  aiMatching: false,
  videoIdentification: false,
  dnaMatching: false,
  advancedFiltering: true,
};

// ============================================
// CACHE CONFIGURATION
// ============================================

export const cacheConfig = {
  // Cache durations (ms)
  userDataCacheDuration: 5 * 60 * 1000, // 5 minutes
  searchResultsCacheDuration: 2 * 60 * 1000, // 2 minutes
  organizationsCacheDuration: 30 * 60 * 1000, // 30 minutes
  rolesCacheDuration: 60 * 60 * 1000, // 1 hour

  // Cache limits
  maxCacheSize: 50, // max items
  maxSearchCacheSize: 100,
  maxImageCacheSize: 200,
};

// ============================================
// VALIDATION RULES
// ============================================

export const validationConfig = {
  // Email
  emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  emailMaxLength: 255,

  // Phone
  phonePattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  phoneMinLength: 7,

  // Password
  passwordPattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  passwordMinLength: 8,
  passwordMaxLength: 128,

  // Username
  usernamePattern: /^[a-zA-Z0-9_-]{3,20}$/,
  usernameMinLength: 3,
  usernameMaxLength: 20,

  // URL
  urlPattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\\/\w .-]*)*\/?$/,

  // Age
  minimumAge: 18,
  maximumAge: 150,
};

// ============================================
// SORTING OPTIONS
// ============================================

export const sortingConfig = {
  persons: [
    { value: 'date_observation', label: 'Date du signalement (récent)' },
    { value: 'date_disparition', label: 'Date de disparition' },
    { value: 'relevance', label: 'Pertinence' },
    { value: 'nombreEvidences', label: 'Nombre de preuves' },
  ],

  dossiers: [
    { value: 'date_creation', label: 'Date de création (récent)' },
    { value: 'date_modification', label: 'Date de modification' },
    { value: 'statut', label: 'Statut' },
  ],

  alertes: [
    { value: 'date_creation', label: 'Date de création (récent)' },
    { value: 'priorite', label: 'Priorité' },
    { value: 'rayon', label: 'Rayon de notification' },
  ],
};

// ============================================
// DEFAULT VALUES
// ============================================

export const defaultValues = {
  // Pagination
  pageSize: paginationConfig.defaultPageSize,
  offset: paginationConfig.defaultOffset,

  // Geolocation
  notificationRadiusKm: limitsConfig.defaultNotificationRadiusKm,
  defaultCountry: 'Cameroon',
  defaultLanguage: 'fr',

  // Preferences
  defaultTheme: 'light',
  defaultNotificationType: 'all',
  defaultSortBy: 'date_creation',
  defaultSortOrder: 'desc' as const,
};

// ============================================
// ERROR CODES & MESSAGES
// ============================================

export const errorConfig = {
  codes: {
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT: 'TIMEOUT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  },

  messages: {
    NETWORK_ERROR: 'Une erreur réseau est survenue. Veuillez réessayer.',
    TIMEOUT: 'La requête a expiré. Veuillez réessayer.',
    UNAUTHORIZED: 'Vous devez être connecté pour effectuer cette action.',
    FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires.',
    NOT_FOUND: 'La ressource demandée n\'a pas été trouvée.',
    VALIDATION_ERROR: 'Données invalides. Veuillez vérifier vos entrées.',
    SERVER_ERROR: 'Une erreur serveur s\'est produite. Veuillez réessayer plus tard.',
    UNKNOWN_ERROR: 'Une erreur inconnue s\'est produite.',
  },
};

// ============================================
// SECURITY CONFIG
// ============================================

export const securityConfig = {
  // Session
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  warningTimeout: 25 * 60 * 1000, // 25 minutes

  // CORS
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://retrouvonsles.com',
  ],

  // Rate limiting
  maxLoginAttempts: 5,
  loginAttemptWindow: 15 * 60 * 1000, // 15 minutes
  maxRequestsPerMinute: 60,

  // HTTPS
  enforceHttps: envConfig.NODE_ENV === 'production',
};
