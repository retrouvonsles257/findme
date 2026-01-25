/**
 * =====================================================
 * RETROUVONSLES - Map Provider Configuration
 * =====================================================
 * Configuration for map services (Mapbox, Google Maps, Leaflet)
 */

import { envConfig } from './env.config';
import type { Geography } from '../@types/database.types';

// ============================================
// MAP PROVIDER CONFIGURATION
// ============================================

export const mapConfig = {
  // Default provider
  provider: 'maptiler' as const, // 'maptiler' | 'mapbox' | 'google' | 'leaflet'

  // MapTiler (Recommended)
  maptiler: {
    apiKey: envConfig.REACT_APP_MAPTILER_API_KEY,
    style: 'https://api.maptiler.com/maps/streets/style.json',
    enabled: !!envConfig.REACT_APP_MAPTILER_API_KEY,
  },

  // Mapbox (Fallback)
  mapbox: {
    accessToken: envConfig.REACT_APP_MAPBOX_ACCESS_TOKEN,
    style: 'mapbox://styles/mapbox/streets-v12',
    enabled: !!envConfig.REACT_APP_MAPBOX_ACCESS_TOKEN,
  },

  // Google Maps (Fallback)
  google: {
    apiKey: envConfig.REACT_APP_GOOGLE_MAPS_API_KEY,
    enabled: !!envConfig.REACT_APP_GOOGLE_MAPS_API_KEY,
  },

  // Leaflet (open-source fallback)
  leaflet: {
    tileLayer: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    enabled: true, // Always available
  },
};

// ============================================
// DEFAULT MAP SETTINGS
// ============================================

export const mapDefaultSettings = {
  // Center (Africa - Cameroon as default)
  center: {
    type: 'Point' as const,
    coordinates: [11.5021, 3.848],
  } as Geography,

  // Zoom levels
  defaultZoom: 6,
  minZoom: 2,
  maxZoom: 18,

  // Pitch and bearing
  pitch: 0,
  bearing: 0,

  // Map style
  style: 'streets',
  // Options: 'streets', 'satellite', 'hybrid', 'terrain', 'dark', 'light'

  // Interaction
  interactive: true,
  draggable: true,
  scrollZoom: true,
  boxZoom: true,
  doubleClickZoom: true,
  touchZoom: true,
  touchPitch: true,

  // Controls
  showCompass: true,
  showZoom: true,
  showFullscreen: true,
  showScale: true,

  // Attribution
  attributionControl: true,
  attributionPosition: 'bottom-right' as const,
};

// ============================================
// MAP STYLES
// ============================================

export const mapStyles = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoor: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  hybrid: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// ============================================
// MARKER CONFIGURATION
// ============================================

export const markerConfig = {
  // Marker sizes
  sizes: {
    small: { width: 24, height: 24 },
    medium: { width: 32, height: 32 },
    large: { width: 48, height: 48 },
  },

  // Marker colors by type
  colors: {
    personne: '#ef4444', // Red - Missing person
    alerte: '#f59e0b', // Amber - Alert
    signalement: '#3b82f6', // Blue - Report
    match: '#10b981', // Green - Match
    organisation: '#8b5cf6', // Purple - Organization
    user: '#06b6d4', // Cyan - User
  },

  // Marker animations
  animations: {
    pulse: true,
    bounce: true,
  },

  // Popup settings
  popup: {
    offset: [0, -10],
    closeButton: true,
    closeOnClick: false,
    maxWidth: 300,
    className: 'map-popup',
  },
};

// ============================================
// CLUSTERING CONFIGURATION
// ============================================

export const clusteringConfig = {
  enabled: true,

  // Cluster radius in pixels
  clusterRadius: 50,

  // Zoom level at which to start clustering
  clusterMaxZoom: 14,

  // Properties to cluster
  clusterProperties: {
    sum: ['+', ['get', 'count']],
  },

  // Paint settings
  clusterPaint: {
    'circle-color': '#51bbd6',
    'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    'circle-stroke-width': 2,
    'circle-stroke-color': 'white',
    'circle-opacity': 0.8,
  },

  // Text in cluster
  clusterTextPaint: {
    'text-color': 'white',
    'text-size': 12,
    'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
  },
};

// ============================================
// HEAT MAP CONFIGURATION
// ============================================

export const heatmapConfig = {
  enabled: true,

  // Property to calculate intensity
  weightProperty: 'weight',

  // Radius of each data point in pixels
  radius: [
    'interpolate',
    ['linear'],
    ['zoom'],
    0, 2,
    22, 180,
  ],

  // Intensity of the heat
  intensity: [
    'interpolate',
    ['linear'],
    ['zoom'],
    0, 0,
    9, 1,
  ],

  // Color ramp from low to high intensity
  color: [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0, 'rgba(0, 0, 255, 0)',
    0.1, '#87ceeb',
    0.3, '#00ff00',
    0.5, '#ffff00',
    0.7, '#ff7f00',
    1, '#ff0000',
  ],

  // Opacity
  opacity: [
    'interpolate',
    ['linear'],
    ['zoom'],
    7, 0,
    9, 0.5,
  ],
};

// ============================================
// GEOFENCING CONFIGURATION
// ============================================

export const geofenceConfig = {
  enabled: true,

  // Default geofence radius in kilometers
  defaultRadiusKm: 50,
  minRadiusKm: 1,
  maxRadiusKm: 500,

  // Geofence styling
  style: {
    strokeColor: '#3b82f6',
    strokeWidth: 2,
    strokeOpacity: 0.8,
    fillColor: '#3b82f6',
    fillOpacity: 0.1,
  },

  // Notification settings
  notifications: {
    enterGeofence: true,
    exitGeofence: true,
    dwellTime: 5 * 60 * 1000, // 5 minutes
  },
};

// ============================================
// ROUTING CONFIGURATION
// ============================================

export const routingConfig = {
  enabled: true,

  // Provider
  provider: 'mapbox' as const, // 'mapbox' | 'google' | 'osrm'

  // Route optimization
  optimization: {
    enabled: true,
    method: 'shortest' as const, // 'shortest' | 'fastest'
  },

  // Route styling
  style: {
    strokeColor: '#3b82f6',
    strokeWidth: 3,
    strokeOpacity: 0.8,
  },

  // Alternative routes
  alternatives: true,
  steps: true,
  geometries: 'geojson',
  overview: 'full',
};

// ============================================
// SEARCH CONFIGURATION
// ============================================

export const mapSearchConfig = {
  enabled: true,

  // Geocoding provider
  provider: 'mapbox' as const, // 'mapbox' | 'google' | 'nominatim'

  // Search settings
  limit: 10,
  proximity: mapDefaultSettings.center,
  types: ['address', 'place', 'region', 'country'],

  // Autocomplete
  autocomplete: true,
  debounce: 300,

  // Language
  language: 'fr',
};

// ============================================
// EXPORT UTILITIES
// ============================================

/**
 * Check if map provider is configured
 */
export const isMapProviderConfigured = (provider: 'mapbox' | 'google' | 'leaflet'): boolean => {
  const config = mapConfig[provider];
  return config.enabled;
};

/**
 * Get center point for a region
 */
export const getRegionCenter = (region: string): Geography => {
  const regionCenters: Record<string, Geography> = {
    cameroon: { type: 'Point', coordinates: [11.5021, 3.848] },
    congo: { type: 'Point', coordinates: [21.758, -4.038] },
    gabon: { type: 'Point', coordinates: [11.609, -0.803] },
    chad: { type: 'Point', coordinates: [18.7322, 15.4542] },
    cote_divoire: { type: 'Point', coordinates: [-5.5471, 7.5400] },
    benin: { type: 'Point', coordinates: [2.3158, 9.3077] },
    africa: { type: 'Point', coordinates: [20, 0] },
  };

  return regionCenters[region.toLowerCase()] || mapDefaultSettings.center;
};
