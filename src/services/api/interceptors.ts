/**
 * =====================================================
 * RETROUVONSLES - API Interceptors
 * Request and response interceptors for API client
 * =====================================================
 */

import { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { supabase } from '../../config';
import { parseApiError, logError } from './errorHandler';

/**
 * Queue for failed requests during token refresh
 */
interface PendingRequest {
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}

let isRefreshing = false;
let pendingRequests: PendingRequest[] = [];

/**
 * Process pending requests after token refresh
 */
const processPendingRequests = (token: string | null, error?: any): void => {
  pendingRequests.forEach((request) => {
    if (error) {
      request.reject(error);
    } else {
      request.resolve(token || '');
    }
  });
  pendingRequests = [];
};

/**
 * Setup request interceptor
 * Adds authentication token to every request
 */
export const setupRequestInterceptor = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        // Get current Supabase session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.warn('[Request Interceptor] Failed to get session:', sessionError);
        }

        // Add auth token if available
        if (sessionData.session?.access_token) {
          config.headers.Authorization = `Bearer ${sessionData.session.access_token}`;
        }

        // Add request timestamp for debugging
        (config as any).requestTimestamp = Date.now();

        return config;
      } catch (error) {
        console.error('[Request Interceptor] Unexpected error:', error);
        return config;
      }
    },
    (error) => {
      console.error('[Request Interceptor] Error:', error);
      return Promise.reject(error);
    }
  );
};

/**
 * Setup response interceptor
 * Handles errors and token refresh on 401
 */
export const setupResponseInterceptor = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.response.use(
    (response) => {
      // Log response time for performance monitoring
      const requestTime = (response.config as any).requestTimestamp;
      if (requestTime) {
        const responseTime = Date.now() - requestTime;
        if (responseTime > 3000) {
          console.warn(
            `[Response Interceptor] Slow request: ${response.config.url} took ${responseTime}ms`
          );
        }
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Handle 401 Unauthorized - Try to refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Wait for token refresh and retry
          return new Promise((resolve, reject) => {
            pendingRequests.push({
              resolve: (token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(axiosInstance(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data: sessionData, error: getSessionError } =
            await supabase.auth.getSession();

          if (getSessionError || !sessionData.session?.refresh_token) {
            throw new Error('No refresh token available');
          }

          const { data, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: sessionData.session.refresh_token,
          });

          if (refreshError || !data.session?.access_token) {
            // Refresh failed - logout user
            await supabase.auth.signOut();
            processPendingRequests(null, refreshError);
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }

          const newToken = data.session.access_token;

          // Update token in pending requests and retry
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          processPendingRequests(newToken);
          isRefreshing = false;

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('[Response Interceptor] Token refresh failed:', refreshError);

          // Logout on refresh failure
          await supabase.auth.signOut();
          processPendingRequests(null, refreshError);
          isRefreshing = false;
          window.location.href = '/auth/login';

          return Promise.reject(refreshError);
        }
      }

      // Parse and log the error
      const parsedError = parseApiError(error);
      logError(parsedError, 'Response Interceptor');

      return Promise.reject(parsedError);
    }
  );
};

/**
 * Setup error handling interceptor
 * Additional error handling for specific cases
 */
export const setupErrorInterceptor = (axiosInstance: AxiosInstance): void => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      // Handle network errors
      if (!error.response) {
        const networkError = parseApiError(error);
        logError(networkError, 'Network Error');
        return Promise.reject(networkError);
      }

      return Promise.reject(error);
    }
  );
};

/**
 * Setup all interceptors
 */
export const setupAllInterceptors = (axiosInstance: AxiosInstance): void => {
  setupRequestInterceptor(axiosInstance);
  setupResponseInterceptor(axiosInstance);
  setupErrorInterceptor(axiosInstance);
};
