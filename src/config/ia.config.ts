/**
 * =====================================================
 * RETROUVONSLES - AI/ML Model Configuration
 * =====================================================
 * Machine learning, facial recognition, and AI service configuration
 */

import { envConfig } from './env.config';

// ============================================
// AI/ML MODELS CONFIGURATION
// ============================================

export const aiModelsConfig = {
  // Facial Recognition Model
  facialRecognition: {
    enabled: envConfig.ENABLE_FACIAL_RECOGNITION,
    provider: 'tensorflow' as const, // 'tensorflow' | 'opencv' | 'aws-rekognition'
    modelName: 'face-api.js',
    confidence: 0.6,
    maxFaces: 10,
  },

  // Person Matching Model
  personMatching: {
    enabled: true,
    provider: 'custom' as const,
    algorithm: 'siamese-networks' as const,
    similarityThreshold: 0.75,
    weights: {
      facialFeatures: 0.4,
      physicalCharacteristics: 0.3,
      metadata: 0.3,
    },
  },

  // Image Classification
  imageClassification: {
    enabled: true,
    provider: 'tensorflow' as const,
    model: 'MobileNetV2',
    confidence: 0.7,
  },

  // Object Detection
  objectDetection: {
    enabled: true,
    provider: 'tensorflow' as const,
    model: 'COCO-SSD',
    confidence: 0.5,
    maxDetections: 20,
  },

  // Text Analysis (NLP)
  textAnalysis: {
    enabled: true,
    provider: 'transformers' as const,
    model: 'distilbert-base-uncased-finetuned-sst-2-english',
    languages: ['en', 'fr'],
  },

  // Clustering & Analysis
  clustering: {
    enabled: true,
    algorithm: 'kmeans' as const,
    maxClusters: 10,
    minSimilarity: 0.6,
  },
};

// ============================================
// ML SERVICE ENDPOINT CONFIGURATION
// ============================================

export const mlServiceConfig = {
  baseUrl: envConfig.REACT_APP_ML_SERVICE_ENDPOINT,
  timeout: 60000, // 60 seconds for heavy processing
  retries: 3,
  retryDelay: 1000,

  // Service endpoints
  endpoints: {
    facialRecognition: '/analyze/facial-recognition',
    personMatching: '/search/person-matching',
    imageClassification: '/analyze/image-classification',
    objectDetection: '/analyze/object-detection',
    textAnalysis: '/analyze/text',
    clustering: '/analyze/clustering',
  },

  // Authentication
  auth: {
    enabled: true,
    type: 'bearer' as const,
    tokenHeader: 'Authorization',
  },

  // Caching
  caching: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// ============================================
// FACIAL RECOGNITION CONFIGURATION
// ============================================

export const facialRecognitionConfig = {
  // Model settings
  model: {
    confidence: 0.6,
    scoreThreshold: 0.5,
  },

  // Detection settings
  detection: {
    maxFaces: 10,
    minFaceSize: 20, // pixels
    returnAllFaces: true,
  },

  // Landmarks detection
  landmarks: {
    enabled: true,
    points: 68, // 68-point facial landmarks
  },

  // Face expression
  expressions: {
    enabled: true,
    types: ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'],
  },

  // Age and gender
  ageGender: {
    enabled: true,
    precision: 'low' as const, // 'low' | 'medium' | 'high'
  },

  // Distance metric
  distanceMetric: 'euclidean' as const, // 'euclidean' | 'manhattan' | 'cosine'
};

// ============================================
// SIMILARITY & MATCHING CONFIGURATION
// ============================================

export const similarityConfig = {
  // Facial feature matching
  facial: {
    threshold: 0.75,
    weights: {
      faceDescriptor: 0.5,
      landmarks: 0.25,
      expressions: 0.25,
    },
  },

  // Physical characteristics matching
  physical: {
    threshold: 0.7,
    weights: {
      age: 0.2,
      height: 0.2,
      bodyType: 0.2,
      skinColor: 0.2,
      hairType: 0.2,
    },
  },

  // Document matching
  document: {
    threshold: 0.8,
    weights: {
      faceMatch: 0.6,
      documentQuality: 0.4,
    },
  },

  // Overall matching score
  combined: {
    threshold: 0.75,
    weights: {
      facial: 0.5,
      physical: 0.3,
      metadata: 0.2,
    },
  },
};

// ============================================
// IMAGE PROCESSING CONFIGURATION
// ============================================

export const imageProcessingConfig = {
  // Preprocessing
  preprocessing: {
    normalization: true,
    claheEnabled: true, // Contrast Limited Adaptive Histogram Equalization
    resizeToSquare: true,
    targetSize: 224, // pixels
  },

  // Enhancement
  enhancement: {
    brightness: true,
    contrast: true,
    sharpening: true,
  },

  // Quality assessment
  qualityAssessment: {
    enabled: true,
    minQuality: 0.6,
    checkBlur: true,
    checkIllumination: true,
    checkFaceSize: true,
  },

  // Face alignment
  faceAlignment: {
    enabled: true,
    alignmentType: '5point' as const, // '5point' | '68point' | 'affine'
  },
};

// ============================================
// BATCH PROCESSING CONFIGURATION
// ============================================

export const batchProcessingConfig = {
  enabled: true,

  // Batch settings
  batchSize: 10,
  maxBatchSize: 100,
  processingTimeout: 300000, // 5 minutes

  // Parallel processing
  parallel: true,
  maxConcurrentJobs: 5,

  // Queue management
  queue: {
    maxQueueSize: 1000,
    priority: true,
  },

  // Results storage
  storage: {
    enabled: true,
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

// ============================================
// CACHING CONFIGURATION
// ============================================

export const aiCachingConfig = {
  // Cache settings
  enabled: true,
  ttl: 24 * 60 * 60 * 1000, // 24 hours
  maxCacheSize: 1000, // max entries

  // Cache types
  types: {
    modelCache: true,
    resultCache: true,
    featureCache: true,
  },

  // Storage
  storage: 'indexeddb' as const, // 'memory' | 'indexeddb' | 'localstorage'
};

// ============================================
// MONITORING & LOGGING
// ============================================

export const aiMonitoringConfig = {
  // Performance monitoring
  performanceMonitoring: {
    enabled: envConfig.DEBUG_MODE,
    trackInferenceTime: true,
    trackMemoryUsage: true,
  },

  // Error handling
  errorHandling: {
    logErrors: true,
    trackFailures: true,
    retryOnFailure: true,
    maxRetries: 3,
  },

  // Metrics
  metrics: {
    trackAccuracy: true,
    trackConfidence: true,
    trackProcessingTime: true,
  },
};

// ============================================
// PRIVACY & SECURITY
// ============================================

export const aiPrivacyConfig = {
  // Data retention
  dataRetention: {
    images: 24 * 60 * 60 * 1000, // 24 hours
    features: 7 * 24 * 60 * 60 * 1000, // 7 days
    logs: 30 * 24 * 60 * 60 * 1000, // 30 days
  },

  // Encryption
  encryption: {
    enabled: envConfig.NODE_ENV === 'production',
    algorithm: 'AES-256-GCM',
  },

  // Data anonymization
  anonymization: {
    enabled: true,
    removeIdentifiers: true,
    blurFaces: true,
  },

  // GDPR Compliance
  gdpr: {
    rightToBeForGotten: true,
    dataMinimization: true,
    purposeLimitation: true,
    storageMinimization: true,
  },
};

// ============================================
// FEATURE FLAGS
// ============================================

export const aiFeatureFlags = {
  // Core features
  facialRecognition: envConfig.ENABLE_FACIAL_RECOGNITION,
  personMatching: true,
  imageAnalysis: true,
  textAnalysis: true,

  // Advanced features
  advancedMatching: false,
  dnaMatching: false,
  videoAnalysis: false,
  realTimeProcessing: false,

  // Batch operations
  batchProcessing: true,
  bulkAnalysis: true,

  // Caching
  enableCaching: true,
  enableOptimization: true,
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if AI service is properly configured
 */
export const isAIServiceConfigured = (): boolean => {
  return !!mlServiceConfig.baseUrl;
};

/**
 * Check if a specific AI feature is enabled
 */
export const isAIFeatureEnabled = (feature: keyof typeof aiFeatureFlags): boolean => {
  return aiFeatureFlags[feature];
};

/**
 * Get model configuration by name
 */
export const getModelConfig = (modelName: keyof typeof aiModelsConfig) => {
  return aiModelsConfig[modelName];
};
