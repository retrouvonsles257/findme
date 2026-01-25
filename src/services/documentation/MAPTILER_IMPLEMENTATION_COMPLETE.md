# MapTiler Services - Complete Implementation Guide

**Full API Reference & Architecture**

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Configuration Service](#configuration-service)
3. [Map Service](#map-service)
4. [Geocoding Service](#geocoding-service)
5. [Routing Service](#routing-service)
6. [Type Definitions](#type-definitions)
7. [Constants Reference](#constants-reference)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)

---

## Architecture Overview

MapTiler services are built on a singleton pattern with 4 core services:

```
┌─────────────────────────────────────────┐
│     MapTiler Config Service             │
│  (Initialization, Constants, Validation)│
└──────────────┬──────────────────────────┘
               │
     ┌─────────┼─────────┬──────────┐
     │         │         │          │
     ▼         ▼         ▼          ▼
┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐
│   Map   │ │Geocoding │ │Routing │ │Analytics │
│Service  │ │Service   │ │Service │ │ (Future) │
└─────────┘ └──────────┘ └────────┘ └──────────┘
```

**Key Features:**
- ✅ Singleton pattern for single instance
- ✅ Cache management with TTL
- ✅ Automatic retry with exponential backoff
- ✅ TypeScript strict mode compliance
- ✅ Comprehensive error handling
- ✅ Memory leak prevention

---

## Configuration Service

The configuration service manages MapTiler initialization and settings.

### Initialization

```typescript
import { maptilerConfig } from '@/services/maptiler';

// Initialize (typically in App.tsx or during startup)
maptilerConfig.initialize(process.env.REACT_APP_MAPTILER_API_KEY || '');

// Check if configured
if (maptilerConfig.isConfigured()) {
  // Safe to use other services
}
```

### Configuration Methods

```typescript
// Get API key
const apiKey = maptilerConfig.getApiKey();

// Get configuration object
const config = maptilerConfig.getApiConfig();
// { apiKey: "...", baseUrl: "https://api.maptiler.com/maps", version: "v2" }

// Get style URL with API key
const styleUrl = maptilerConfig.getStyleUrl('BASIC');

// Get tile server URL
const tileUrl = maptilerConfig.getTileUrl('my-tileset');

// Get geocoding URL
const geocodingUrl = maptilerConfig.getGeocodingUrl();

// Get routing URL
const routingUrl = maptilerConfig.getRoutingUrl();

// Build query parameters
const query = maptilerConfig.buildQueryParams({
  limit: 10,
  types: ['place', 'address'],
});
```

### Validation Methods

```typescript
// Validate coordinates [lon, lat]
const isValid = maptilerConfig.validateCoordinates([2.3522, 48.8566]);

// Validate bounds [minX, minY, maxX, maxY]
const boundsValid = maptilerConfig.validateBounds([-5.14, 41.26, 8.23, 51.09]);

// Reset configuration
maptilerConfig.reset();
```

---

## Map Service

### Initialization

```typescript
import { mapService } from '@/services/maptiler';
import { MAP_STYLE_PRESETS } from '@/services/maptiler';

// Initialize map
await mapService.initializeMap({
  container: 'map-container',      // HTML element ID or element
  style: MAP_STYLE_PRESETS.STREETS,
  center: [2.3522, 48.8566],        // [longitude, latitude]
  zoom: 12,
  pitch: 0,                          // 0-60 degrees
  bearing: 0,                        // 0-360 degrees
  minZoom: 2,
  maxZoom: 20,
  interactive: true,
  attributionControl: true,
  hash: false,
});

// Check if initialized
if (mapService.isMapInitialized()) {
  // Can use map
}
```

### Navigation Methods

```typescript
// Set center with animation
mapService.setCenter([2.3522, 48.8566], 14, 1000); // zoom, duration ms

// Get current center
const [lng, lat] = mapService.getCenter();

// Set zoom
mapService.setZoom(16, 1000); // duration ms

// Get current zoom
const zoom = mapService.getZoom();

// Fit to bounds
mapService.fitBounds([-5.14, 41.26, 8.23, 51.09], {
  padding: 50,
});

// Get current bounds
const bounds = mapService.getBounds();
// { minX: -180, minY: -85, maxX: 180, maxY: 85 }

// Set 3D pitch
mapService.setPitch(45, 1000); // angle, duration

// Get pitch
const pitch = mapService.getPitch(); // 0-60

// Set bearing (rotation)
mapService.setBearing(90, 1000); // degrees, duration

// Get bearing
const bearing = mapService.getBearing(); // 0-360
```

### Markers

```typescript
// Add marker
const marker = mapService.addMarker({
  id: 'marker-1',
  coordinates: [2.3522, 48.8566],
  title: 'Location Title',
  description: 'Optional description',
  color: '#FF0000',
  icon: 'alert-circle',
  draggable: false,
  popup: true,
  popupContent: '<h3>Title</h3><p>Content</p>',
  className: 'my-marker',
  properties: {
    custom: 'data',
  },
});

// Update marker
mapService.updateMarker('marker-1', {
  coordinates: [2.3, 48.9],
  title: 'New Title',
});

// Get marker
const marker = mapService.getMarker('marker-1');

// Get all markers
const markers = mapService.getMarkers();

// Remove marker
mapService.removeMarker('marker-1');

// Clear all markers
mapService.clearMarkers();

// Marker instance methods
marker.setLngLat([2.3, 48.9]);
marker.setDraggable(true);
marker.togglePopup();
const coords = marker.getCoordinates();
```

### Layers

```typescript
// Add layer
mapService.addLayer({
  id: 'layer-1',
  type: 'circle',              // fill, line, symbol, circle, heatmap, etc.
  source: 'source-id',
  paint: {
    'circle-radius': 8,
    'circle-color': '#FF0000',
    'circle-opacity': 0.8,
  },
  layout: {
    'circle-sort-key': 0,
  },
  filter: ['==', 'type', 'point'],
  minzoom: 10,
  maxzoom: 18,
});

// Get layer
const layer = mapService.getLayer('layer-1');

// Get all layers
const layers = mapService.getLayers();

// Remove layer
mapService.removeLayer('layer-1');

// Layer instance methods
layer.getVisibility();      // boolean
layer.setVisibility(false);
layer.getOpacity();         // 0-1
layer.setOpacity(0.5);
```

### Sources

```typescript
// Add GeoJSON source
mapService.addGeoJSONSource('my-source', {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [2.3522, 48.8566],
      },
      properties: {
        name: 'Paris',
      },
    },
  ],
});

// Update GeoJSON source
mapService.updateGeoJSONSource('my-source', newData);

// Get source
const source = mapService.getSource('my-source');

// Remove source
mapService.removeSource('my-source');

// Add generic source
mapService.addSource('my-source', {
  id: 'my-source',
  type: 'geojson',
  data: geojsonData,
});
```

### Controls

```typescript
// Add custom control
mapService.addControl(customControl, 'top-left');

// Remove control
mapService.removeControl(customControl);
```

### Events

```typescript
// Listen to map events
mapService.on('load', () => {
  console.log('Map loaded');
});

mapService.on('click', (event) => {
  console.log('Clicked at:', event.lngLat);
});

mapService.on('zoom', () => {
  console.log('Zoom changed');
});

mapService.on('move', () => {
  console.log('Map moved');
});

// Remove listener
mapService.off('click', handler);
```

### Statistics & Utils

```typescript
// Get map statistics
const stats = mapService.getStatistics();
// {
//   markersCount: 5,
//   layersCount: 3,
//   sourcesCount: 2,
//   isLoaded: true,
//   bounds: { minX: -5, minY: 41, maxX: 8, maxY: 51 }
// }

// Get raw map instance (advanced)
const mapInstance = mapService.getMapInstance();

// Destroy map
mapService.destroy();

// Reset service
mapService.reset();
```

---

## Geocoding Service

### Forward Geocoding

```typescript
import { geocodingService } from '@/services/maptiler';

// Simple search
const results = await geocodingService.forwardGeocode('Paris');

// With options
const results = await geocodingService.forwardGeocode('Paris', {
  limit: 10,                          // Max results
  proximity: [2.3522, 48.8566],      // Bias results near coordinates
  country: 'FR',                      // Filter by country code
  types: ['place', 'locality'],      // Filter by types
  language: 'fr',                     // Result language
  bbox: [-5.14, 41.26, 8.23, 51.09], // Restrict to bounds
  fuzzyMatch: true,                   // Allow typos
});

// Result structure
const result = results[0];
console.log({
  id: result.id,
  type: result.type,        // 'place', 'address', etc.
  name: result.name,
  coordinates: result.geometry.coordinates, // [lon, lat]
  center: result.center,
  boundingBox: result.boundingBox,
  relevance: result.relevance,
  context: result.context,   // Administrative hierarchy
});
```

### Reverse Geocoding

```typescript
// Get address from coordinates
const results = await geocodingService.reverseGeocode(
  [2.3522, 48.8566],  // [longitude, latitude]
  {
    limit: 1,
    types: ['place', 'address'],
    language: 'fr',
  }
);

const address = results[0].name;
```

### Autocomplete Search

```typescript
// Search with suggestions
const suggestions = await geocodingService.search('Par', {
  limit: 10,
  proximity: [2.3522, 48.8566],
  language: 'fr',
});

// Returns AutocompleteSuggestion[]
suggestions.forEach(s => {
  console.log(s.name);              // 'Paris'
  console.log(s.coordinates);       // [2.3522, 48.8566]
  console.log(s.type);              // 'place'
  console.log(s.matchingText);
  console.log(s.relevance);         // 0-1 score
});
```

### Cache Management

```typescript
// Get cache statistics
const stats = geocodingService.getCacheStats();
// { size: 5, entries: 5 }

// Clear cache
geocodingService.clearCache();

// Reset service
geocodingService.reset();
```

### Error Handling

```typescript
import { GeocodingError, MAPTILER_ERROR_CODES } from '@/services/maptiler';

try {
  const results = await geocodingService.forwardGeocode('Paris');
} catch (error) {
  if (error instanceof GeocodingError) {
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);
    console.error(`Status: ${error.statusCode}`);

    switch (error.code) {
      case MAPTILER_ERROR_CODES.ZERO_RESULTS:
        console.log('No results found');
        break;
      case MAPTILER_ERROR_CODES.TIMEOUT:
        console.log('Request timed out');
        break;
      case MAPTILER_ERROR_CODES.NETWORK_ERROR:
        console.log('Network error');
        break;
    }
  }
}
```

---

## Routing Service

### Calculate Route

```typescript
import { routingService } from '@/services/maptiler';

const route = await routingService.calculateRoute({
  coordinates: [
    [2.3522, 48.8566], // Paris
    [5.3698, 43.2965], // Marseille
  ],
  profile: 'car',           // 'car', 'foot', 'bike'
  options: {
    alternatives: false,
    steps: true,
    annotations: ['distance', 'duration'],
    geometries: 'geojson',
    language: 'fr',
  },
});

// Route structure
const routeData = route.routes[0];
console.log({
  distance: routeData.distance,      // meters
  duration: routeData.duration,      // seconds
  geometry: routeData.geometry,      // GeoJSON geometry
  legs: routeData.legs,              // Per-leg breakdown
  weight: routeData.weight,
  weightName: routeData.weightName,
});

// Waypoint information
route.waypoints.forEach(wp => {
  console.log({
    name: wp.name,
    location: wp.location,            // [lon, lat]
    distance: wp.distance,
    hint: wp.hint,
  });
});
```

### Calculate Distance

```typescript
// Distance between two points
const result = await routingService.calculateDistance(
  [2.3522, 48.8566],  // from
  [5.3698, 43.2965],  // to
  'car',               // profile
  'kilometers'         // unit: 'kilometers', 'miles', 'meters'
);

console.log({
  from: result.from,
  to: result.to,
  distance: result.distance,         // 661.57 km
  duration: result.duration,         // 5929 seconds
  unit: result.unit,
});
```

### Distance Matrix

```typescript
// Distances between multiple points
const matrix = await routingService.calculateDistanceMatrix(
  {
    coordinates: [
      [2.3522, 48.8566], // Paris (index 0)
      [5.3698, 43.2965], // Marseille (index 1)
      [4.8357, 45.7640], // Lyon (index 2)
    ],
    profile: 'car',
    annotations: ['distance', 'duration'],
  },
  {
    limit: true,  // Limit feature (only for some profiles)
  }
);

// Access distances and durations
const parisToMarseille = matrix.distances[0][1];    // meters
const durationSeconds = matrix.durations[0][1];     // seconds

// Matrix structure
console.log({
  code: matrix.code,                 // 'Ok'
  distances: matrix.distances,       // 2D array
  durations: matrix.durations,       // 2D array
  sources: matrix.sources,           // Waypoint information
  destinations: matrix.destinations,
});
```

### Alternative Routes

```typescript
// Get multiple route options
const routeResult = await routingService.getAlternativeRoutes({
  coordinates: [
    [2.3522, 48.8566],
    [5.3698, 43.2965],
  ],
  profile: 'car',
  options: {
    alternatives: true,  // This is set automatically
  },
});

// Multiple routes returned
routeResult.routes.forEach((route, index) => {
  console.log(`Route ${index + 1}: ${route.distance}m`);
});
```

### Cache Management

```typescript
// Clear routing cache
routingService.clearCache();

// Get cache stats
const stats = routingService.getCacheStats();
// { size: 3, entries: 3 }

// Reset service
routingService.reset();
```

### Error Handling

```typescript
import { RoutingError, MAPTILER_ERROR_CODES } from '@/services/maptiler';

try {
  const route = await routingService.calculateRoute({
    coordinates: [[0, 0], [1, 1]],
    profile: 'car',
  });
} catch (error) {
  if (error instanceof RoutingError) {
    console.error(`Code: ${error.code}`);
    console.error(`Message: ${error.message}`);

    if (error.code === MAPTILER_ERROR_CODES.INVALID_COORDINATES) {
      console.log('Invalid coordinates provided');
    }
  }
}
```

---

## Type Definitions

### Marker Configuration

```typescript
interface MarkerConfig {
  id: string;                              // Unique identifier
  coordinates: [number, number];           // [longitude, latitude]
  title?: string;
  description?: string;
  color?: string;                          // Hex color
  icon?: string;                           // Icon name
  draggable?: boolean;
  popup?: boolean;
  popupContent?: string;                   // HTML content
  className?: string;
  properties?: Record<string, unknown>;    // Custom data
}
```

### Layer Configuration

```typescript
interface LayerConfig {
  id: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'heatmap' | 'fill-extrusion' | 'raster' | 'background';
  source: string | object;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
}
```

### Geocoding Result

```typescript
interface GeocodingResult {
  id: string;
  type: GeocodingType;
  name: string;
  shortCode?: string;
  geometry: { coordinates: [number, number] };
  center?: [number, number];
  boundingBox?: [number, number, number, number];
  context?: GeocodingContext[];
  properties?: Record<string, unknown>;
  relevance?: number;
  matchingText?: string;
}
```

### Routing Result

```typescript
interface RoutingResult {
  code: string;
  routes: Route[];
  waypoints: Waypoint[];
}

interface Route {
  distance: number;      // meters
  duration: number;      // seconds
  geometry: string | [number, number][];
  legs: RouteLeg[];
  weight?: number;
  weightName?: string;
}
```

---

## Constants Reference

### API URLs

```typescript
import { MAPTILER_API_URLS } from '@/services/maptiler';

MAPTILER_API_URLS.MAPS        // Maps API
MAPTILER_API_URLS.GEOCODING   // Geocoding API
MAPTILER_API_URLS.ROUTING     // Routing API
MAPTILER_API_URLS.STATIC      // Static maps
MAPTILER_API_URLS.TILES       // Tile server
MAPTILER_API_URLS.FONTS       // Font server
MAPTILER_API_URLS.SPRITES     // Sprite sheets
MAPTILER_API_URLS.DATA        // Data API
```

### Map Styles

```typescript
import { MAPTILER_STYLES, MAP_STYLE_PRESETS } from '@/services/maptiler';

// All available styles
MAPTILER_STYLES.BASIC
MAPTILER_STYLES.BRIGHT
MAPTILER_STYLES.DARK
MAPTILER_STYLES.LANDSCAPE
MAPTILER_STYLES.OUTDOOR
MAPTILER_STYLES.SATELLITE
MAPTILER_STYLES.STREETS
// ... and many more

// Presets for RETROUVONSLES use cases
MAP_STYLE_PRESETS.SEARCH
MAP_STYLE_PRESETS.DIRECTIONS
MAP_STYLE_PRESETS.MISSING_PERSONS
MAP_STYLE_PRESETS.FOUND_PERSONS
```

### Marker Presets

```typescript
import { MARKER_PRESETS, MARKER_COLORS } from '@/services/maptiler';

// Color palette
MARKER_COLORS.RED
MARKER_COLORS.BLUE
MARKER_COLORS.GREEN
MARKER_COLORS.ORANGE
// ... and more

// Presets for RETROUVONSLES
MARKER_PRESETS.MISSING_PERSON  // { color: RED, icon: 'alert-circle' }
MARKER_PRESETS.FOUND_PERSON    // { color: GREEN, icon: 'check-circle' }
MARKER_PRESETS.LAST_SEEN       // { color: ORANGE, icon: 'map-pin' }
MARKER_PRESETS.ORGANIZATION    // { color: BLUE, icon: 'building' }
MARKER_PRESETS.WITNESS         // { color: PURPLE, icon: 'eye' }
```

### France Centers

```typescript
import { FRANCE_CENTERS } from '@/services/maptiler';

FRANCE_CENTERS.FRANCE         // [2.2137, 46.2276]
FRANCE_CENTERS.PARIS          // [2.3522, 48.8566]
FRANCE_CENTERS.MARSEILLE      // [5.3698, 43.2965]
FRANCE_CENTERS.LYON           // [4.8357, 45.7640]
FRANCE_CENTERS.TOULOUSE       // [1.4442, 43.6047]
FRANCE_CENTERS.NICE           // [7.2620, 43.7102]
// ... and more major cities
```

---

## Error Handling

### Error Classes

```typescript
import { GeocodingError, RoutingError } from '@/services/maptiler';
import { MAPTILER_ERROR_CODES, MAPTILER_ERROR_MESSAGES } from '@/services/maptiler';

class GeocodingError extends Error {
  code: string;           // Error code
  message: string;        // Error message
  statusCode?: number;    // HTTP status code
}

class RoutingError extends Error {
  code: string;
  message: string;
  statusCode?: number;
}
```

### Error Codes

```typescript
// Available error codes
MAPTILER_ERROR_CODES.INVALID_API_KEY
MAPTILER_ERROR_CODES.NOT_FOUND
MAPTILER_ERROR_CODES.ZERO_RESULTS
MAPTILER_ERROR_CODES.QUOTA_EXCEEDED
MAPTILER_ERROR_CODES.REQUEST_DENIED
MAPTILER_ERROR_CODES.INVALID_REQUEST
MAPTILER_ERROR_CODES.UNKNOWN_ERROR
MAPTILER_ERROR_CODES.NETWORK_ERROR
MAPTILER_ERROR_CODES.TIMEOUT
MAPTILER_ERROR_CODES.INVALID_COORDINATES
MAPTILER_ERROR_CODES.SERVICE_UNAVAILABLE

// User-friendly messages
MAPTILER_ERROR_MESSAGES[errorCode]  // Translated messages
```

---

## Best Practices

### 1. Initialization

```typescript
// ✅ DO: Initialize at app start
useEffect(() => {
  if (!maptilerConfig.isConfigured()) {
    maptilerConfig.initialize(apiKey);
  }
}, []);

// ❌ DON'T: Initialize in every component
mapService.initializeMap(config);  // Can throw if already initialized
```

### 2. Cleanup

```typescript
// ✅ DO: Clean up on unmount
useEffect(() => {
  mapService.initializeMap(config);
  return () => mapService.destroy();
}, []);

// ❌ DON'T: Forget to destroy
// Leads to memory leaks and duplicate event listeners
```

### 3. Error Handling

```typescript
// ✅ DO: Handle specific errors
try {
  const results = await geocodingService.forwardGeocode(query);
} catch (error) {
  if (error instanceof GeocodingError) {
    if (error.code === MAPTILER_ERROR_CODES.ZERO_RESULTS) {
      setError('No locations found');
    }
  }
}

// ❌ DON'T: Ignore errors
const results = await geocodingService.forwardGeocode(query);
```

### 4. Caching

```typescript
// ✅ DO: Cache results to reduce API calls
// (automatically done by services with configurable TTL)

// ❌ DON'T: Make identical requests repeatedly
// Use the same query within cache TTL
```

### 5. Type Safety

```typescript
// ✅ DO: Use provided types
import { MarkerConfig, GeocodingResult } from '@/services/maptiler';
const marker: MarkerConfig = { ... };

// ❌ DON'T: Use `any` types
const marker: any = { ... };
```

### 6. Performance

```typescript
// ✅ DO: Batch operations
mapService.clearMarkers();
locations.forEach(loc => mapService.addMarker(loc));

// ❌ DON'T: Update map in loops
for (let loc of locations) {
  mapService.addMarker(loc);  // Triggers re-renders
}
```

### 7. Configuration

```typescript
// ✅ DO: Check configuration before use
if (!maptilerConfig.isConfigured()) {
  console.error('MapTiler not configured');
  return;
}

// ❌ DON'T: Assume services are always available
mapService.initializeMap(config);  // Could fail if not configured
```

---

## API Configuration

```typescript
import { API_TIMEOUT, API_RETRY_CONFIG, CACHE_CONFIG } from '@/services/maptiler';

// Request timeout: 30 seconds
API_TIMEOUT

// Retry configuration
API_RETRY_CONFIG.maxRetries          // 3 retries
API_RETRY_CONFIG.retryDelay          // 1000ms initial delay
API_RETRY_CONFIG.backoffMultiplier   // 2x exponential backoff

// Cache TTL
CACHE_CONFIG.GEOCODING_TTL           // 1 hour
CACHE_CONFIG.ROUTING_TTL             // 30 minutes
CACHE_CONFIG.TILES_TTL               // 24 hours
```

---

## Summary

| Service | Methods | Purpose |
|---------|---------|---------|
| **Config** | 10+ | Initialization, validation, configuration |
| **Map** | 30+ | Map display, markers, layers, events |
| **Geocoding** | 4+ | Address search, reverse geocoding, autocomplete |
| **Routing** | 4+ | Route calculation, distance, matrices |

**Total: 100+ methods for complete map functionality**

---

For quick start, see **MAPTILER_QUICK_START.md**  
For module integration, see **MAPTILER_INTEGRATION_BY_MODULE.md**  
For deployment, see **MAPTILER_IMPLEMENTATION_FINAL_REPORT.md**
