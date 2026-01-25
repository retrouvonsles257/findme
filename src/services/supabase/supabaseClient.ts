/**
 * =====================================================
 * RETROUVONSLES - Supabase Client Configuration
 * =====================================================
 * 
 * Initialise et configure le client Supabase
 * avec gestion d'erreurs et retry logic
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// TYPES
// ============================================

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  timeout?: number;
  retryCount?: number;
}

export interface SupabaseErrorResponse {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
}

// ============================================
// ERROR CLASSES
// ============================================

export class SupabaseClientError extends Error {
  code?: string;
  details?: string;
  hint?: string;

  constructor(message: string, code?: string, details?: string, hint?: string) {
    super(message);
    this.name = 'SupabaseClientError';
    this.code = code;
    this.details = details;
    this.hint = hint;
  }
}

export class SupabaseConnectionError extends SupabaseClientError {
  constructor(message: string = 'Failed to connect to Supabase') {
    super(message, 'CONNECTION_ERROR');
    this.name = 'SupabaseConnectionError';
  }
}

export class SupabaseAuthError extends SupabaseClientError {
  constructor(message: string, code?: string) {
    super(message, code || 'AUTH_ERROR');
    this.name = 'SupabaseAuthError';
  }
}

export class SupabaseDatabaseError extends SupabaseClientError {
  constructor(message: string, code?: string, details?: string, hint?: string) {
    super(message, code || 'DATABASE_ERROR', details, hint);
    this.name = 'SupabaseDatabaseError';
  }
}

export class SupabaseStorageError extends SupabaseClientError {
  constructor(message: string, code?: string) {
    super(message, code || 'STORAGE_ERROR');
    this.name = 'SupabaseStorageError';
  }
}

export class SupabaseRealtimeError extends SupabaseClientError {
  constructor(message: string, code?: string) {
    super(message, code || 'REALTIME_ERROR');
    this.name = 'SupabaseRealtimeError';
  }
}

// ============================================
// SUPABASE CLIENT MANAGER
// ============================================

export class SupabaseClientManager {
  private static instance: SupabaseClient | null = null;
  private static isInitialized: boolean = false;
  private static config: SupabaseConfig | null = null;

  /**
   * Initialize Supabase client (singleton pattern)
   */
  static initialize(config: SupabaseConfig): SupabaseClient {
    if (this.isInitialized && this.instance) {
      return this.instance;
    }

    if (!config.url || !config.anonKey) {
      throw new SupabaseConnectionError(
        'Supabase URL and anon key are required'
      );
    }

    try {
      this.config = config;
      this.instance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            'User-Agent': 'RETROUVONSLES/1.0',
          },
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });

      this.isInitialized = true;
      console.log('Supabase client initialized successfully');
      
      return this.instance;
    } catch (error) {
      throw new SupabaseConnectionError(
        `Failed to initialize Supabase: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get Supabase client instance
   */
  static getInstance(): SupabaseClient {
    if (!this.instance || !this.isInitialized) {
      throw new SupabaseConnectionError(
        'Supabase client not initialized. Call initialize() first.'
      );
    }

    return this.instance;
  }

  /**
   * Check if client is initialized
   */
  static isInitializedCheck(): boolean {
    return this.isInitialized && this.instance !== null;
  }

  /**
   * Reset client (mainly for testing)
   */
  static reset(): void {
    this.instance = null;
    this.isInitialized = false;
    this.config = null;
  }

  /**
   * Get current configuration
   */
  static getConfig(): SupabaseConfig | null {
    return this.config;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Handle Supabase API errors
 */
export function handleSupabaseError(error: any): SupabaseClientError {
  if (error instanceof SupabaseClientError) {
    return error;
  }

  if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
    return new SupabaseAuthError(
      error?.message || 'Unauthorized access',
      'UNAUTHORIZED'
    );
  }

  if (error?.status >= 400 && error?.status < 500) {
    return new SupabaseDatabaseError(
      error?.message || 'Bad request',
      error?.code,
      error?.details,
      error?.hint
    );
  }

  if (error?.status >= 500) {
    return new SupabaseDatabaseError(
      error?.message || 'Server error',
      error?.code
    );
  }

  return new SupabaseClientError(
    error?.message || 'Unknown Supabase error'
  );
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * Build filter query string
 */
export function buildFilterQuery(filters: Record<string, any>): string {
  return Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === 'string') {
        return `${key}.eq.${encodeURIComponent(value)}`;
      }
      if (typeof value === 'number') {
        return `${key}.eq.${value}`;
      }
      if (typeof value === 'boolean') {
        return `${key}.eq.${value}`;
      }
      return null;
    })
    .filter(Boolean)
    .join('&');
}

/**
 * Initialize Supabase from environment variables
 */
export function initializeSupabaseFromEnv(): SupabaseClient {
  const url = process.env.REACT_APP_SUPABASE_URL;
  const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new SupabaseConnectionError(
      'Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY environment variables'
    );
  }

  return SupabaseClientManager.initialize({
    url,
    anonKey,
    timeout: 30000,
    retryCount: 3,
  });
}

export default SupabaseClientManager;
