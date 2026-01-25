/**
 * MapTiler Routing Service
 * Provides routing, directions, distance matrix calculations
 */

import {
  RoutingOptions,
  RoutingResult,
  MatrixRequest,
  MatrixResponse,
  DistanceMatrixOptions,
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
 * Routing Request
 */
export interface RoutingRequest {
  coordinates: [number, number][];
  profile?: 'car' | 'foot' | 'bike';
  options?: RoutingOptions;
}

/**
 * Distance Result
 */
export interface DistanceResult {
  from: [number, number];
  to: [number, number];
  distance: number;
  duration: number;
  unit: 'kilometers' | 'miles' | 'meters';
}

/**
 * Routing Service Error
 */
export class RoutingError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'RoutingError';
  }
}

/**
 * Route Cache Entry
 */
export interface RouteCacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// ============================================================================
// ROUTING SERVICE CLASS
// ============================================================================

/**
 * MapTiler Routing Service
 * Handles route calculation, directions, and distance matrices
 */
export class RoutingService {
  private static instance: RoutingService;
  private cache: Map<string, RouteCacheEntry<unknown>> = new Map();

  private constructor() {
    this.initializeCache();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RoutingService {
    if (!RoutingService.instance) {
      RoutingService.instance = new RoutingService();
    }
    return RoutingService.instance;
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
    const entry = this.cache.get(key) as RouteCacheEntry<T> | undefined;

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
   * Calculate route
   */
  public async calculateRoute(request: RoutingRequest): Promise<RoutingResult> {
    if (!request.coordinates || request.coordinates.length < 2) {
      throw new RoutingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'At least 2 coordinates are required'
      );
    }

    // Validate all coordinates
    for (const coord of request.coordinates) {
      if (!maptilerConfig.validateCoordinates(coord)) {
        throw new RoutingError(
          MAPTILER_ERROR_CODES.INVALID_COORDINATES,
          'Invalid coordinates in route request'
        );
      }
    }

    if (!maptilerConfig.isConfigured()) {
      throw new RoutingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'MapTiler not configured'
      );
    }

    const cacheKey = this.buildCacheKey('route', request);
    const cached = this.getCacheEntry<RoutingResult>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const result = await this.performRoutingRequest(request);
      this.setCacheEntry(cacheKey, result, CACHE_CONFIG.ROUTING_TTL);
      return result;
    } catch (error) {
      throw this.handleRoutingError(error);
    }
  }

  /**
   * Calculate distance between two points
   */
  public async calculateDistance(
    from: [number, number],
    to: [number, number],
    profile?: 'car' | 'foot' | 'bike',
    unit: 'kilometers' | 'miles' | 'meters' = 'kilometers'
  ): Promise<DistanceResult> {
    if (!maptilerConfig.validateCoordinates(from) || !maptilerConfig.validateCoordinates(to)) {
      throw new RoutingError(
        MAPTILER_ERROR_CODES.INVALID_COORDINATES,
        'Invalid coordinates'
      );
    }

    const request: RoutingRequest = {
      coordinates: [from, to],
      profile: profile || 'car',
      options: {
        annotations: ['distance', 'duration'],
        geometries: 'geojson',
      },
    };

    const result = await this.calculateRoute(request);

    if (!result.routes || result.routes.length === 0) {
      throw new RoutingError(
        MAPTILER_ERROR_CODES.ZERO_RESULTS,
        'No route found between the two points'
      );
    }

    const route = result.routes[0];
    let distance = route.distance;

    // Convert distance to requested unit
    if (unit === 'miles') {
      distance = distance / 1.60934;
    } else if (unit === 'meters') {
      // Keep in meters (distance is in meters from API)
    }

    return {
      from,
      to,
      distance,
      duration: route.duration,
      unit,
    };
  }

  /**
   * Calculate distance matrix (multiple origins to multiple destinations)
   */
  public async calculateDistanceMatrix(
    request: MatrixRequest,
    options?: DistanceMatrixOptions
  ): Promise<MatrixResponse> {
    if (!request.coordinates || request.coordinates.length < 2) {
      throw new RoutingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'At least 2 coordinates are required'
      );
    }

    // Validate all coordinates
    for (const coord of request.coordinates) {
      if (!maptilerConfig.validateCoordinates(coord)) {
        throw new RoutingError(
          MAPTILER_ERROR_CODES.INVALID_COORDINATES,
          'Invalid coordinates in distance matrix request'
        );
      }
    }

    if (!maptilerConfig.isConfigured()) {
      throw new RoutingError(
        MAPTILER_ERROR_CODES.INVALID_REQUEST,
        'MapTiler not configured'
      );
    }

    const cacheKey = this.buildCacheKey('matrix', {
      coordinates: request.coordinates,
      profile: request.profile,
    });

    const cached = this.getCacheEntry<MatrixResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.performMatrixRequest(request, options);
      this.setCacheEntry(cacheKey, result, CACHE_CONFIG.ROUTING_TTL);
      return result;
    } catch (error) {
      throw this.handleRoutingError(error);
    }
  }

  /**
   * Get alternative routes
   */
  public async getAlternativeRoutes(request: RoutingRequest): Promise<RoutingResult> {
    const options: RoutingOptions = {
      ...(request.options || {}),
      alternatives: true,
    };

    return this.calculateRoute({
      ...request,
      options,
    });
  }

  /**
   * Perform routing request with retry
   */
  private async performRoutingRequest(request: RoutingRequest): Promise<RoutingResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= API_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = API_RETRY_CONFIG.retryDelay *
            Math.pow(API_RETRY_CONFIG.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const url = this.buildRoutingUrl(request);
        const response = await this.fetchWithTimeout(url, API_TIMEOUT);

        if (!response.ok) {
          const errorCode = this.mapHttpErrorToCode(response.status);
          throw new RoutingError(
            errorCode,
            MAPTILER_ERROR_MESSAGES[errorCode] || 'Routing request failed',
            response.status
          );
        }

        const data = await response.json() as RoutingResult;

        if (data.code !== 'Ok') {
          throw new RoutingError(
            MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
            `Routing failed: ${data.code}`
          );
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof RoutingError) {
          throw error;
        }

        if (attempt === API_RETRY_CONFIG.maxRetries) {
          break;
        }
      }
    }

    throw lastError || new RoutingError(
      MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
      'Routing request failed'
    );
  }

  /**
   * Perform matrix request
   */
  private async performMatrixRequest(
    request: MatrixRequest,
    options?: DistanceMatrixOptions
  ): Promise<MatrixResponse> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= API_RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = API_RETRY_CONFIG.retryDelay *
            Math.pow(API_RETRY_CONFIG.backoffMultiplier, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const url = this.buildMatrixUrl(request, options);
        const response = await this.fetchWithTimeout(url, API_TIMEOUT);

        if (!response.ok) {
          const errorCode = this.mapHttpErrorToCode(response.status);
          throw new RoutingError(
            errorCode,
            MAPTILER_ERROR_MESSAGES[errorCode] || 'Matrix request failed',
            response.status
          );
        }

        const data = await response.json() as MatrixResponse;

        if (data.code !== 'Ok') {
          throw new RoutingError(
            MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
            `Matrix calculation failed: ${data.code}`
          );
        }

        return data;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (error instanceof RoutingError) {
          throw error;
        }

        if (attempt === API_RETRY_CONFIG.maxRetries) {
          break;
        }
      }
    }

    throw lastError || new RoutingError(
      MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
      'Matrix request failed'
    );
  }

  /**
   * Build routing URL
   */
  private buildRoutingUrl(request: RoutingRequest): string {
    const baseUrl = maptilerConfig.getRoutingUrl();
    const profile = request.profile || 'car';
    const coordString = request.coordinates
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(';');

    const params: Record<string, unknown> = {};

    if (request.options) {
      if (request.options.alternatives) {
        params.alternatives = true;
      }
      if (request.options.steps) {
        params.steps = true;
      }
      if (request.options.annotations) {
        params.annotations = request.options.annotations.join(',');
      }
      if (request.options.geometries) {
        params.geometries = request.options.geometries;
      }
      if (request.options.language) {
        params.language = request.options.language;
      }
      if (request.options.excludeFeatures) {
        params.exclude = request.options.excludeFeatures.join(',');
      }
    }

    const queryString = maptilerConfig.buildQueryParams(params);
    return `${baseUrl}/${profile}/${coordString}.json?${queryString}`;
  }

  /**
   * Build matrix URL
   */
  private buildMatrixUrl(
    request: MatrixRequest,
    options?: DistanceMatrixOptions
  ): string {
    const baseUrl = maptilerConfig.getRoutingUrl();
    const profile = request.profile || 'car';
    const coordString = request.coordinates
      .map(([lng, lat]) => `${lng},${lat}`)
      .join(';');

    const params: Record<string, unknown> = {};

    if (request.annotations) {
      params.annotations = request.annotations.join(',');
    }

    if (options?.limit) {
      params.limit = true;
    }

    const queryString = maptilerConfig.buildQueryParams(params);
    return `${baseUrl}/${profile}/matrix/${coordString}.json?${queryString}`;
  }

  /**
   * Build cache key
   */
  private buildCacheKey(
    type: string,
    data: unknown
  ): string {
    return `${type}:${JSON.stringify(data)}`;
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
   * Handle routing errors
   */
  private handleRoutingError(error: unknown): RoutingError {
    if (error instanceof RoutingError) {
      return error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new RoutingError(
          MAPTILER_ERROR_CODES.TIMEOUT,
          MAPTILER_ERROR_MESSAGES[MAPTILER_ERROR_CODES.TIMEOUT]
        );
      }

      if (error.message.includes('network') || error.message.includes('Network')) {
        return new RoutingError(
          MAPTILER_ERROR_CODES.NETWORK_ERROR,
          MAPTILER_ERROR_MESSAGES[MAPTILER_ERROR_CODES.NETWORK_ERROR]
        );
      }

      return new RoutingError(
        MAPTILER_ERROR_CODES.UNKNOWN_ERROR,
        error.message
      );
    }

    return new RoutingError(
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
export const routingService = RoutingService.getInstance();
