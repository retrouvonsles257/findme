/**
 * =====================================================
 * RETROUVONSLES - Storage Helper Functions
 * =====================================================
 * 
 * Fonctions utilitaires pour gestion du stockage
 * Compression, validation, gestion de fichiers
 */

import { StorageService, STORAGE_BUCKETS, UploadedFile } from './storage';
import { UUID } from '../../@types/database.types';

// ============================================
// TYPES
// ============================================

export interface ImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate file size
 */
export function validateFileSize(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB default
): boolean {
  return file.size <= maxSizeBytes;
}

/**
 * Validate file MIME type
 */
export function validateFileMimeType(
  file: File,
  allowedTypes: string[] = []
): boolean {
  if (allowedTypes.length === 0) return true;
  return allowedTypes.includes(file.type);
}

/**
 * Validate file extension
 */
export function validateFileExtension(
  file: File,
  allowedExtensions: string[] = []
): boolean {
  if (allowedExtensions.length === 0) return true;
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

/**
 * Validate file with options
 */
export function validateFile(
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } {
  const maxSize = options.maxSizeBytes || 10 * 1024 * 1024;
  const mimeTypes = options.allowedMimeTypes || [];
  const extensions = options.allowedExtensions || [];

  if (!validateFileSize(file, maxSize)) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / 1024 / 1024}MB limit`,
    };
  }

  if (mimeTypes.length > 0 && !validateFileMimeType(file, mimeTypes)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed: ${mimeTypes.join(', ')}`,
    };
  }

  if (extensions.length > 0 && !validateFileExtension(file, extensions)) {
    return {
      valid: false,
      error: `File extension not allowed. Allowed: ${extensions.join(', ')}`,
    };
  }

  return { valid: true };
}

// ============================================
// IMAGE HELPERS
// ============================================

/**
 * Compress image
 */
export async function compressImage(
  file: File,
  options: ImageOptions = {}
): Promise<Blob> {
  const quality = options.quality || 0.8;
  const format = options.format || 'jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if needed
        if (options.maxWidth && width > options.maxWidth) {
          const ratio = options.maxWidth / width;
          width = options.maxWidth;
          height = Math.round(height * ratio);
        }

        if (options.maxHeight && height > options.maxHeight) {
          const ratio = options.maxHeight / height;
          height = options.maxHeight;
          width = Math.round(width * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to blob conversion failed'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Image load failed'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('File read failed'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Get image dimensions
 */
export async function getImageDimensions(file: File): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = event => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Image load failed'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('File read failed'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Create thumbnail
 */
export async function createThumbnail(
  file: File,
  size: number = 256
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg',
  });
}

// ============================================
// FILE UPLOAD HELPERS
// ============================================

/**
 * Upload user photo
 */
export async function uploadUserPhoto(
  userId: UUID,
  file: File
): Promise<{ avatar: UploadedFile; thumbnail: UploadedFile } | null> {
  const storageService = StorageService.getInstance();

  // Validate
  const validation = validateFile(file, {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (!validation.valid) {
    console.error('[Storage Helper] Photo validation failed:', validation.error);
    return null;
  }

  try {
    // Compress main image
    const compressed = await compressImage(file, {
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.85,
    });

    // Create thumbnail
    const thumbnail = await createThumbnail(file);

    // Upload both
    const mainResult = await storageService.uploadUserFile(
      STORAGE_BUCKETS.PROFILS,
      userId,
      compressed,
      { contentType: 'image/jpeg' }
    );

    const thumbResult = await storageService.uploadUserFile(
      STORAGE_BUCKETS.PROFILS,
      userId,
      thumbnail,
      { contentType: 'image/jpeg' }
    );

    if (mainResult.data && thumbResult.data) {
      return {
        avatar: mainResult.data,
        thumbnail: thumbResult.data,
      };
    }

    return null;
  } catch (error) {
    console.error('[Storage Helper] Photo upload failed:', error);
    return null;
  }
}

/**
 * Upload document
 */
export async function uploadDocument(
  userId: UUID,
  file: File,
  type: 'identification' | 'accreditation' | 'other' = 'other'
): Promise<UploadedFile | null> {
  const storageService = StorageService.getInstance();

  // Validate
  const validation = validateFile(file, {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  });

  if (!validation.valid) {
    console.error('[Storage Helper] Document validation failed:', validation.error);
    return null;
  }

  try {
    const result = await storageService.uploadUserFile(
      STORAGE_BUCKETS.DOCUMENTS,
      userId,
      file
    );

    return result.data || null;
  } catch (error) {
    console.error('[Storage Helper] Document upload failed:', error);
    return null;
  }
}

/**
 * Upload evidence file
 */
export async function uploadEvidence(
  userId: UUID,
  file: File
): Promise<UploadedFile | null> {
  const storageService = StorageService.getInstance();

  // Validate - allow various media types
  const validation = validateFile(file, {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB for video/large files
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
    ],
  });

  if (!validation.valid) {
    console.error('[Storage Helper] Evidence validation failed:', validation.error);
    return null;
  }

  try {
    const result = await storageService.uploadUserFile(
      STORAGE_BUCKETS.PREUVES,
      userId,
      file
    );

    return result.data || null;
  } catch (error) {
    console.error('[Storage Helper] Evidence upload failed:', error);
    return null;
  }
}

// ============================================
// FILE PATH HELPERS
// ============================================

/**
 * Generate user folder path
 */
export function generateUserPath(userId: UUID, subfolder?: string): string {
  if (subfolder) {
    return `${userId}/${subfolder}`;
  }
  return userId;
}

/**
 * Generate timestamped filename
 */
export function generateTimestampedFilename(originalName: string): string {
  const timestamp = Date.now();
  const ext = originalName.split('.').pop();
  const name = originalName.substring(0, originalName.lastIndexOf('.'));
  return `${name}_${timestamp}.${ext}`;
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Get file name without extension
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot === -1 ? fileName : fileName.substring(0, lastDot);
}

// ============================================
// PUBLIC URL HELPERS
// ============================================

/**
 * Build storage URL
 */
export function buildStorageUrl(bucket: string, path: string): string {
  return `/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Get public URL for user photo
 */
export function getUserPhotoUrl(userId: UUID, fileName: string): string {
  return buildStorageUrl(STORAGE_BUCKETS.PROFILS, `${userId}/${fileName}`);
}

/**
 * Get public URL for document
 */
export function getDocumentUrl(userId: UUID, fileName: string): string {
  return buildStorageUrl(STORAGE_BUCKETS.DOCUMENTS, `${userId}/${fileName}`);
}

/**
 * Get public URL for evidence
 */
export function getEvidenceUrl(userId: UUID, fileName: string): string {
  return buildStorageUrl(STORAGE_BUCKETS.PREUVES, `${userId}/${fileName}`);
}

const storageHelpersExport = {
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
};

export default storageHelpersExport;
