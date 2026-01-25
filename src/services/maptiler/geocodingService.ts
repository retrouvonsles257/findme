/**
 * MapTiler Geocoding Service
 * Provides geocoding, reverse geocoding, and autocomplete functionality
 */

import {
  GeocodingResult,
  GeocodingOptions,
  ReverseGeocodingOptions,
  SearchOptions,
  MAPTILER_ERROR_CODES,
  MAPTILER_ERROR_MESSAGES,
  API_TIMEOUT,
  API_RETRY_CONFIG,
  CACHE_CONFIG,
} from './maptilerConfig';

import { maptilerConfig } from './maptilerConfig';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Geocoding Cache Entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Geocoding Service Error
 */
export class GeocodingError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GeocodingError';
  }
}

/**
 * Autocomplete Suggestion
 */
export interface AutocompleteSuggestion {
  id: string;
  name: string;
  type: string;
  coordinates?: [number, number];
  matchingText?: string;
  relevance?: number;
}

// ============================================================================
// GEOCODING SERVICE CLASS
// ============================================================================

/**
 * MapTiler Geocoding Service
 * Handles address geocoding, reverse geocoding, and search
 */
export class GeocodingService {
  private static instance: GeocodingService;
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  private constructor() {
    this.initializeCache();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): GeocodingService {
    if (!GeocodingService.instance) {
      GeocodingService.instance = new GeocodingService();
    }
    return GeocodingService.instance;
  }

  /**
   * Initialize cache cleanup
   */
  private initializeCache(): void {
    // Cleanup expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache entry
   */
  private getCacheEntry<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache entry
   */
  private setCacheEntry<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Forward geocode (address to coordinates)
   */
  public async forwardGeocode(
    query: string,
    options?: GeocodingOptions
  ): Promise<GeocodingResult[]> {
    if (!query || query.trim().length === 0) {
      throw new GeocodingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'Search query is required'
      );
    }

    if (!maptilerConfig.isConfigured()) {
      throw new GeocodingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'MapTiler not configured'
      );
    }

    const cacheKey = this.buildCacheKey('forward', query, options);
    const cached = this.getCacheEntry<GeocodingResult[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const results = await this.performGeocodingRequest(
        'forward',
        query,
        options
      );

      this.setCacheEntry(cacheKey, results, CACHE_CONFIG.GEOCODING_TTL);
      return results;
    } catch (error) {
      throw this.handleGeocodingError(error);
    }
  }

  /**
   * Reverse geocode (coordinates to address)
   */
  public async reverseGeocode(
    coordinates: [number, number],
    options?: ReverseGeocodingOptions
  ): Promise<GeocodingResult[]> {
    if (!maptilerConfig.validateCoordinates(coordinates)) {
      throw new GeocodingError(
        MAPTILER_ERROR_CODES.INVALID_COORDINATES,
        'Invalid coordinates'
      );
    }

    if (!maptilerConfig.isConfigured()) {
      throw new GeocodingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'MapTiler not configured'
      );
    }

    const cacheKey = this.buildCacheKey('reverse', coordinates.join(','), options);
    const cached = this.getCacheEntry<GeocodingResult[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const results = await this.performReverseGeocodingRequest(
        coordinates,
        options
      );

      this.setCacheEntry(cacheKey, results, CACHE_CONFIG.GEOCODING_TTL);
      return results;
    } catch (error) {
      throw this.handleGeocodingError(error);
    }
  }

  /**
   * Search for places (autocomplete)
   */
  public async search(
    query: string,
    options?: SearchOptions
  ): Promise<AutocompleteSuggestion[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    try {
      const results = await this.forwardGeocode(query, options);

      return results.map(result => ({
        id: result.id,
        name: result.name,
        type: result.type,
        coordinates: result.center || result.geometry.coordinates,
        matchingText: result.matchingText,
        relevance: result.relevance,
      }));
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get place details
   */
  public async getPlaceDetails(placeId: string): Promise<GeocodingResult | null> {
    // MapTiler doesn't have a direct details endpoint
    // We return the place from cache if available
    try {
      const cacheKey = this.buildCacheKey('place', placeId, undefined);
      return this.getCacheEntry<GeocodingResult>(cacheKey);
    } catch (error) {
      console.error('Failed to get place details:', error);
      return null;
    }
  }

  /**
   * Perform geocoding request with retry
   */
  private async performGeocodingRequest(
    type: 'forward' | 'reverse',
    query: string,
    options?: GeocodingOptions | ReverseGeocodingOptions
  ): Promise<GeocodingResult[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= API_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = API_RETRY_CONFIG.retryDelay *
            Math.pow(API_RETRY_CONFIG.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const url = this.buildGeocodingUrl(type, query, options);
        const response = await this.fetchWithTimeout(url, API_TIMEOUT);

        if (!response.ok) {
          const errorCode = this.mapHttpErrorToCode(response.status);
          throw new GeocodingError(
            errorCode,
            MAPTILER_ERROR_MESSAGES[errorCode] || 'Geocoding request failed',
            response.status
          );
        }

        const data = await response.json() as { features?: GeocodingResult[] };

        if (!data.features || data.features.length === 0) {
          return [];
        }

        return data.features;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof GeocodingError) {
          throw error;
        }

        if (attempt === API_RETRY_CONFIG.maxRetries) {
          break;
        }
      }
    }

    throw lastError || new GeocodingError(
      MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
      'Geocoding request failed'
    );
  }

  /**
   * Perform reverse geocoding request
   */
  private async performReverseGeocodingRequest(
    coordinates: [number, number],
    options?: ReverseGeocodingOptions
  ): Promise<GeocodingResult[]> {
    const [lon, lat] = coordinates;
    const query = `${lon},${lat}`;

    return this.performGeocodingRequest('reverse', query, options);
  }

  /**
   * Build geocoding URL
   */
  private buildGeocodingUrl(
    type: 'forward' | 'reverse',
    query: string,
    options?: GeocodingOptions | ReverseGeocodingOptions
  ): string {
    const baseUrl = maptilerConfig.getGeocodingUrl();
    const params: Record<string, unknown> = {};

    if (options) {
      if ('limit' in options && options.limit) {
        params.limit = options.limit;
      }
      if ('types' in options && options.types) {
        params.types = options.types;
      }
      if ('language' in options && options.language) {
        params.language = options.language;
      }
      if ('proximity' in options && options.proximity) {
        params.proximity = options.proximity.join(',');
      }
      if ('country' in options && options.country) {
        params.country = options.country;
      }
      if ('bbox' in options && options.bbox) {
        params.bbox = options.bbox.join(',');
      }
      if ('fuzzyMatch' in options && options.fuzzyMatch !== undefined) {
        params.fuzzyMatch = options.fuzzyMatch;
      }
    }

    const queryString = maptilerConfig.buildQueryParams({
      ...params,
    });

    return `${baseUrl}/${query}.json?${queryString}`;
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    type: string,
    query: string,
    options?: GeocodingOptions | ReverseGeocodingOptions | SearchOptions
  ): string {
    const optionString = options
      ? JSON.stringify(options)
      : '';

    return `${type}:${query}:${optionString}`;
  }

  /**
   * Map HTTP error codes
   */
  private mapHttpErrorToCode(status: number): string {
    switch (status) {
      case 400:
        return MAPTILER_ERROR_CODES.INVALID_REQUEST;
      case 401:
      case 403:
        return MAPTILER_ERROR_CODES.INVALID_API_KEY;
      case 404:
        return MAPTILER_ERROR_CODES.NOT_FOUND;
      case 429:
        return MAPTILER_ERROR_CODES.QUOTA_EXCEEDED;
      case 503:
        return MAPTILER_ERROR_CODES.SERVICE_UNAVAILABLE;
      default:
        return MAPTILER_ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  /**
   * Handle geocoding errors
   */
  private handleGeocodingError(error: unknown): GeocodingError {
    if (error instanceof GeocodingError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new GeocodingError(
          MAPTILER_ERROR_CODES.TIMEOUT,
          MAPTILER_ERROR_MESSAGES[MAPTILER_ERROR_CODES.TIMEOUT]
        );
      }

      if (error.message.includes('network') || error.message.includes('Network')) {
        return new GeocodingError(
          MAPTILER_ERROR_CODES.NETWORK_ERROR,
          MAPTILER_ERROR_MESSAGES[MAPTILER_ERROR_CODES.NETWORK_ERROR]
        );
      }

      return new GeocodingError(
        MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
        error.message
      );
    }

    return new GeocodingError(
      MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
      MAPTILER_ERROR_MESSAGES[MAPTILER_ERROR_CODES.UNKNOWN_ERROR]
    );
  }

  /**
   * Clear cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: number } {
    return {
      size: this.cache.size,
      entries: this.cache.size,
    };
  }

  /**
   * Reset service
   */
  public reset(): void {
    this.cache.clear();
  }
}

/**
 * Export singleton instance
 */
export const geocodingService = GeocodingService.getInstance();
