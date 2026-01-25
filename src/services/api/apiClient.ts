/**
 * =====================================================
 * RETROUVONSLES - API Client Configuration
 * Axios client with interceptors and auth
 * =====================================================
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { supabase } from '../../config';
import { setupAllInterceptors } from './interceptors';

// ============================================
// TYPES
// ============================================

export interface ApiResponse<T = any> {
  status: number;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, any>;
}

// ============================================
// AXIOS CLIENT INSTANCE
// ============================================

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-Application': 'RetrouvonsLes',
    'X-Version': process.env.REACT_APP_VERSION || '1.0.0',
  },
  // Prevent CORS preflight for simple requests
  validateStatus: (status) => status >= 200 && status < 300 || status === 401,
});

// ============================================
// SETUP INTERCEPTORS
// ============================================

setupAllInterceptors(apiClient);

// ============================================
// API REQUEST METHODS
// ============================================

export const api = {
  /**
   * GET request
   */
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data.data;
  },

  /**
   * POST request
   */
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  /**
   * PUT request
   */
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data;
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data.data;
  },

  /**
   * Raw request (returns full response)
   */
  request: async <T = any>(config: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.request<ApiResponse<T>>(config);
    return response.data.data;
  },
};
