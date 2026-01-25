/**
 * =====================================================
 * RETROUVONSLES - Cloudinary Configuration Service
 * =====================================================
 * Comprehensive Cloudinary configuration and helpers
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

export interface UploadConfig {
  folder: string;
  resource_type: 'image' | 'video' | 'raw' | 'auto';
  maxFileSize: number;
  allowedFormats: string[];
  transformation?: CloudinaryTransformation;
}

export interface CloudinaryTransformation {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'pad' | 'crop' | 'scale' | 'limit';
  gravity?: 'center' | 'face' | 'auto' | 'north' | 'south' | 'east' | 'west' | 'north_west' | 'north_east' | 'south_west' | 'south_east';
  quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' | number;
  fetch_format?: 'auto' | 'jpg' | 'png' | 'webp' | 'gif';
  radius?: number | string;
  background?: string;
  angle?: number;
  overlay?: string;
  underlay?: string;
  opacity?: number;
  default_image?: string;
  delay?: number;
  density?: number;
  page?: number;
  flags?: string;
  dpr?: 'auto' | number;
  aspect_ratio?: string;
  x?: number;
  y?: number;
  zoom?: number;
  effect?: string;
  border?: string;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  blur?: number | string;
}

export interface UploadResponse {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  original_filename: string;
}

export interface DeleteResponse {
  result: 'ok' | 'not_found';
}

export interface TransformationResult {
  url: string;
  secureUrl: string;
  publicId: string;
}

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================

const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '';
const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';
const apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY || '';

export const cloudinaryConfig: CloudinaryConfig = {
  cloudName,
  uploadPreset,
  apiKey,
};

// ============================================
// UPLOAD CONFIGURATIONS BY TYPE
// ============================================

export const UPLOAD_CONFIGS: Record<string, UploadConfig> = {
  // Profile Photos
  profilePhoto: {
    folder: 'retrouvonsles/profiles',
    resource_type: 'auto',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
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
    resource_type: 'auto',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: {
      width: 600,
      height: 800,
      crop: 'fit',
      quality: 'auto',
      fetch_format: 'auto',
    },
  },

  // Documents
  document: {
    folder: 'retrouvonsles/documents',
    resource_type: 'auto',
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedFormats: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'],
  },

  // Dossier Attachments
  dossierAttachment: {
    folder: 'retrouvonsles/dossiers',
    resource_type: 'auto',
    maxFileSize: 15 * 1024 * 1024, // 15MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    transformation: {
      quality: 'auto',
    },
  },

  // Signalement Attachments
  signalementAttachment: {
    folder: 'retrouvonsles/signalements',
    resource_type: 'auto',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    transformation: {
      quality: 'auto',
    },
  },

  // IA Analysis Images
  iaAnalysis: {
    folder: 'retrouvonsles/ia-analysis',
    resource_type: 'auto',
    maxFileSize: 25 * 1024 * 1024, // 25MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: {
      quality: 'auto',
      fetch_format: 'auto',
    },
  },

  // Video Uploads
  video: {
    folder: 'retrouvonsles/videos',
    resource_type: 'video',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFormats: ['mp4', 'avi', 'mov', 'wmv', 'webm'],
    transformation: {
      width: 1280,
      height: 720,
      quality: 'auto',
    },
  },

  // General/Default
  general: {
    folder: 'retrouvonsles/general',
    resource_type: 'auto',
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  },
};

// ============================================
// TRANSFORMATION PRESETS
// ============================================

export const TRANSFORMATION_PRESETS: Record<string, CloudinaryTransformation> = {
  // Thumbnail (small, fast loading)
  thumbnail: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Medium (card display)
  medium: {
    width: 400,
    height: 300,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Large (full display)
  large: {
    width: 800,
    height: 600,
    crop: 'fit',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Avatar (profile pictures)
  avatar: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    radius: 'max',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Hero (large banner)
  hero: {
    width: 1920,
    height: 1080,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Square (social media)
  square: {
    width: 500,
    height: 500,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Portrait (vertical)
  portrait: {
    width: 400,
    height: 600,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Landscape (horizontal)
  landscape: {
    width: 800,
    height: 450,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Grayscale (B&W)
  grayscale: {
    effect: 'grayscale',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Sepia (vintage)
  sepia: {
    effect: 'sepia',
    quality: 'auto',
    fetch_format: 'auto',
  },

  // Blur (privacy)
  blur: {
    effect: 'blur:300',
    quality: 'auto',
  },

  // Pixelate (privacy)
  pixelate: {
    effect: 'pixelate',
    quality: 'auto',
  },
};

// ============================================
// SIGNED URL CONFIGURATION
// ============================================

export const SIGNED_URL_CONFIG = {
  expiration: 60 * 60 * 24 * 7, // 7 days
  secure: true,
  sign_url: true,
};

// ============================================
// UPLOAD WIDGET CONFIGURATION
// ============================================

export const UPLOAD_WIDGET_CONFIG = {
  cloudName: cloudinaryConfig.cloudName,
  uploadPreset: cloudinaryConfig.uploadPreset,
  sources: ['local', 'url', 'camera', 'google_drive'],
  resourceType: 'auto',
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'mp4'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxFiles: 10,
  multiple: true,
  showAdvancedOptions: false,
  cropping: true,
  croppingAspectRatio: 4 / 3,
  showCompletedButton: true,
  tags: ['retrouvonsles'],
  context: {
    app: 'retrouvonsles',
  },
  folder: 'retrouvonsles',
};

// ============================================
// VALIDATION & HELPER FUNCTIONS
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
export const getUploadConfig = (type: keyof typeof UPLOAD_CONFIGS = 'general'): UploadConfig => {
  return UPLOAD_CONFIGS[type] || UPLOAD_CONFIGS.general;
};

/**
 * Get transformation preset by name
 */
export const getTransformationPreset = (
  preset: keyof typeof TRANSFORMATION_PRESETS
): CloudinaryTransformation => {
  return TRANSFORMATION_PRESETS[preset];
};

/**
 * Check if file type is allowed
 */
export const isFileTypeAllowed = (
  file: File,
  type: keyof typeof UPLOAD_CONFIGS = 'general'
): boolean => {
  const config = getUploadConfig(type);
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  return config.allowedFormats.includes(fileExtension);
};

/**
 * Check if file size is within limits
 */
export const isFileSizeValid = (
  file: File,
  type: keyof typeof UPLOAD_CONFIGS = 'general'
): boolean => {
  const config = getUploadConfig(type);
  return file.size <= config.maxFileSize;
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  type: keyof typeof UPLOAD_CONFIGS = 'general'
): { valid: boolean; error?: string } => {
  const config = getUploadConfig(type);

  // Check file size
  if (file.size > config.maxFileSize) {
    const maxSizeMB = config.maxFileSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!config.allowedFormats.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type .${fileExtension} is not allowed. Allowed types: ${config.allowedFormats.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Get file icon based on type
 */
export const getFileIcon = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const iconMap: Record<string, string> = {
    // Images
    jpg: '🖼️',
    jpeg: '🖼️',
    png: '🖼️',
    webp: '🖼️',
    gif: '🎬',

    // Documents
    pdf: '📄',
    doc: '📝',
    docx: '📝',
    xls: '📊',
    xlsx: '📊',
    ppt: '🎯',
    pptx: '🎯',

    // Video
    mp4: '🎥',
    avi: '🎥',
    mov: '🎥',
    wmv: '🎥',
    webm: '🎥',

    // Audio
    mp3: '🎵',
    wav: '🎵',
    aac: '🎵',

    // Default
    default: '📎',
  };

  return iconMap[extension] || iconMap.default;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Build Cloudinary URL with transformations
 */
export const buildCloudinaryUrl = (
  publicId: string,
  transformations?: CloudinaryTransformation | null
): string => {
  if (!cloudinaryConfig.cloudName) {
    console.warn('Cloudinary cloud name is not configured');
    return '';
  }

  const baseUrl = `https://res.cloudinary.com/${cloudinaryConfig.cloudName}/image/upload`;

  if (!transformations || Object.keys(transformations).length === 0) {
    return `${baseUrl}/${publicId}`;
  }

  // Build transformation string
  const transformationParts: string[] = [];

  Object.entries(transformations).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    if (typeof value === 'boolean') {
      transformationParts.push(`${key}_${value ? 'true' : 'false'}`);
    } else {
      transformationParts.push(`${key}_${value}`);
    }
  });

  const transformationString = transformationParts.join(',');

  return `${baseUrl}/${transformationString}/${publicId}`;
};

/**
 * Build transformation string for API calls
 */
export const buildTransformationString = (transformation: CloudinaryTransformation): string => {
  const parts: string[] = [];

  Object.entries(transformation).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    parts.push(`${key}_${value}`);
  });

  return parts.join(',');
};

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicId = (url: string): string => {
  // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}
  const match = url.match(/\/upload\/(.+?)(?:\.\w+)?$/);
  return match ? match[1] : '';
};

/**
 * Get resource type from MIME type
 */
export const getResourceType = (mimeType: string): 'image' | 'video' | 'raw' | 'auto' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'auto';
};
