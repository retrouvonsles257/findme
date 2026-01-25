/**
 * =====================================================
 * RETROUVONSLES - API Services Export
 * Centralized API services and utilities
 * =====================================================
 */

// API Client
export { api, apiClient, type ApiResponse, type ApiError } from './apiClient';

// Endpoints
export { API_ENDPOINTS, getApiUrl } from './endpoints';

// Error Handler
export {
  ErrorType,
  parseApiError,
  getUserFriendlyMessage,
  logError,
  isRetryableError,
  requiresReauth,
  formatValidationErrors,
  type ApiErrorResponse,
} from './errorHandler';

// Interceptors
export { setupAllInterceptors, setupRequestInterceptor, setupResponseInterceptor } from './interceptors';

// Request Configuration
export {
  REQUEST_TIMEOUT,
  DEFAULT_REQUEST_CONFIG,
  getRequestConfig,
  buildQueryString,
  buildSortString,
  getPaginationParams,
  DEFAULT_PAGINATION,
  buildCacheKey,
  FILE_UPLOAD_CONFIG,
  validateFile,
  buildFormData,
  RETRY_CONFIG,
  getRetryDelay,
  isRetryableStatus,
  isRetryableStatus as isRetryable,
  REQUEST_DEDUP_CONFIG,
  CACHE_CONFIG,
  type QueryParams,
  type PaginationParams,
  type FilterParams,
  type SortParams,
} from './requestConfig';
