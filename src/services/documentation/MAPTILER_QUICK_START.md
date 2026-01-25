# MapTiler Services - Quick Start Guide

**Get started with MapTiler in 5 minutes**

---

## 🚀 Installation

```bash
npm install maplibre-gl
```

---

## 🔧 Setup

### 1. Initialize MapTiler Configuration

```typescript
import { maptilerConfig } from '@/services/maptiler';

// Initialize with your API key
maptilerConfig.initialize(process.env.REACT_APP_MAPTILER_API_KEY || '');
```

### 2. In Your React App

```typescript
import { useEffect } from 'react';
import { mapService, maptilerConfig } from '@/services/maptiler';
import { MAP_STYLE_PRESETS } from '@/services/maptiler';

export function MyMapComponent() {
  useEffect(() => {
    if (!maptilerConfig.isConfigured()) return;

    // Initialize map
    mapService.initializeMap({
      container: 'map',
      style: MAP_STYLE_PRESETS.STREETS,
      center: [2.3522, 48.8566], // Paris
      zoom: 12,
    });

    return () => mapService.destroy();
  }, []);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
```

---

## 🗺️ Map Operations

### Center & Zoom

```typescript
// Set center with animation
mapService.setCenter([2.3522, 48.8566], 14);

// Set zoom
mapService.setZoom(16);

// Get current position
const [lng, lat] = mapService.getCenter();
const zoom = mapService.getZoom();

// Fit bounds
mapService.fitBounds([-5.14, 41.26, 8.23, 51.09]);
```

### Markers

```typescript
import { mapService, MARKER_PRESETS } from '@/services/maptiler';

// Add marker
const marker = mapService.addMarker({
  id: 'person-1',
  coordinates: [2.3522, 48.8566],
  title: 'Missing Person Location',
  color: MARKER_PRESETS.MISSING_PERSON.color,
  icon: MARKER_PRESETS.MISSING_PERSON.icon,
  popup: true,
  popupContent: '<h3>Last Seen</h3><p>Eiffel Tower area</p>',
});

// Update marker
mapService.updateMarker('person-1', {
  coordinates: [2.3, 48.9],
});

// Remove marker
mapService.removeMarker('person-1');

// Get all markers
const allMarkers = mapService.getMarkers();
```

### Layers

```typescript
// Add layer
mapService.addLayer({
  id: 'my-layer',
  type: 'circle',
  source: 'my-source',
  paint: {
    'circle-radius': 8,
    'circle-color': '#FF0000',
  },
});

// Get layer
const layer = mapService.getLayer('my-layer');

// Remove layer
mapService.removeLayer('my-layer');
```

---

## 🔍 Geocoding

### Forward Geocoding (Address → Coordinates)

```typescript
import { geocodingService } from '@/services/maptiler';

const results = await geocodingService.forwardGeocode('Paris, France', {
  limit: 5,
  language: 'fr',
});

console.log(results[0].geometry.coordinates); // [2.3522, 48.8566]
```

### Reverse Geocoding (Coordinates → Address)

```typescript
const results = await geocodingService.reverseGeocode([2.3522, 48.8566], {
  limit: 1,
  language: 'fr',
});

console.log(results[0].name); // "Paris"
```

### Autocomplete Search

```typescript
const suggestions = await geocodingService.search('Paris', {
  limit: 10,
  proximity: [2.3522, 48.8566],
});

// Return formatted suggestions
console.log(suggestions.map(s => s.name));
```

---

## 🛣️ Routing

### Calculate Route

```typescript
import { routingService } from '@/services/maptiler';

const route = await routingService.calculateRoute({
  coordinates: [
    [2.3522, 48.8566], // Paris
    [5.3698, 43.2965], // Marseille
  ],
  profile: 'car',
  options: {
    steps: true,
    annotations: ['distance', 'duration'],
  },
});

console.log(`Distance: ${route.routes[0].distance}m`);
console.log(`Duration: ${route.routes[0].duration}s`);
```

### Calculate Distance

```typescript
const result = await routingService.calculateDistance(
  [2.3522, 48.8566], // from
  [5.3698, 43.2965], // to
  'car',
  'kilometers'
);

console.log(`${result.distance} km - ${result.duration}s`);
```

### Distance Matrix

```typescript
const matrix = await routingService.calculateDistanceMatrix({
  coordinates: [
    [2.3522, 48.8566], // Paris
    [5.3698, 43.2965], // Marseille
    [4.8357, 45.7640], // Lyon
  ],
  profile: 'car',
});

// matrix.distances[0][1] = distance from Paris to Marseille
// matrix.durations[0][1] = duration from Paris to Marseille
```

---

## 📍 Real-World Examples

### Missing Person Search Map

```typescript
import { mapService, geocodingService, routingService, MARKER_PRESETS } from '@/services/maptiler';

async function setupMissingPersonMap(personData) {
  // Geocode last seen location
  const geoResults = await geocodingService.forwardGeocode(
    personData.lastSeenLocation
  );
  const [lng, lat] = geoResults[0].geometry.coordinates;

  // Center map
  mapService.setCenter([lng, lat], 14);

  // Add last seen location marker
  mapService.addMarker({
    id: 'last-seen',
    coordinates: [lng, lat],
    title: `${personData.name} - Last Seen`,
    color: MARKER_PRESETS.LAST_SEEN.color,
    popup: true,
    popupContent: `<h3>${personData.name}</h3><p>Last seen: ${personData.lastSeenDate}</p>`,
  });

  // Calculate search radius (e.g., 5 km radius)
  const searchArea = await routingService.calculateDistanceMatrix({
    coordinates: [[lng, lat]],
    profile: 'foot',
  });

  console.log('Search area established:', searchArea);
}
```

### Organization Locator

```typescript
async function displayOrganizations(orgs) {
  // Clear existing markers
  mapService.clearMarkers();

  // Add markers for each organization
  for (const org of orgs) {
    const geoResults = await geocodingService.forwardGeocode(org.address);
    const coords = geoResults[0].geometry.coordinates;

    mapService.addMarker({
      id: `org-${org.id}`,
      coordinates: coords,
      title: org.name,
      color: MARKER_PRESETS.ORGANIZATION.color,
      popup: true,
      popupContent: `<h3>${org.name}</h3><p>${org.phone}</p>`,
    });
  }

  // Fit map to all markers
  const bounds = mapService.getBounds();
  mapService.fitBounds([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]);
}
```

### Route Optimization

```typescript
async function findFastestRoute(locations) {
  // Calculate matrix between all locations
  const matrix = await routingService.calculateDistanceMatrix({
    coordinates: locations,
    profile: 'car',
  });

  // Find shortest path (simplified TSP)
  let path = [0];
  let remaining = new Set(Array.from({length: locations.length}, (_, i) => i).filter(i => i !== 0));

  while (remaining.size > 0) {
    const current = path[path.length - 1];
    let nearest = -1;
    let minDist = Infinity;

    for (const next of remaining) {
      if (matrix.distances[current][next] < minDist) {
        minDist = matrix.distances[current][next];
        nearest = next;
      }
    }

    path.push(nearest);
    remaining.delete(nearest);
  }

  return path;
}
```

---

## ⚙️ Configuration

```typescript
import { 
  DEFAULT_MAP_CONFIG,
  DEFAULT_GEOCODING_OPTIONS,
  DEFAULT_ROUTING_OPTIONS,
  FRANCE_CENTERS,
  MAPTILER_FEATURES,
} from '@/services/maptiler';

// Default map settings
console.log(DEFAULT_MAP_CONFIG); // { zoom: 12, minZoom: 2, maxZoom: 20, ... }

// Default geocoding options
console.log(DEFAULT_GEOCODING_OPTIONS); // { limit: 10, fuzzyMatch: true, language: 'fr' }

// French city centers
mapService.setCenter(FRANCE_CENTERS.PARIS);
mapService.setCenter(FRANCE_CENTERS.MARSEILLE);

// Available features
console.log(MAPTILER_FEATURES);
// { CLUSTERING: true, HEATMAPS: true, ANIMATIONS: true, ... }
```

---

## 🎨 Map Styles

```typescript
import { MAP_STYLE_PRESETS } from '@/services/maptiler';

// Available styles for different use cases
mapService.setStyle(MAP_STYLE_PRESETS.SEARCH);         // For searching locations
mapService.setStyle(MAP_STYLE_PRESETS.DIRECTIONS);     // For route planning
mapService.setStyle(MAP_STYLE_PRESETS.MISSING_PERSONS);// Satellite view
mapService.setStyle(MAP_STYLE_PRESETS.ORGANIZATIONS);  // Basic map
```

---

## 🚨 Error Handling

```typescript
import { GeocodingError, RoutingError } from '@/services/maptiler';
import { MAPTILER_ERROR_CODES } from '@/services/maptiler';

try {
  const results = await geocodingService.forwardGeocode('Paris');
} catch (error) {
  if (error instanceof GeocodingError) {
    if (error.code === MAPTILER_ERROR_CODES.ZERO_RESULTS) {
      console.log('No results found');
    } else if (error.code === MAPTILER_ERROR_CODES.TIMEOUT) {
      console.log('Request timed out');
    } else {
      console.log('Error:', error.message);
    }
  }
}
```

---

## 📚 Next Steps

- Read **MAPTILER_IMPLEMENTATION_COMPLETE.md** for full API reference
- Check **MAPTILER_INTEGRATION_BY_MODULE.md** for module-specific examples
- Review **MAPTILER_IMPLEMENTATION_FINAL_REPORT.md** for deployment guide

---

## 💡 Tips

✅ Always initialize MapTiler config before using services  
✅ Cache geocoding results to reduce API calls  
✅ Use appropriate map styles for different contexts  
✅ Add error handling for all API calls  
✅ Clean up map instance on component unmount  

---

**Need help?** Check the full documentation or examples folder.
