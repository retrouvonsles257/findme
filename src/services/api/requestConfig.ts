/**
 * =====================================================
 * RETROUVONSLES - Request Configuration
 * Centralized request configuration and helpers
 * =====================================================
 */

import { AxiosRequestConfig } from 'axios';

/**
 * Request timeout configurations (in milliseconds)
 */
export const REQUEST_TIMEOUT = {
  SHORT: 5000,      // 5 seconds - for quick queries
  NORMAL: 30000,    // 30 seconds - default
  LONG: 60000,      // 1 minute - for heavy operations
  UPLOAD: 300000,   // 5 minutes - for file uploads
} as const;

/**
 * Default request config
 */
export const DEFAULT_REQUEST_CONFIG: AxiosRequestConfig = {
  timeout: REQUEST_TIMEOUT.NORMAL,
  headers: {
    'Content-Type': 'application/json',
    'X-Application': 'RetrouvonsLes',
    'X-Version': process.env.REACT_APP_VERSION || '1.0.0',
  },
};

/**
 * Get request config for different scenarios
 */
export const getRequestConfig = (
  type: 'get' | 'post' | 'upload' | 'long' = 'post'
): AxiosRequestConfig => {
  const baseConfig = { ...DEFAULT_REQUEST_CONFIG };

  switch (type) {
    case 'get':
      return {
        ...baseConfig,
        timeout: REQUEST_TIMEOUT.SHORT,
      };

    case 'upload':
      return {
        ...baseConfig,
        timeout: REQUEST_TIMEOUT.UPLOAD,
        headers: {
          ...baseConfig.headers,
          'Content-Type': 'multipart/form-data',
        },
      };

    case 'long':
      return {
        ...baseConfig,
        timeout: REQUEST_TIMEOUT.LONG,
      };

    case 'post':
    default:
      return baseConfig;
  }
};

/**
 * Query parameters builder
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: Record<string, any>;
  sort?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

/**
 * Build query string from parameters
 */
export const buildQueryString = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'object') {
      searchParams.append(key, JSON.stringify(value));
    } else {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  skip?: number;
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  limit: 20,
};

/**
 * Get pagination params from page and limit
 */
export const getPaginationParams = (
  page: number = 1,
  limit: number = 20
): PaginationParams => {
  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

/**
 * Build filter parameters for requests
 */
export interface FilterParams {
  status?: string;
  role?: string;
  organisation_id?: string;
  created_after?: string;
  created_before?: string;
  [key: string]: any;
}

/**
 * Build sort parameters
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * Build sort string for API
 */
export const buildSortString = (field: string, order: 'asc' | 'desc' = 'desc'): string => {
  return `${field}.${order}`;
};

/**
 * File upload configuration
 */
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10 MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  CHUNK_SIZE: 1024 * 1024, // 1 MB
};

/**
 * Validate file before upload
 */
export const validateFile = (
  file: File,
  maxSize: number = FILE_UPLOAD_CONFIG.MAX_SIZE,
  allowedTypes: string[] = FILE_UPLOAD_CONFIG.ALLOWED_TYPES
): { valid: boolean; error?: string } => {
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
};

/**
 * Build form data for file uploads
 */
export const buildFormData = (
  file: File,
  additionalData?: Record<string, any>
): FormData => {
  const formData = new FormData();

  formData.append('file', file);

  if (additionalData) {
    for (const [key, value] of Object.entries(additionalData)) {
      if (value !== null && value !== undefined) {
        formData.append(key, JSON.stringify(value));
      }
    }
  }

  return formData;
};

/**
 * Retry configuration for failed requests
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // ms
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Calculate exponential backoff delay
 */
export const getRetryDelay = (retryCount: number): number => {
  return RETRY_CONFIG.retryDelay * Math.pow(2, retryCount);
};

/**
 * Check if response status is retryable
 */
export const isRetryableStatus = (status: number): boolean => {
  return RETRY_CONFIG.retryableStatuses.includes(status);
};

/**
 * Cache configuration for GET requests
 */
export const CACHE_CONFIG = {
  enabled: true,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  maxSize: 100, // Maximum number of cached items
};

/**
 * Cache key builder
 */
export const buildCacheKey = (url: string, params?: QueryParams): string => {
  if (!params) return url;
  const queryString = buildQueryString(params);
  return `${url}${queryString}`;
};

/**
 * Request deduplication configuration
 */
export const REQUEST_DEDUP_CONFIG = {
  enabled: true,
  timeout: 1000, // Wait 1 second for duplicate requests
};
