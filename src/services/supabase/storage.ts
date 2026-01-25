/**
 * =====================================================
 * RETROUVONSLES - Supabase Storage Service
 * =====================================================
 * 
 * Service pour gérer les uploads de fichiers
 * Photos, documents, preuves, etc.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientManager, SupabaseStorageError, retryWithBackoff, handleSupabaseError } from './supabaseClient';
import { UUID } from '../../@types/database.types';

// ============================================
// TYPES
// ============================================

export interface FileUploadOptions {
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
}

export interface UploadedFile {
  path: string;
  fullPath: string;
  publicUrl: string;
  size: number;
  mimeType: string;
}

export interface StorageResult<T> {
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

export interface ListFilesOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'updated_at';
}

// ============================================
// STORAGE BUCKETS
// ============================================

export const STORAGE_BUCKETS = {
  PHOTOS: 'photos',
  DOCUMENTS: 'documents',
  PREUVES: 'preuves',
  PROFILS: 'profils',
  ORGANISATIONS: 'organisations',
} as const;

// ============================================
// STORAGE SERVICE
// ============================================

export class StorageService {
  private client: SupabaseClient;
  private static instance: StorageService | null = null;
  private publicUrlBase: string;

  private constructor(client: SupabaseClient) {
    this.client = client;
    const config = SupabaseClientManager.getConfig();
    this.publicUrlBase = config?.url || '';
  }

  /**
   * Get singleton instance
   */
  static getInstance(): StorageService {
    if (!this.instance) {
      const client = SupabaseClientManager.getInstance();
      this.instance = new StorageService(client);
    }
    return this.instance;
  }

  // ============================================
  // UPLOAD OPERATIONS
  // ============================================

  /**
   * Upload file to bucket
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: FileUploadOptions
  ): Promise<StorageResult<UploadedFile>> {
    try {
      return await retryWithBackoff(async () => {
        const { data, error } = await this.client.storage
          .from(bucket)
          .upload(path, file, {
            upsert: options?.upsert || false,
            cacheControl: options?.cacheControl || '3600',
            contentType: options?.contentType,
          });

        if (error) {
          throw handleSupabaseError(error);
        }

        if (!data) {
          throw new SupabaseStorageError('Upload failed: no response data');
        }

        const publicUrl = this.getPublicUrl(bucket, data.path);

        return {
          data: {
            path: data.path,
            fullPath: `${bucket}/${data.path}`,
            publicUrl,
            size: file.size,
            mimeType: file.type,
          },
        };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'File upload failed',
          code: 'UPLOAD_ERROR',
        },
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    bucket: string,
    folder: string,
    files: File[],
    options?: FileUploadOptions
  ): Promise<StorageResult<UploadedFile[]>> {
    if (files.length === 0) {
      return { data: [] };
    }

    try {
      const uploadedFiles: UploadedFile[] = [];

      for (const file of files) {
        const path = `${folder}/${Date.now()}_${file.name}`;
        const result = await this.uploadFile(bucket, path, file, options);

        if (result.data) {
          uploadedFiles.push(result.data);
        }
      }

      return { data: uploadedFiles };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Multiple file upload failed',
          code: 'UPLOAD_MULTIPLE_ERROR',
        },
      };
    }
  }

  /**
   * Upload with user context (creates user-specific folder)
   */
  async uploadUserFile(
    bucket: string,
    userId: UUID,
    file: File | Blob,
    options?: FileUploadOptions
  ): Promise<StorageResult<UploadedFile>> {
    const timestamp = Date.now();
    const fileName = file instanceof File ? file.name : `file-${timestamp}`;
    const path = `${userId}/${timestamp}_${fileName}`;

    return this.uploadFile(bucket, path, file, options);
  }

  /**
   * Replace file (with upsert)
   */
  async replaceFile(
    bucket: string,
    path: string,
    file: File | Blob,
    options?: FileUploadOptions
  ): Promise<StorageResult<UploadedFile>> {
    return this.uploadFile(bucket, path, file, {
      ...options,
      upsert: true,
    });
  }

  // ============================================
  // DOWNLOAD OPERATIONS
  // ============================================

  /**
   * Download file
   */
  async downloadFile(bucket: string, path: string): Promise<StorageResult<Blob>> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .download(path);

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Download failed',
          code: 'DOWNLOAD_ERROR',
        },
      };
    }
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket: string, path: string): string {
    return `${this.publicUrlBase}/storage/v1/object/public/${bucket}/${path}`;
  }

  /**
   * Get signed URL for file (with expiration)
   */
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<StorageResult<string>> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: data?.signedUrl };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Signed URL creation failed',
          code: 'SIGNED_URL_ERROR',
        },
      };
    }
  }

  // ============================================
  // DELETE OPERATIONS
  // ============================================

  /**
   * Delete file
   */
  async deleteFile(bucket: string, path: string): Promise<StorageResult<void>> {
    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'File deletion failed',
          code: 'DELETE_ERROR',
        },
      };
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(bucket: string, paths: string[]): Promise<StorageResult<void>> {
    if (paths.length === 0) {
      return { data: undefined };
    }

    try {
      const { error } = await this.client.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: undefined };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Multiple file deletion failed',
          code: 'DELETE_MULTIPLE_ERROR',
        },
      };
    }
  }

  /**
   * Delete all files in folder
   */
  async deleteFolder(bucket: string, folder: string): Promise<StorageResult<void>> {
    try {
      const { data: files, error: listError } = await this.client.storage
        .from(bucket)
        .list(folder);

      if (listError) {
        throw handleSupabaseError(listError);
      }

      if (!files || files.length === 0) {
        return { data: undefined };
      }

      const paths = files.map(f => `${folder}/${f.name}`);
      return this.deleteMultiple(bucket, paths);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Folder deletion failed',
          code: 'DELETE_FOLDER_ERROR',
        },
      };
    }
  }

  // ============================================
  // LIST OPERATIONS
  // ============================================

  /**
   * List files in bucket
   */
  async listFiles(
    bucket: string,
    folder?: string,
    options?: ListFilesOptions
  ): Promise<StorageResult<any[]>> {
    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .list(folder || '', {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          sortBy: {
            column: options?.sortBy || 'name',
            order: 'asc',
          },
        });

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: data || [] };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'List files failed',
          code: 'LIST_ERROR',
        },
      };
    }
  }

  /**
   * List files in folder with full paths
   */
  async listFilesInFolder(
    bucket: string,
    folder: string,
    options?: ListFilesOptions
  ): Promise<StorageResult<UploadedFile[]>> {
    try {
      const { data, error } = await this.listFiles(bucket, folder, options);

      if (error || !data) {
        return { error };
      }

      const files: UploadedFile[] = data
        .filter(f => !f.id.startsWith('.'))
        .map(f => ({
          path: `${folder}/${f.name}`,
          fullPath: `${bucket}/${folder}/${f.name}`,
          publicUrl: this.getPublicUrl(bucket, `${folder}/${f.name}`),
          size: f.metadata?.size || 0,
          mimeType: f.metadata?.mimetype || '',
        }));

      return { data: files };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'List folder failed',
          code: 'LIST_FOLDER_ERROR',
        },
      };
    }
  }

  /**
   * List user files
   */
  async listUserFiles(
    bucket: string,
    userId: UUID,
    options?: ListFilesOptions
  ): Promise<StorageResult<UploadedFile[]>> {
    return this.listFilesInFolder(bucket, userId, options);
  }

  // ============================================
  // UTILITY OPERATIONS
  // ============================================

  /**
   * Check if file exists
   */
  async fileExists(bucket: string, path: string): Promise<boolean> {
    try {
      const { data } = await this.client.storage.from(bucket).list();

      if (!data) return false;

      return data.some(f => f.name === path.split('/').pop());
    } catch {
      return false;
    }
  }

  /**
   * Copy file
   */
  async copyFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<StorageResult<UploadedFile>> {
    try {
      const downloadResult = await this.downloadFile(bucket, fromPath);

      if (!downloadResult.data) {
        return {
          error: {
            message: 'Source file not found',
            code: 'SOURCE_NOT_FOUND',
          },
        };
      }

      return this.uploadFile(bucket, toPath, downloadResult.data);
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Copy file failed',
          code: 'COPY_ERROR',
        },
      };
    }
  }

  /**
   * Move file (copy then delete)
   */
  async moveFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<StorageResult<UploadedFile>> {
    try {
      const copyResult = await this.copyFile(bucket, fromPath, toPath);

      if (copyResult.error) {
        return copyResult;
      }

      await this.deleteFile(bucket, fromPath);

      return copyResult;
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Move file failed',
          code: 'MOVE_ERROR',
        },
      };
    }
  }

  /**
   * Get bucket size in bytes
   */
  async getBucketSize(bucket: string): Promise<StorageResult<number>> {
    try {
      const { data, error } = await this.listFiles(bucket);

      if (error || !data) {
        return { error };
      }

      const totalSize = data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);

      return { data: totalSize };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Get bucket size failed',
          code: 'SIZE_ERROR',
        },
      };
    }
  }
}

export default StorageService;
