/**
 * =====================================================
 * RETROUVONSLES - Cloudinary Services Index
 * =====================================================
 * Centralized exports for all Cloudinary functionality
 */

// ============================================
// CONFIGURATION EXPORTS
// ============================================

export {
  cloudinaryConfig,
  isCloudinaryConfigured,
  getUploadConfig,
  getTransformationPreset,
  validateFile,
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
} from './cloudinaryConfig';

// ============================================
// UPLOAD SERVICE EXPORTS
// ============================================

export {
  uploadFileToCloudinary,
  uploadMultipleFiles,
  uploadBlob,
  uploadFromUrl,
  uploadWithTransformation,
  uploadWithRetry,
  getUploadUrl,
  type UploadOptions,
  type UploadProgress,
  type UploadResult,
} from './cloudinaryUpload';

// ============================================
// TRANSFORMATION SERVICE EXPORTS
// ============================================

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
} from './cloudinaryTransform';

// ============================================
// MAIN SERVICE EXPORTS
// ============================================

export {
  cloudinaryService,
  type CloudinaryServiceConfig,
  type FileUploadSession,
} from './cloudinaryService';

// ============================================
// DEFAULT EXPORT
// ============================================

export { default } from './cloudinaryService';
