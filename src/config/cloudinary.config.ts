/**
 * =====================================================
 * RETROUVONSLES - Cloudinary Configuration
 * =====================================================
 * Image hosting and transformation service configuration
 */

import { envConfig } from './env.config';

// ============================================
// CLOUDINARY CONFIG INTERFACE
// ============================================

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName: envConfig.REACT_APP_CLOUDINARY_CLOUD_NAME,
  uploadPreset: envConfig.REACT_APP_CLOUDINARY_UPLOAD_PRESET,
  apiKey: envConfig.REACT_APP_CLOUDINARY_API_KEY,
};

// ============================================
// UPLOAD CONFIGURATIONS
// ============================================

export const cloudinaryUploadConfig = {
  // Profile Photos
  profilePhoto: {
    folder: 'retrouvonsles/profiles',
    resource_type: 'auto' as const,
    max_file_size: 5 * 1024 * 1024, // 5MB
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: {
      width: 400,
      height: 400,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },

  // Personne Photos (Missing Person)
  personnePhoto: {
    folder: 'retrouvonsles/personnes',
    resource_type: 'auto' as const,
    max_file_size: 10 * 1024 * 1024, // 10MB
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: {
      width: 600,
      height: 800,
      crop: 'fill',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },

  // Documents
  document: {
    folder: 'retrouvonsles/documents',
    resource_type: 'auto' as const,
    max_file_size: 20 * 1024 * 1024, // 20MB
    allowed_formats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
  },

  // General Upload
  general: {
    folder: 'retrouvonsles/uploads',
    resource_type: 'auto' as const,
    max_file_size: 50 * 1024 * 1024, // 50MB
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf', 'doc', 'docx'],
  },
};

// ============================================
// IMAGE TRANSFORMATIONS
// ============================================

export const cloudinaryTransformations = {
  // Thumbnails
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Cards
  card: {
    width: 300,
    height: 300,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Medium
  medium: {
    width: 500,
    height: 500,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Large
  large: {
    width: 800,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Hero/Banner
  hero: {
    width: 1200,
    height: 400,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Optimized
  optimized: {
    quality: 'auto',
    fetch_format: 'auto',
    dpr: 'auto',
  },
};

// ============================================
// VIDEO TRANSFORMATIONS
// ============================================

export const cloudinaryVideoTransformations = {
  thumbnail: {
    width: 320,
    height: 180,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'jpg',
  },

  preview: {
    width: 640,
    height: 360,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  },
};

// ============================================
// SIGNED URL CONFIGURATION
// ============================================

export const cloudinarySignedUrlConfig = {
  // Expiration time (in seconds)
  expiration: 60 * 60 * 24 * 7, // 7 days

  // Use secure signed URLs
  secure: true,

  // Sign private URLs
  sign_url: true,
};

// ============================================
// UPLOAD WIDGET CONFIGURATION
// ============================================

export const cloudinaryUploadWidgetConfig = {
  cloudName: cloudinaryConfig.cloudName,
  uploadPreset: cloudinaryConfig.uploadPreset,

  // Widget settings
  sources: ['local', 'url', 'camera', 'google_drive'],
  
  resourceType: 'auto',
  
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
  
  maxFileSize: 50 * 1024 * 1024,
  
  multiple: false,
  
  tags: ['retrouvonsles'],
  
  context: {
    app: 'retrouvonsles',
  },
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Check if Cloudinary is properly configured
 */
export const isCloudinaryConfigured = (): boolean => {
  return (
    !!cloudinaryConfig.cloudName &&
    !!cloudinaryConfig.uploadPreset &&
    !!cloudinaryConfig.apiKey
  );
};

/**
 * Get upload configuration for a specific type
 */
export const getUploadConfig = (
  type: keyof typeof cloudinaryUploadConfig = 'general'
) => {
  return cloudinaryUploadConfig[type];
};

/**
 * Build Cloudinary URL with transformations
 */
export const buildCloudinaryUrl = (
  publicId: string,
  transformations?: Record<string, any>
): string => {
  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;

  if (!transformations || Object.keys(transformations).length === 0) {
    return `${baseUrl}/${publicId}`;
  }

  const params = Object.entries(transformations)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `${baseUrl}/${params}/${publicId}`;
};
