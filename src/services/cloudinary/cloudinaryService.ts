/**
 * =====================================================
 * RETROUVONSLES - Cloudinary Main Service
 * =====================================================
 * Main service integrating all Cloudinary functionality
 */

import {
  cloudinaryConfig,
  isCloudinaryConfigured,
  getUploadConfig,
  validateFile,
  formatFileSize,
  getFileIcon,
  UPLOAD_CONFIGS,
} from './cloudinaryConfig';

import {
  uploadFileToCloudinary,
  uploadMultipleFiles,
  uploadFromUrl,
  uploadWithRetry,
  UploadOptions,
  UploadResult,
  UploadProgress,
} from './cloudinaryUpload';

import {
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
  cropToFace,
  addBorder,
  addWatermark,
  createImageVariants,
  type CloudinaryTransformation,
} from './cloudinaryTransform';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CloudinaryServiceConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey: string;
}

export interface FileUploadSession {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadType: keyof typeof UPLOAD_CONFIGS;
  status: 'pending' | 'uploading' | 'success' | 'failed';
  progress: number;
  uploadedAt?: Date;
  publicId?: string;
  url?: string;
  error?: string;
}

// ============================================
// CLOUDINARY SERVICE CLASS
// ============================================

class CloudinaryService {
  private uploadSessions: Map<string, FileUploadSession> = new Map();

  /**
   * Initialize service
   */
  initialize(): boolean {
    if (!isCloudinaryConfigured()) {
      console.error('Cloudinary is not properly configured');
      return false;
    }
    return true;
  }

  /**
   * Check if service is configured
   */
  isConfigured(): boolean {
    return isCloudinaryConfigured();
  }

  /**
   * Get current configuration
   */
  getConfig(): CloudinaryServiceConfig {
    return cloudinaryConfig;
  }

  // ============================================
  // UPLOAD METHODS
  // ============================================

  /**
   * Upload single file
   */
  async uploadFile(
    file: File,
    uploadType: keyof typeof UPLOAD_CONFIGS = 'general',
    options?: Partial<UploadOptions>,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const sessionId = this.createUploadSession(file, uploadType);

    try {
      const result = await uploadFileToCloudinary(
        file,
        { type: uploadType, ...options },
        (progress) => {
          this.updateUploadProgress(sessionId, progress);
          if (onProgress) onProgress(progress);
        }
      );

      if (result.success) {
        this.completeUploadSession(sessionId, result);
      } else {
        this.failUploadSession(sessionId, result.error);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.failUploadSession(sessionId, errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    uploadType: keyof typeof UPLOAD_CONFIGS = 'general',
    options?: Partial<UploadOptions>,
    onProgress?: (progress: { fileIndex: number; progress: UploadProgress }) => void
  ): Promise<UploadResult[]> {
    return uploadMultipleFiles(
      files,
      { type: uploadType, ...options },
      onProgress
    );
  }

  /**
   * Upload with retry logic
   */
  async uploadWithRetry(
    file: File,
    uploadType: keyof typeof UPLOAD_CONFIGS = 'general',
    options?: Partial<UploadOptions>,
    maxRetries: number = 3,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    return uploadWithRetry(
      file,
      { type: uploadType, ...options },
      maxRetries,
      onProgress
    );
  }

  /**
   * Upload from URL
   */
  async uploadFromUrl(
    url: string,
    uploadType: keyof typeof UPLOAD_CONFIGS = 'general',
    options?: Partial<UploadOptions>
  ): Promise<UploadResult> {
    return uploadFromUrl(url, { type: uploadType, ...options });
  }

  // ============================================
  // VALIDATION METHODS
  // ============================================

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    uploadType: keyof typeof UPLOAD_CONFIGS = 'general'
  ): { valid: boolean; error?: string } {
    return validateFile(file, uploadType);
  }

  /**
   * Get upload limits for type
   */
  getUploadLimits(uploadType: keyof typeof UPLOAD_CONFIGS = 'general'): {
    maxFileSize: number;
    maxFileSizeFormatted: string;
    allowedFormats: string[];
  } {
    const config = getUploadConfig(uploadType);
    return {
      maxFileSize: config.maxFileSize,
      maxFileSizeFormatted: formatFileSize(config.maxFileSize),
      allowedFormats: config.allowedFormats,
    };
  }

  // ============================================
  // TRANSFORMATION METHODS
  // ============================================

  /**
   * Transform image with custom options
   */
  transformImage(publicId: string, transformations: CloudinaryTransformation) {
    return transformImage(publicId, transformations);
  }

  /**
   * Apply transformation preset
   */
  applyPreset(publicId: string, preset: string) {
    return applyPreset(publicId, preset as any);
  }

  /**
   * Resize image
   */
  resize(publicId: string, width: number, height: number) {
    return resize(publicId, width, height);
  }

  /**
   * Create thumbnail
   */
  thumbnail(publicId: string, size?: number) {
    return thumbnail(publicId, size);
  }

  /**
   * Create avatar
   */
  avatar(publicId: string, size?: number) {
    return avatar(publicId, size);
  }

  /**
   * Create responsive srcset
   */
  createSrcSet(publicId: string, maxWidth?: number, sizes?: number[]) {
    return createSrcSet(publicId, maxWidth, sizes);
  }

  /**
   * Get responsive URLs
   */
  getResponsiveUrls(publicId: string) {
    return getResponsiveUrls(publicId);
  }

  /**
   * Optimize image for web
   */
  optimizeForWeb(publicId: string, width?: number, height?: number) {
    return optimizeForWeb(publicId, width, height);
  }

  /**
   * Convert image format
   */
  convertFormat(
    publicId: string,
    format: 'jpg' | 'png' | 'webp' | 'gif',
    quality?: 'auto' | 'best' | 'good' | 'eco' | 'low' | number
  ) {
    return convertFormat(publicId, format, quality);
  }

  /**
   * Apply effect
   */
  applyEffect(
    publicId: string,
    effect: 'grayscale' | 'sepia' | 'blur' | 'pixelate' | 'oil_paint' | 'cartoonify',
    intensity?: number
  ) {
    return applyEffect(publicId, effect, intensity);
  }

  /**
   * Blur for privacy
   */
  blurForPrivacy(publicId: string, intensity?: number) {
    return blurForPrivacy(publicId, intensity);
  }

  /**
   * Pixelate for privacy
   */
  pixelateForPrivacy(publicId: string) {
    return pixelateForPrivacy(publicId);
  }

  /**
   * Crop to face
   */
  cropToFace(publicId: string, width?: number, height?: number) {
    return cropToFace(publicId, width, height);
  }

  /**
   * Add border
   */
  addBorder(publicId: string, width?: number, color?: string, radius?: number) {
    return addBorder(publicId, width, color, radius);
  }

  /**
   * Add watermark
   */
  addWatermark(
    publicId: string,
    watermarkPublicId: string,
    gravity?: string,
    opacity?: number
  ) {
    return addWatermark(publicId, watermarkPublicId, gravity as any, opacity);
  }

  /**
   * Create image variants
   */
  createImageVariants(publicId: string, baseWidth?: number, baseHeight?: number) {
    return createImageVariants(publicId, baseWidth, baseHeight);
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  /**
   * Get file icon
   */
  getFileIcon(fileName: string): string {
    return getFileIcon(fileName);
  }

  /**
   * Get upload session status
   */
  getSessionStatus(sessionId: string): FileUploadSession | undefined {
    return this.uploadSessions.get(sessionId);
  }

  /**
   * Get all upload sessions
   */
  getAllSessions(): FileUploadSession[] {
    return Array.from(this.uploadSessions.values());
  }

  /**
   * Clear upload session
   */
  clearSession(sessionId: string): boolean {
    return this.uploadSessions.delete(sessionId);
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.uploadSessions.clear();
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Create upload session
   */
  private createUploadSession(
    file: File,
    uploadType: keyof typeof UPLOAD_CONFIGS
  ): string {
    const sessionId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: FileUploadSession = {
      id: sessionId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadType,
      status: 'pending',
      progress: 0,
    };

    this.uploadSessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Update upload progress
   */
  private updateUploadProgress(sessionId: string, progress: UploadProgress): void {
    const session = this.uploadSessions.get(sessionId);
    if (session) {
      session.status = 'uploading';
      session.progress = Math.round(progress.percentage);
      this.uploadSessions.set(sessionId, session);
    }
  }

  /**
   * Complete upload session
   */
  private completeUploadSession(sessionId: string, result: UploadResult): void {
    const session = this.uploadSessions.get(sessionId);
    if (session) {
      session.status = 'success';
      session.progress = 100;
      session.uploadedAt = new Date();
      session.publicId = result.publicId;
      session.url = result.secureUrl;
      this.uploadSessions.set(sessionId, session);
    }
  }

  /**
   * Fail upload session
   */
  private failUploadSession(sessionId: string, error?: string): void {
    const session = this.uploadSessions.get(sessionId);
    if (session) {
      session.status = 'failed';
      session.error = error;
      this.uploadSessions.set(sessionId, session);
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const cloudinaryService = new CloudinaryService();

// Initialize on module load
cloudinaryService.initialize();

// ============================================
// EXPORTS
// ============================================

export type { CloudinaryTransformation };
export default cloudinaryService;
