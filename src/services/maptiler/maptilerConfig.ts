/**
 * MapTiler Configuration Service
 * Initializes MapTiler API, manages configuration, constants
 * Supports maps, geocoding, routing, and other MapTiler services
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * MapTiler API Key Configuration
 */
export interface MapTilerApiConfig {
  apiKey: string;
  baseUrl: string;
  version: string;
}

/**
 * Map Instance Configuration
 */
export interface MapConfiguration {
  container: string | HTMLElement;
  style: string;
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  minZoom?: number;
  maxZoom?: number;
  interactive?: boolean;
  attributionControl?: boolean;
  hash?: boolean;
}

/**
 * Geocoding Request Options
 */
export interface GeocodingOptions {
  limit?: number;
  proximity?: [number, number];
  country?: string;
  language?: string;
  bbox?: [number, number, number, number];
  fuzzyMatch?: boolean;
  types?: GeocodingType[];
}

/**
 * Routing Options
 */
export interface RoutingOptions {
  profile?: 'car' | 'foot' | 'bike';
  alternatives?: boolean;
  steps?: boolean;
  annotations?: ('duration' | 'distance' | 'speed')[];
  geometries?: 'geojson' | 'polyline' | 'polyline6';
  language?: string;
  excludeFeatures?: string[];
}

/**
 * Marker Configuration
 */
export interface MarkerConfig {
  id: string;
  coordinates: [number, number];
  title?: string;
  description?: string;
  color?: string;
  icon?: string;
  draggable?: boolean;
  popup?: boolean;
  popupContent?: string;
  className?: string;
  properties?: Record<string, unknown>;
}

/**
 * Layer Configuration
 */
export interface LayerConfig {
  id: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'heatmap' | 'fill-extrusion' | 'raster' | 'background';
  source: string | object;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
}

/**
 * GeoJSON Feature
 */
export interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONGeometry;
  properties: Record<string, unknown>;
  id?: string | number;
}

/**
 * GeoJSON Geometry
 */
export type GeoJSONGeometry = 
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }
  | { type: 'MultiPoint'; coordinates: [number, number][] }
  | { type: 'MultiLineString'; coordinates: [number, number][][] }
  | { type: 'MultiPolygon'; coordinates: [number, number][][][] };

/**
 * GeoJSON Feature Collection
 */
export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Geocoding Result
 */
export interface GeocodingResult {
  id: string;
  type: GeocodingType;
  name: string;
  shortCode?: string;
  geometry: {
    coordinates: [number, number];
  };
  center?: [number, number];
  boundingBox?: [number, number, number, number];
  context?: GeocodingContext[];
  properties?: Record<string, unknown>;
  relevance?: number;
  matchingText?: string;
}

/**
 * Geocoding Context Information
 */
export interface GeocodingContext {
  id: string;
  type: GeocodingType;
  name: string;
  shortCode?: string;
  wikiData?: string;
}

/**
 * Routing Result
 */
export interface RoutingResult {
  code: string;
  routes: Route[];
  waypoints: Waypoint[];
}

/**
 * Route Information
 */
export interface Route {
  distance: number;
  duration: number;
  geometry: string | [number, number][];
  legs: RouteLeg[];
  steps?: RouteStep[];
  weight?: number;
  weightName?: string;
}

/**
 * Route Leg
 */
export interface RouteLeg {
  distance: number;
  duration: number;
  steps?: RouteStep[];
  summary?: string;
  weight?: number;
}

/**
 * Route Step
 */
export interface RouteStep {
  distance: number;
  duration: number;
  geometry: string | [number, number][];
  name?: string;
  instruction?: string;
  maneuver?: Maneuver;
  mode?: string;
  weight?: number;
}

/**
 * Turn Maneuver Information
 */
export interface Maneuver {
  location: [number, number];
  bearing_before?: number;
  bearing_after?: number;
  type: string;
  modifier?: string;
  exit?: number;
}

/**
 * Waypoint Information
 */
export interface Waypoint {
  name: string;
  location: [number, number];
  distance?: number;
  hint?: string;
}

/**
 * Matrix Request
 */
export interface MatrixRequest {
  coordinates: [number, number][];
  profile?: 'car' | 'foot' | 'bike';
  annotations?: ('duration' | 'distance')[];
}

/**
 * Matrix Response
 */
export interface MatrixResponse {
  code: string;
  distances: number[][];
  durations: number[][];
  sources: Waypoint[];
  destinations: Waypoint[];
}

/**
 * Map Style
 */
export interface MapStyle {
  id: string;
  name: string;
  url: string;
  thumbnail?: string;
  description?: string;
}

/**
 * Geocoding Type
 */
export type GeocodingType = 
  | 'country'
  | 'region'
  | 'province'
  | 'district'
  | 'postcode'
  | 'place'
  | 'locality'
  | 'neighborhood'
  | 'address'
  | 'street'
  | 'household';

/**
 * Map Event Types
 */
export type MapEventType = 
  | 'load'
  | 'click'
  | 'dblclick'
  | 'contextmenu'
  | 'mousedown'
  | 'mouseup'
  | 'mousemove'
  | 'mouseover'
  | 'mouseout'
  | 'touchstart'
  | 'touchend'
  | 'touchcancel'
  | 'zoom'
  | 'rotate'
  | 'pitch'
  | 'drag'
  | 'style.load'
  | 'sourcedata'
  | 'data'
  | 'tiledatatype'
  | 'styleimagemissing'
  | 'error';

/**
 * Reverse Geocoding Options
 */
export interface ReverseGeocodingOptions {
  limit?: number;
  types?: GeocodingType[];
  language?: string;
}

/**
 * Search/Autocomplete Options
 */
export interface SearchOptions {
  limit?: number;
  proximity?: [number, number];
  country?: string;
  types?: GeocodingType[];
  language?: string;
}

/**
 * Bounds/BBox
 */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Distance Matrix Options
 */
export interface DistanceMatrixOptions {
  profile?: 'car' | 'foot' | 'bike';
  annotations?: ('duration' | 'distance')[];
  limit?: boolean;
}

/**
 * Map Control Options
 */
export interface ControlOptions {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

/**
 * Marker Popup Options
 */
export interface PopupOptions {
  offset?: [number, number];
  anchor?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  className?: string;
  closeButton?: boolean;
  closeOnClick?: boolean;
  maxWidth?: string;
  focusAfterOpen?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * MapTiler API Base URLs
 */
export const MAPTILER_API_URLS = {
  MAPS: 'https://api.maptiler.com/maps',
  GEOCODING: 'https://api.maptiler.com/geocoding',
  ROUTING: 'https://api.maptiler.com/routing',
  STATIC: 'https://api.maptiler.com/static',
  TILES: 'https://api.maptiler.com/tiles',
  FONTS: 'https://api.maptiler.com/fonts',
  SPRITES: 'https://api.maptiler.com/sprites',
  DATA: 'https://api.maptiler.com/data',
} as const;

/**
 * MapTiler Available Styles
 */
export const MAPTILER_STYLES = {
  BASIC: 'https://api.maptiler.com/maps/basic-v2/style.json',
  BRIGHT: 'https://api.maptiler.com/maps/bright-v2/style.json',
  DARK: 'https://api.maptiler.com/maps/dark-v2/style.json',
  LANDSCAPE: 'https://api.maptiler.com/maps/landscape-v2/style.json',
  OUTDOOR: 'https://api.maptiler.com/maps/outdoor-v2/style.json',
  PASTEL: 'https://api.maptiler.com/maps/pastel-v2/style.json',
  SATELLITE: 'https://api.maptiler.com/maps/satellite-v2/style.json',
  STREETS: 'https://api.maptiler.com/maps/streets-v2/style.json',
  TONER: 'https://api.maptiler.com/maps/toner-v2/style.json',
  TONER_BACKGROUND: 'https://api.maptiler.com/maps/toner-background-v2/style.json',
  TONER_HYBRID: 'https://api.maptiler.com/maps/toner-hybrid-v2/style.json',
  TONER_LITE: 'https://api.maptiler.com/maps/toner-lite-v2/style.json',
  TONER_LINES: 'https://api.maptiler.com/maps/toner-lines-v2/style.json',
  WINTER: 'https://api.maptiler.com/maps/winter-v2/style.json',
} as const;

/**
 * Default Map Styles for RETROUVONSLES
 */
export const MAP_STYLE_PRESETS = {
  SEARCH: MAPTILER_STYLES.STREETS,
  DIRECTIONS: MAPTILER_STYLES.BRIGHT,
  DISPLAY: MAPTILER_STYLES.OUTDOOR,
  MISSING_PERSONS: MAPTILER_STYLES.SATELLITE,
  FOUND_PERSONS: MAPTILER_STYLES.BRIGHT,
  ORGANIZATIONS: MAPTILER_STYLES.BASIC,
  HEATMAP: MAPTILER_STYLES.DARK,
} as const;

/**
 * Geocoding Types
 */
export const GEOCODING_TYPES = {
  COUNTRY: 'country' as const,
  REGION: 'region' as const,
  PROVINCE: 'province' as const,
  DISTRICT: 'district' as const,
  POSTCODE: 'postcode' as const,
  PLACE: 'place' as const,
  LOCALITY: 'locality' as const,
  NEIGHBORHOOD: 'neighborhood' as const,
  ADDRESS: 'address' as const,
  STREET: 'street' as const,
  HOUSEHOLD: 'household' as const,
} as const;

/**
 * Routing Profiles
 */
export const ROUTING_PROFILES = {
  CAR: 'car' as const,
  FOOT: 'foot' as const,
  BIKE: 'bike' as const,
} as const;

/**
 * Default Map Configuration
 */
export const DEFAULT_MAP_CONFIG: Partial<MapConfiguration> = {
  zoom: 12,
  pitch: 0,
  bearing: 0,
  minZoom: 2,
  maxZoom: 20,
  interactive: true,
  attributionControl: true,
  hash: false,
};

/**
 * Default Geocoding Options
 */
export const DEFAULT_GEOCODING_OPTIONS: Partial<GeocodingOptions> = {
  limit: 10,
  fuzzyMatch: true,
  language: 'fr',
};

/**
 * Default Routing Options
 */
export const DEFAULT_ROUTING_OPTIONS: Partial<RoutingOptions> = {
  profile: 'car',
  alternatives: false,
  steps: true,
  geometries: 'geojson',
  language: 'fr',
};

/**
 * Distance Conversions
 */
export const DISTANCE_UNITS = {
  METERS: 'meters' as const,
  KILOMETERS: 'kilometers' as const,
  MILES: 'miles' as const,
  FEET: 'feet' as const,
} as const;

/**
 * Default Bounds (France)
 */
export const DEFAULT_BOUNDS = {
  minX: -5.14,
  minY: 41.26,
  maxX: 8.23,
  maxY: 51.09,
} as const;

/**
 * Center Points for France
 */
export const FRANCE_CENTERS = {
  FRANCE: [2.2137, 46.2276] as [number, number],
  PARIS: [2.3522, 48.8566] as [number, number],
  MARSEILLE: [5.3698, 43.2965] as [number, number],
  LYON: [4.8357, 45.7640] as [number, number],
  TOULOUSE: [1.4442, 43.6047] as [number, number],
  NICE: [7.2620, 43.7102] as [number, number],
  NANTES: [-1.5536, 47.2184] as [number, number],
  STRASBOURG: [7.7519, 48.5734] as [number, number],
  MONTPELLIER: [3.8767, 43.6108] as [number, number],
  BORDEAUX: [-0.5792, 44.8378] as [number, number],
} as const;

/**
 * Color Palette for Markers
 */
export const MARKER_COLORS = {
  RED: '#FF0000',
  BLUE: '#0000FF',
  GREEN: '#00AA00',
  ORANGE: '#FFA500',
  PURPLE: '#800080',
  PINK: '#FF69B4',
  YELLOW: '#FFFF00',
  CYAN: '#00FFFF',
  GRAY: '#808080',
  BLACK: '#000000',
} as const;

/**
 * Marker Presets for RETROUVONSLES
 */
export const MARKER_PRESETS = {
  MISSING_PERSON: {
    color: MARKER_COLORS.RED,
    icon: 'alert-circle',
  },
  FOUND_PERSON: {
    color: MARKER_COLORS.GREEN,
    icon: 'check-circle',
  },
  LAST_SEEN: {
    color: MARKER_COLORS.ORANGE,
    icon: 'map-pin',
  },
  ORGANIZATION: {
    color: MARKER_COLORS.BLUE,
    icon: 'building',
  },
  WITNESS: {
    color: MARKER_COLORS.PURPLE,
    icon: 'eye',
  },
} as const;

/**
 * API Error Codes
 */
export const MAPTILER_ERROR_CODES = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  NOT_FOUND: 'NOT_FOUND',
  ZERO_RESULTS: 'ZERO_RESULTS',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  REQUEST_DENIED: 'REQUEST_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_BOUNDS: 'INVALID_BOUNDS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * User-Friendly Error Messages
 */
export const MAPTILER_ERROR_MESSAGES: Record<string, string> = {
  INVALID_API_KEY: 'Clé API MapTiler invalide',
  NOT_FOUND: 'Ressource non trouvée',
  ZERO_RESULTS: 'Aucun résultat trouvé pour cette recherche',
  QUOTA_EXCEEDED: 'Limite d\'utilisation dépassée',
  REQUEST_DENIED: 'Requête refusée',
  INVALID_REQUEST: 'Requête invalide',
  UNKNOWN_ERROR: 'Erreur inconnue',
  NETWORK_ERROR: 'Erreur de connexion réseau',
  TIMEOUT: 'Délai d\'attente dépassé',
  INVALID_COORDINATES: 'Coordonnées invalides',
  INVALID_BOUNDS: 'Limites géographiques invalides',
  SERVICE_UNAVAILABLE: 'Service temporairement indisponible',
};

/**
 * API Request Timeout (ms)
 */
export const API_TIMEOUT = 30000;

/**
 * API Retry Configuration
 */
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
} as const;

/**
 * Cache Configuration
 */
export const CACHE_CONFIG = {
  GEOCODING_TTL: 3600000, // 1 hour
  ROUTING_TTL: 1800000, // 30 minutes
  TILES_TTL: 86400000, // 24 hours
} as const;

/**
 * Feature Flags
 */
export const MAPTILER_FEATURES = {
  CLUSTERING: true,
  HEATMAPS: true,
  ANIMATIONS: true,
  OFFLINE_SUPPORT: true,
  CACHING: true,
  AUTOCOMPLETE: true,
  MATRIX_ROUTING: true,
} as const;

// ============================================================================
// CONFIGURATION CLASS
// ============================================================================

/**
 * MapTiler Configuration Service
 * Manages API keys, URLs, constants, and service configuration
 */
export class MapTilerConfigService {
  private static instance: MapTilerConfigService;
  private apiKey: string = '';
  private configured: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): MapTilerConfigService {
    if (!MapTilerConfigService.instance) {
      MapTilerConfigService.instance = new MapTilerConfigService();
    }
    return MapTilerConfigService.instance;
  }

  /**
   * Initialize MapTiler configuration
   */
  public initialize(apiKey: string): void {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('MapTiler API key is required');
    }

    this.apiKey = apiKey;
    this.configured = true;
  }

  /**
   * Get MapTiler API key
   */
  public getApiKey(): string {
    if (!this.configured) {
      throw new Error('MapTiler not configured. Call initialize() first');
    }
    return this.apiKey;
  }

  /**
   * Check if MapTiler is configured
   */
  public isConfigured(): boolean {
    return this.configured;
  }

  /**
   * Get API config
   */
  public getApiConfig(): MapTilerApiConfig {
    return {
      apiKey: this.getApiKey(),
      baseUrl: MAPTILER_API_URLS.MAPS,
      version: 'v2',
    };
  }

  /**
   * Get style URL with API key
   */
  public getStyleUrl(styleId: string): string {
    const apiKey = this.getApiKey();
    return `${MAPTILER_STYLES[styleId as keyof typeof MAPTILER_STYLES] || MAPTILER_STYLES.BASIC}?key=${apiKey}`;
  }

  /**
   * Get tile server URL
   */
  public getTileUrl(tilesetId: string): string {
    const apiKey = this.getApiKey();
    return `https://api.maptiler.com/tiles/${tilesetId}/{z}/{x}/{y}.pbf?key=${apiKey}`;
  }

  /**
   * Get geocoding URL
   */
  public getGeocodingUrl(): string {
    return `${MAPTILER_API_URLS.GEOCODING}/v1`;
  }

  /**
   * Get routing URL
   */
  public getRoutingUrl(): string {
    return `${MAPTILER_API_URLS.ROUTING}/v1`;
  }

  /**
   * Build query parameters
   */
  public buildQueryParams(params: Record<string, unknown>): string {
    const apiKey = this.getApiKey();
    const allParams = { ...params, key: apiKey };

    return Object.entries(allParams)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}=${value.join(',')}`;
        }
        return `${key}=${encodeURIComponent(String(value))}`;
      })
      .join('&');
  }

  /**
   * Validate coordinates
   */
  public validateCoordinates(coords: [number, number]): boolean {
    const [lon, lat] = coords;
    return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
  }

  /**
   * Validate bounds
   */
  public validateBounds(bounds: [number, number, number, number]): boolean {
    const [minX, minY, maxX, maxY] = bounds;
    return (
      minX >= -180 &&
      maxX <= 180 &&
      minY >= -90 &&
      maxY <= 90 &&
      minX < maxX &&
      minY < maxY
    );
  }

  /**
   * Reset configuration
   */
  public reset(): void {
    this.apiKey = '';
    this.configured = false;
  }
}

/**
 * Export singleton instance
 */
export const maptilerConfig = MapTilerConfigService.getInstance();
