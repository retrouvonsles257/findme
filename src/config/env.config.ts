/**
 * =====================================================
 * RETROUVONSLES - Environment Variables Configuration
 * =====================================================
 * Centralized environment variable validation and defaults
 */

// ============================================
// ENVIRONMENT VARIABLES
// ============================================

export interface EnvConfig {
  // Node environment
  NODE_ENV: 'development' | 'production' | 'test';
  DEBUG_MODE: boolean;

  // API
  REACT_APP_API_BASE_URL: string;
  REACT_APP_API_TIMEOUT: number;

  // Supabase
  REACT_APP_SUPABASE_URL: string;
  REACT_APP_SUPABASE_ANON_KEY: string;

  // Firebase
  REACT_APP_FIREBASE_API_KEY: string;
  REACT_APP_FIREBASE_AUTH_DOMAIN: string;
  REACT_APP_FIREBASE_PROJECT_ID: string;
  REACT_APP_FIREBASE_STORAGE_BUCKET: string;
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: string;
  REACT_APP_FIREBASE_APP_ID: string;
  /** Clé Web Push (Firebase Console → Cloud Messaging). Sinon REACT_APP_PUSH_VAPID_PUBLIC_KEY. */
  REACT_APP_FIREBASE_VAPID_KEY: string;
  /** Clé publique VAPID dédiée au fallback Push API natif (paire avec WEB_PUSH_VAPID_PRIVATE_KEY côté Edge). */
  REACT_APP_NATIVE_WEB_PUSH_VAPID_PUBLIC_KEY: string;

  // Cloudinary
  REACT_APP_CLOUDINARY_CLOUD_NAME: string;
  REACT_APP_CLOUDINARY_UPLOAD_PRESET: string;
  REACT_APP_CLOUDINARY_API_KEY: string;

  // Maps - MapTiler (Primary)
  REACT_APP_MAPTILER_API_KEY: string;

  // Maps - Mapbox & Google (Fallback)
  REACT_APP_MAPBOX_ACCESS_TOKEN: string;
  REACT_APP_GOOGLE_MAPS_API_KEY: string;

  // IA/ML - Hugging Face
  REACT_APP_HUGGINGFACE_API_KEY: string;
  REACT_APP_HUGGINGFACE_MODEL_DETECTION: string;
  REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION: string;
  REACT_APP_HUGGINGFACE_MODEL_NLP: string;
  REACT_APP_ML_SERVICE_ENDPOINT: string;

  // Push Notifications
  REACT_APP_PUSH_VAPID_PUBLIC_KEY: string;

  // Analytics
  REACT_APP_ANALYTICS_ID: string;

  // Feature Flags
  ENABLE_FACIAL_RECOGNITION: boolean;
  ENABLE_GEOLOCATION: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_PUSH_NOTIFICATIONS: boolean;
  /**
   * Si true (défaut) : avec un centre GPS, si personne n’est dans le rayon → 0 destinataire (pas de repli « tout le monde »).
   * Si false : repli historique — diffusion à tous les citoyens notifiables quand le rayon est vide.
   */
  ALERTE_DIFFUSION_STRICT_GEO_ONLY: boolean;
  /**
   * Si true : alerte **sans** centre GPS → diffusion à tous les citoyens notifiables (comportement large, à éviter en prod).
   * Si false (défaut) : sans centre → 0 notification (local uniquement).
   */
  ALERTE_ALLOW_BROADCAST_WITHOUT_GEO: boolean;
}

// ============================================
// ENVIRONMENT VALIDATION & DEFAULTS
// ============================================

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;

  if (!value && !defaultValue) {

  }

  return value || '';
};

const getBooleanEnv = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  return value === 'true' || value === '1' || value === 'yes';
};

const getNumberEnv = (key: string, defaultValue: number): number => {
  const value = process.env[key];

  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// ============================================
// CONFIGURATION OBJECT
// ============================================

export const envConfig: EnvConfig = {
  // Node environment
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  DEBUG_MODE: getBooleanEnv('DEBUG_MODE', false),

  // API
  REACT_APP_API_BASE_URL: getEnvVariable(
    'REACT_APP_API_BASE_URL',
    'https://retrouvonsles.te-sea.com'
  ),
  REACT_APP_API_TIMEOUT: getNumberEnv('REACT_APP_API_TIMEOUT', 30000),

  // Supabase
  REACT_APP_SUPABASE_URL: getEnvVariable('REACT_APP_SUPABASE_URL'),
  REACT_APP_SUPABASE_ANON_KEY: getEnvVariable('REACT_APP_SUPABASE_ANON_KEY'),

  // Firebase
  REACT_APP_FIREBASE_API_KEY: getEnvVariable('REACT_APP_FIREBASE_API_KEY'),
  REACT_APP_FIREBASE_AUTH_DOMAIN: getEnvVariable('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  REACT_APP_FIREBASE_PROJECT_ID: getEnvVariable('REACT_APP_FIREBASE_PROJECT_ID'),
  REACT_APP_FIREBASE_STORAGE_BUCKET: getEnvVariable('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  REACT_APP_FIREBASE_MESSAGING_SENDER_ID: getEnvVariable('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  REACT_APP_FIREBASE_APP_ID: getEnvVariable('REACT_APP_FIREBASE_APP_ID'),
  REACT_APP_FIREBASE_VAPID_KEY: getEnvVariable('REACT_APP_FIREBASE_VAPID_KEY'),
  REACT_APP_NATIVE_WEB_PUSH_VAPID_PUBLIC_KEY: getEnvVariable('REACT_APP_NATIVE_WEB_PUSH_VAPID_PUBLIC_KEY'),

  // Cloudinary
  REACT_APP_CLOUDINARY_CLOUD_NAME: getEnvVariable('REACT_APP_CLOUDINARY_CLOUD_NAME'),
  REACT_APP_CLOUDINARY_UPLOAD_PRESET: getEnvVariable('REACT_APP_CLOUDINARY_UPLOAD_PRESET'),
  REACT_APP_CLOUDINARY_API_KEY: getEnvVariable('REACT_APP_CLOUDINARY_API_KEY'),

  // Maps - MapTiler (Primary)
  REACT_APP_MAPTILER_API_KEY: getEnvVariable('REACT_APP_MAPTILER_API_KEY'),

  // Maps - Mapbox & Google (Fallback)
  REACT_APP_MAPBOX_ACCESS_TOKEN: getEnvVariable('REACT_APP_MAPBOX_ACCESS_TOKEN'),
  REACT_APP_GOOGLE_MAPS_API_KEY: getEnvVariable('REACT_APP_GOOGLE_MAPS_API_KEY'),

  // IA/ML - Hugging Face
  REACT_APP_HUGGINGFACE_API_KEY: getEnvVariable('REACT_APP_HUGGINGFACE_API_KEY'),
  REACT_APP_HUGGINGFACE_MODEL_DETECTION: getEnvVariable(
    'REACT_APP_HUGGINGFACE_MODEL_DETECTION',
    'facebook/detr-resnet-50'
  ),
  REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION: getEnvVariable(
    'REACT_APP_HUGGINGFACE_MODEL_CLASSIFICATION',
    'google/vit-base-patch16-224'
  ),
  REACT_APP_HUGGINGFACE_MODEL_NLP: getEnvVariable(
    'REACT_APP_HUGGINGFACE_MODEL_NLP',
    'bert-base-multilingual-cased'
  ),
  REACT_APP_ML_SERVICE_ENDPOINT: getEnvVariable(
    'REACT_APP_ML_SERVICE_ENDPOINT',
    'https://api-inference.huggingface.co/models/'
  ),

  // Push Notifications
  REACT_APP_PUSH_VAPID_PUBLIC_KEY: getEnvVariable('REACT_APP_PUSH_VAPID_PUBLIC_KEY'),

  // Analytics
  REACT_APP_ANALYTICS_ID: getEnvVariable('REACT_APP_ANALYTICS_ID'),

  // Feature Flags
  ENABLE_FACIAL_RECOGNITION: getBooleanEnv('ENABLE_FACIAL_RECOGNITION', true),
  ENABLE_GEOLOCATION: getBooleanEnv('ENABLE_GEOLOCATION', true),
  ENABLE_NOTIFICATIONS: getBooleanEnv('ENABLE_NOTIFICATIONS', true),
  ENABLE_ANALYTICS: getBooleanEnv('ENABLE_ANALYTICS', true),
  ENABLE_PUSH_NOTIFICATIONS: getBooleanEnv('ENABLE_PUSH_NOTIFICATIONS', true),
  ALERTE_DIFFUSION_STRICT_GEO_ONLY: getBooleanEnv('REACT_APP_ALERTE_STRICT_GEO_ONLY', true),
  ALERTE_ALLOW_BROADCAST_WITHOUT_GEO: getBooleanEnv('REACT_APP_ALERTE_ALLOW_BROADCAST_WITHOUT_GEO', false),
};

// ============================================
// UTILITIES
// ============================================

/**
 * Check if all critical environment variables are set
 */
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const requiredVars = [
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY',
    'REACT_APP_API_BASE_URL',
  ];

  requiredVars.forEach((key) => {
    if (!process.env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get all non-sensitive environment variables
 */
export const getPublicEnv = (): Record<string, any> => {
  const publicKeys = [
    'NODE_ENV',
    'DEBUG_MODE',
    'REACT_APP_API_BASE_URL',
    'REACT_APP_API_TIMEOUT',
    'REACT_APP_MAPBOX_ACCESS_TOKEN',
    'REACT_APP_GOOGLE_MAPS_API_KEY',
    'REACT_APP_TENSORFLOW_MODEL_URL',
    'ENABLE_FACIAL_RECOGNITION',
    'ENABLE_GEOLOCATION',
    'ENABLE_NOTIFICATIONS',
    'ENABLE_ANALYTICS',
    'ENABLE_PUSH_NOTIFICATIONS',
  ];

  return publicKeys.reduce((acc, key) => {
    acc[key] = envConfig[key as keyof EnvConfig];
    return acc;
  }, {} as Record<string, any>);
};
