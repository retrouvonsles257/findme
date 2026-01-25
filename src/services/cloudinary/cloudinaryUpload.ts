/**
 * =====================================================
 * RETROUVONSLES - Cloudinary Upload Service
 * =====================================================
 * Handle file uploads to Cloudinary
 */

import {
  cloudinaryConfig,
  UploadResponse,
  validateFile,
  UPLOAD_CONFIGS,
} from './cloudinaryConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface UploadOptions {
  type?: keyof typeof UPLOAD_CONFIGS;
  tags?: string[];
  context?: Record<string, string>;
  publicId?: string;
  overwrite?: boolean;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export interface UploadProgress {
  percentage: number;
  loaded: number;
  total: number;
}

export interface UploadResult {
  success: boolean;
  data?: UploadResponse;
  error?: string;
  publicId?: string;
  url?: string;
  secureUrl?: string;
}

// ============================================
// UPLOAD SERVICE
// ============================================

/**
 * Upload file to Cloudinary using unsigned upload
 */
export const uploadFileToCloudinary = async (
  file: File,
  options: UploadOptions = {},
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, options.type || 'general');
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Check if Cloudinary is configured
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      return {
        success: false,
        error: 'Cloudinary is not properly configured',
      };
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    // Add folder from config - use 'general' as fallback if type doesn't exist
    const config = UPLOAD_CONFIGS[options.type || 'general'] || UPLOAD_CONFIGS['general'];
    if (config && config.folder) {
      formData.append('folder', config.folder);
    }

    // Add tags
    const tags = ['retrouvonsles', options.type || 'general', ...( options.tags || [])];
    formData.append('tags', tags.join(','));

    // Add context
    const context = {
      app: 'retrouvonsles',
      timestamp: new Date().toISOString(),
      ...( options.context || {}),
    };
    formData.append(
      'context',
      Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join('|')
    );

    // Add public ID if specified
    if (options.publicId) {
      formData.append('public_id', options.publicId);
    }

    // Add overwrite flag
    if (options.overwrite) {
      formData.append('overwrite', 'true');
    }

    // Upload to Cloudinary
    const xhr = new XMLHttpRequest();

    // Track progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress({
            percentage: percentComplete,
            loaded: event.loaded,
            total: event.total,
          });
        }
      });
    }

    return new Promise((resolve) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: UploadResponse = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            data: response,
            publicId: response.public_id,
            url: response.url,
            secureUrl: response.secure_url,
          });
        } else {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload was cancelled',
        });
      });

      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;
      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Upload multiple files to Cloudinary
 */
export const uploadMultipleFiles = async (
  files: File[],
  options: UploadOptions = {},
  onProgress?: (progress: { fileIndex: number; progress: UploadProgress }) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadFileToCloudinary(files[i], options, (progress) => {
      if (onProgress) {
        onProgress({
          fileIndex: i,
          progress,
        });
      }
    });

    results.push(result);

    // Add delay between uploads to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
};

/**
 * Upload file with blob data
 */
export const uploadBlob = async (
  blob: Blob,
  fileName: string,
  options: UploadOptions = {},
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  const file = new File([blob], fileName, { type: blob.type });
  return uploadFileToCloudinary(file, options, onProgress);
};

/**
 * Upload from URL
 */
export const uploadFromUrl = async (
  url: string,
  options: UploadOptions = {}
): Promise<UploadResult> => {
  try {
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      return {
        success: false,
        error: 'Cloudinary is not properly configured',
      };
    }

    const formData = new FormData();
    formData.append('file', url);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    // Add folder from config
    const config = UPLOAD_CONFIGS[options.type || 'general'];
    if (config.folder) {
      formData.append('folder', config.folder);
    }

    // Add tags
    const tags = ['retrouvonsles', options.type || 'general', ...(options.tags || [])];
    formData.append('tags', tags.join(','));

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed with status ${response.status}`,
      };
    }

    const data: UploadResponse = await response.json();
    return {
      success: true,
      data,
      publicId: data.public_id,
      url: data.url,
      secureUrl: data.secure_url,
    };
  } catch (error) {
    console.error('Upload from URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Upload with transformation applied during upload
 */
export const uploadWithTransformation = async (
  file: File,
  transformation: Record<string, any>,
  options: UploadOptions = {},
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Validate file
    const validation = validateFile(file, options.type || 'general');
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      return {
        success: false,
        error: 'Cloudinary is not properly configured',
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    // Add folder
    const config = UPLOAD_CONFIGS[options.type || 'general'];
    if (config.folder) {
      formData.append('folder', config.folder);
    }

    // Add transformation as eager parameter
    const transformationArray = Object.entries(transformation)
      .map(([key, value]) => `${key}_${value}`)
      .join(',');
    
    if (transformationArray) {
      formData.append('eager', transformationArray);
    }

    // Add tags and context
    const tags = ['retrouvonsles', options.type || 'general', ...(options.tags || [])];
    formData.append('tags', tags.join(','));

    const context = {
      app: 'retrouvonsles',
      timestamp: new Date().toISOString(),
      ...(options.context || {}),
    };
    formData.append(
      'context',
      Object.entries(context)
        .map(([key, value]) => `${key}=${value}`)
        .join('|')
    );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;
    
    const xhr = new XMLHttpRequest();

    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          onProgress({
            percentage: (event.loaded / event.total) * 100,
            loaded: event.loaded,
            total: event.total,
          });
        }
      });
    }

    return new Promise((resolve) => {
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response: UploadResponse = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            data: response,
            publicId: response.public_id,
            url: response.url,
            secureUrl: response.secure_url,
          });
        } else {
          resolve({
            success: false,
            error: `Upload failed with status ${xhr.status}`,
          });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Network error during upload',
        });
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload with transformation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Retry upload with exponential backoff
 */
export const uploadWithRetry = async (
  file: File,
  options: UploadOptions = {},
  maxRetries: number = 3,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  let lastError: string = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await uploadFileToCloudinary(file, options, onProgress);

      if (result.success) {
        return result;
      }

      lastError = result.error || 'Unknown error';

      // Exponential backoff: 1s, 2s, 4s
      if (attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';

      if (attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return {
    success: false,
    error: `Upload failed after ${maxRetries} attempts: ${lastError}`,
  };
};

/**
 * Get upload URL for direct uploads (for advanced use)
 */
export const getUploadUrl = (): string => {
  if (!cloudinaryConfig.cloudName) {
    console.warn('Cloudinary cloud name is not configured');
    return '';
  }

  return `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/auto/upload`;
};
