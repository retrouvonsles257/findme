/**
 * =====================================================
 * RETROUVONSLES - API Error Handler
 * Centralized error handling and logging
 * =====================================================
 */

import { AxiosError } from 'axios';

export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  CONFLICT_ERROR = 'CONFLICT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiErrorResponse {
  type: ErrorType;
  message: string;
  code: string;
  statusCode?: number;
  details?: Record<string, any>;
  timestamp?: string;
}

/**
 * Map HTTP status codes to error types
 */
const getErrorType = (status?: number): ErrorType => {
  switch (status) {
    case 400:
      return ErrorType.VALIDATION_ERROR;
    case 401:
      return ErrorType.AUTH_ERROR;
    case 404:
      return ErrorType.NOT_FOUND_ERROR;
    case 409:
      return ErrorType.CONFLICT_ERROR;
    case 408:
    case 504:
      return ErrorType.TIMEOUT_ERROR;
    case 500:
    case 502:
    case 503:
      return ErrorType.SERVER_ERROR;
    default:
      return ErrorType.UNKNOWN_ERROR;
  }
};

/**
 * Parse error response from API
 */
export const parseApiError = (
  error: AxiosError | Error | any
): ApiErrorResponse => {
  const timestamp = new Date().toISOString();

  // Handle Axios errors
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const errorData = error.response?.data as Record<string, any> | undefined;

    return {
      type: getErrorType(status),
      message: errorData?.message || error.message,
      code: errorData?.code || `HTTP_${status}`,
      statusCode: status,
      details: errorData?.details,
      timestamp,
    };
  }

  // Handle regular errors
  if (error instanceof Error) {
    return {
      type: ErrorType.UNKNOWN_ERROR,
      message: error.message,
      code: 'ERROR',
      timestamp,
    };
  }

  // Handle unknown errors
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: 'An unknown error occurred',
    code: 'UNKNOWN',
    timestamp,
  };
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: ApiErrorResponse): string => {
  switch (error.type) {
    case ErrorType.NETWORK_ERROR:
      return 'Une erreur réseau est survenue. Vérifiez votre connexion Internet.';
    case ErrorType.TIMEOUT_ERROR:
      return 'La requête a expiré. Veuillez réessayer.';
    case ErrorType.AUTH_ERROR:
      return 'Authentification requise. Veuillez vous connecter.';
    case ErrorType.VALIDATION_ERROR:
      return 'Les données fournies ne sont pas valides. Veuillez vérifier votre saisie.';
    case ErrorType.NOT_FOUND_ERROR:
      return 'La ressource demandée n\'a pas été trouvée.';
    case ErrorType.CONFLICT_ERROR:
      return 'Cette action crée un conflit. Veuillez réessayer.';
    case ErrorType.SERVER_ERROR:
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    default:
      return error.message || 'Une erreur est survenue.';
  }
};

/**
 * Log error details for debugging
 */
export const logError = (error: ApiErrorResponse, context?: string): void => {
  const timestamp = new Date().toISOString();
  const prefix = context ? `[${context}]` : '[API Error]';

  console.error(`${prefix} ${timestamp}`, {
    type: error.type,
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    details: error.details,
  });
};

/**
 * Determine if error is retryable
 */
export const isRetryableError = (error: ApiErrorResponse): boolean => {
  return [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.SERVER_ERROR,
  ].includes(error.type);
};

/**
 * Determine if error requires re-authentication
 */
export const requiresReauth = (error: ApiErrorResponse): boolean => {
  return error.type === ErrorType.AUTH_ERROR;
};

/**
 * Format validation error details
 */
export const formatValidationErrors = (
  details?: Record<string, any>
): Record<string, string> => {
  if (!details) return {};

  const formatted: Record<string, string> = {};

  for (const [key, value] of Object.entries(details)) {
    if (typeof value === 'string') {
      formatted[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      formatted[key] = value[0];
    } else if (typeof value === 'object' && value !== null) {
      formatted[key] = JSON.stringify(value);
    }
  }

  return formatted;
};
