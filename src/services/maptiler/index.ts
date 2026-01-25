/**
 * MapTiler Services Barrel Export
 * Consolidated export point for all MapTiler services and types
 */

// ============================================================================
// IMPORTS
// ============================================================================

import { maptilerConfig } from './maptilerConfig';
import { mapService } from './mapService';
import { geocodingService } from './geocodingService';
import { routingService } from './routingService';
import {
  MAPTILER_API_URLS,
  MAPTILER_STYLES,
  MAP_STYLE_PRESETS,
  GEOCODING_TYPES,
  ROUTING_PROFILES,
  DEFAULT_MAP_CONFIG,
  DEFAULT_GEOCODING_OPTIONS,
  DEFAULT_ROUTING_OPTIONS,
  DISTANCE_UNITS,
  DEFAULT_BOUNDS,
  FRANCE_CENTERS,
  MARKER_COLORS,
  MARKER_PRESETS,
  MAPTILER_ERROR_CODES,
  MAPTILER_ERROR_MESSAGES,
  API_TIMEOUT,
  API_RETRY_CONFIG,
  CACHE_CONFIG,
  MAPTILER_FEATURES,
} from './maptilerConfig';

// ============================================================================
// CONFIGURATION EXPORTS
// ============================================================================

export {
  // Configuration Service
  MapTilerConfigService,
  maptilerConfig,

  // Constants - API URLs
  MAPTILER_API_URLS,

  // Constants - Styles
  MAPTILER_STYLES,
  MAP_STYLE_PRESETS,

  // Constants - Geocoding
  GEOCODING_TYPES,

  // Constants - Routing
  ROUTING_PROFILES,

  // Constants - Defaults
  DEFAULT_MAP_CONFIG,
  DEFAULT_GEOCODING_OPTIONS,
  DEFAULT_ROUTING_OPTIONS,

  // Constants - Units & Locations
  DISTANCE_UNITS,
  DEFAULT_BOUNDS,
  FRANCE_CENTERS,

  // Constants - Markers
  MARKER_COLORS,
  MARKER_PRESETS,

  // Constants - Errors
  MAPTILER_ERROR_CODES,
  MAPTILER_ERROR_MESSAGES,

  // Constants - Configuration
  API_TIMEOUT,
  API_RETRY_CONFIG,
  CACHE_CONFIG,

  // Constants - Features
  MAPTILER_FEATURES,

  // Types
  type MapTilerApiConfig,
  type MapConfiguration,
  type GeocodingOptions,
  type RoutingOptions,
  type MarkerConfig,
  type LayerConfig,
  type GeoJSONFeature,
  type GeoJSONGeometry,
  type GeoJSONFeatureCollection,
  type GeocodingResult,
  type GeocodingContext,
  type GeocodingType,
  type RoutingResult,
  type Route,
  type RouteLeg,
  type RouteStep,
  type Maneuver,
  type Waypoint,
  type MatrixRequest,
  type MatrixResponse,
  type MapStyle,
  type MapEventType,
  type ReverseGeocodingOptions,
  type SearchOptions,
  type Bounds,
  type DistanceMatrixOptions,
  type ControlOptions,
  type PopupOptions,
} from './maptilerConfig';

// ============================================================================
// MAP SERVICE EXPORTS
// ============================================================================

export {
  // Service
  MapService,
  mapService,

  // Types
  type MapEventHandler,
  type MapClickEvent,
  type MarkerInstance,
  type LayerInstance,
  type MapSource,
  type MapStatistics,
} from './mapService';

// ============================================================================
// GEOCODING SERVICE EXPORTS
// ============================================================================

export {
  // Service
  GeocodingService,
  geocodingService,

  // Types
  type CacheEntry,
  type AutocompleteSuggestion,

  // Errors
  GeocodingError,
} from './geocodingService';

// ============================================================================
// ROUTING SERVICE EXPORTS
// ============================================================================

export {
  // Service
  RoutingService,
  routingService,

  // Types
  type RoutingRequest,
  type DistanceResult,
  type RouteCacheEntry,

  // Errors
  RoutingError,
} from './routingService';

// ============================================================================
// GROUPED EXPORTS FOR CONVENIENCE
// ============================================================================

/**
 * All MapTiler services grouped
 */
const maptilerServices = {
  config: maptilerConfig,
  map: mapService,
  geocoding: geocodingService,
  routing: routingService,
};

export { maptilerServices };

/**
 * MapTiler constants collection
 */
const maptilerConstants = {
  urls: MAPTILER_API_URLS,
  styles: MAPTILER_STYLES,
  stylePresets: MAP_STYLE_PRESETS,
  geocoding: GEOCODING_TYPES,
  routing: ROUTING_PROFILES,
  defaults: {
    map: DEFAULT_MAP_CONFIG,
    geocoding: DEFAULT_GEOCODING_OPTIONS,
    routing: DEFAULT_ROUTING_OPTIONS,
  },
  distances: DISTANCE_UNITS,
  locations: {
    bounds: DEFAULT_BOUNDS,
    centers: FRANCE_CENTERS,
  },
  markers: {
    colors: MARKER_COLORS,
    presets: MARKER_PRESETS,
  },
  errors: {
    codes: MAPTILER_ERROR_CODES,
    messages: MAPTILER_ERROR_MESSAGES,
  },
  api: {
    timeout: API_TIMEOUT,
    retry: API_RETRY_CONFIG,
    cache: CACHE_CONFIG,
  },
  features: MAPTILER_FEATURES,
};

export { maptilerConstants };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

/**
 * MapTiler services default export
 */
const maptilerDefaultExport = {
  services: maptilerServices,
  constants: maptilerConstants,
  config: maptilerConfig,
  map: mapService,
  geocoding: geocodingService,
  routing: routingService,
};

export default maptilerDefaultExport;
