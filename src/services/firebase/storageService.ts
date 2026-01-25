/**
 * =====================================================
 * RETROUVONSLES - Firebase Storage Service
 * =====================================================
 * File uploads and downloads management
 */

import {
  FirebaseStorage,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getBytes,
  listAll,
  UploadTask,
} from 'firebase/storage';
import { getFirebaseServices } from './firebaseConfig';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
  state: 'running' | 'paused' | 'success' | 'error';
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  size?: number;
  error?: string;
  metadata?: any;
}

export interface DownloadResult {
  success: boolean;
  data?: Blob;
  url?: string;
  error?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  createdAt: Date;
  url?: string;
  path?: string;
}

// ============================================
// STORAGE SERVICE CLASS
// ============================================

class FirebaseStorageService {
  private storage: FirebaseStorage | null = null;
  private isInitialized: boolean = false;
  private uploadTasks: Map<string, UploadTask> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize storage service
   */
  private initialize(): void {
    try {
      const services = getFirebaseServices();
      this.storage = services.storage;
      this.isInitialized = !!this.storage;
    } catch (error) {
      console.error('Error initializing storage service:', error);
    }
  }

  /**
   * Check if storage is available
   */
  isAvailable(): boolean {
    return this.isInitialized && !!this.storage;
  }

  /**
   * Upload file (simple)
   */
  async uploadFile(
    filePath: string,
    file: File | Blob
  ): Promise<UploadResult> {
    if (!this.storage) {
      return {
        success: false,
        error: 'Storage not available',
      };
    }

    try {
      const storageRef = ref(this.storage, filePath);
      const snapshot = await uploadBytes(storageRef, file);

      const url = await getDownloadURL(snapshot.ref);

      return {
        success: true,
        url,
        path: snapshot.ref.fullPath,
        size: snapshot.metadata.size,
        metadata: snapshot.metadata,
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Upload file with progress tracking
   */
  uploadFileWithProgress(
    filePath: string,
    file: File | Blob,
    onProgress?: (progress: UploadProgress) => void,
    taskId?: string
  ): Promise<UploadResult> {
    if (!this.storage) {
      return Promise.resolve({
        success: false,
        error: 'Storage not available',
      });
    }

    return new Promise((resolve) => {
      try {
        const storageRef = ref(this.storage!, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        if (taskId) {
          this.uploadTasks.set(taskId, uploadTask);
        }

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
              state: snapshot.state as any,
            };

            if (onProgress) {
              onProgress(progress);
            }
          },
          (error) => {
            console.error('Upload error:', error);
            resolve({
              success: false,
              error: error instanceof Error ? error.message : 'Upload failed',
            });
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                success: true,
                url,
                path: uploadTask.snapshot.ref.fullPath,
                size: uploadTask.snapshot.metadata.size,
              });

              if (taskId) {
                this.uploadTasks.delete(taskId);
              }
            } catch (error) {
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get URL',
              });
            }
          }
        );
      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    });
  }

  /**
   * Pause upload
   */
  pauseUpload(taskId: string): boolean {
    const task = this.uploadTasks.get(taskId);
    if (!task) return false;

    try {
      task.pause();
      return true;
    } catch (error) {
      console.error('Error pausing upload:', error);
      return false;
    }
  }

  /**
   * Resume upload
   */
  resumeUpload(taskId: string): boolean {
    const task = this.uploadTasks.get(taskId);
    if (!task) return false;

    try {
      task.resume();
      return true;
    } catch (error) {
      console.error('Error resuming upload:', error);
      return false;
    }
  }

  /**
   * Cancel upload
   */
  cancelUpload(taskId: string): boolean {
    const task = this.uploadTasks.get(taskId);
    if (!task) return false;

    try {
      task.cancel();
      this.uploadTasks.delete(taskId);
      return true;
    } catch (error) {
      console.error('Error canceling upload:', error);
      return false;
    }
  }

  /**
   * Download file
   */
  async downloadFile(filePath: string): Promise<DownloadResult> {
    if (!this.storage) {
      return {
        success: false,
        error: 'Storage not available',
      };
    }

    try {
      const storageRef = ref(this.storage, filePath);
      const data = await getBytes(storageRef);
      const url = await getDownloadURL(storageRef);

      return {
        success: true,
        data: new Blob([new Uint8Array(data)]),
        url,
      };
    } catch (error) {
      console.error('Error downloading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    }
  }

  /**
   * Get download URL
   */
  async getDownloadUrl(filePath: string): Promise<string | null> {
    if (!this.storage) {
      console.warn('Storage not available');
      return null;
    }

    try {
      const storageRef = ref(this.storage, filePath);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath: string): Promise<boolean> {
    if (!this.storage) {
      console.warn('Storage not available');
      return false;
    }

    try {
      const storageRef = ref(this.storage, filePath);
      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * List files in directory
   */
  async listFiles(dirPath: string): Promise<FileMetadata[]> {
    if (!this.storage) {
      console.warn('Storage not available');
      return [];
    }

    try {
      const dirRef = ref(this.storage, dirPath);
      const result = await listAll(dirRef);

      const files: FileMetadata[] = [];

      for (const fileRef of result.items) {
        const url = await getDownloadURL(fileRef);

        files.push({
          name: fileRef.name,
          size: 0,
          type: 'unknown',
          createdAt: new Date(),
          url,
          path: fileRef.fullPath,
        });
      }

      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    baseDir: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    if (!this.storage) {
      return [];
    }

    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${baseDir}/${Date.now()}_${file.name}`;

      const result = await this.uploadFileWithProgress(
        filePath,
        file,
        (progress) => {
          if (onProgress) {
            onProgress(i, progress);
          }
        }
      );

      results.push(result);
    }

    return results;
  }

  /**
   * Copy file
   */
  async copyFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    if (!this.storage) {
      console.warn('Storage not available');
      return false;
    }

    try {
      // Download source file
      const sourceRef = ref(this.storage, sourcePath);
      const fileBlob = await getBytes(sourceRef);

      // Upload to destination
      const destRef = ref(this.storage, destinationPath);
      await uploadBytes(destRef, fileBlob);

      return true;
    } catch (error) {
      console.error('Error copying file:', error);
      return false;
    }
  }

  /**
   * Move file (copy and delete)
   */
  async moveFile(sourcePath: string, destinationPath: string): Promise<boolean> {
    try {
      const copySuccess = await this.copyFile(sourcePath, destinationPath);
      if (!copySuccess) return false;

      return await this.deleteFile(sourcePath);
    } catch (error) {
      console.error('Error moving file:', error);
      return false;
    }
  }

  /**
   * Get file size
   */
  async getFileSize(filePath: string): Promise<number> {
    if (!this.storage) {
      return 0;
    }

    // Firebase Storage doesn't provide metadata retrieval directly
    // This would need to be stored separately in Firestore
    return 0;
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    if (!this.storage) {
      return false;
    }

    try {
      const fileRef = ref(this.storage, filePath);
      await getDownloadURL(fileRef);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all uploads
   */
  clearAllUploads(): void {
    this.uploadTasks.forEach((task) => {
      try {
        task.cancel();
      } catch (error) {
        console.error('Error clearing upload:', error);
      }
    });
    this.uploadTasks.clear();
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const firebaseStorageService = new FirebaseStorageService();

// ============================================
// EXPORTS
// ============================================

export default firebaseStorageService;
