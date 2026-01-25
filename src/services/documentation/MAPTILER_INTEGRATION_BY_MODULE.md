# MapTiler Services - Integration by Module Guide

**Step-by-step integration for RETROUVONSLES feature modules**

---

## 📦 Integration Overview

MapTiler services can be integrated into 6 main RETROUVONSLES modules:

1. **Search & Discovery** - Find locations and people
2. **Missing Persons** - Display missing person locations
3. **Found Persons** - Show found person locations
4. **Organizations** - Locate police, hospitals, NGOs
5. **Route Planning** - Plan routes for search operations
6. **Analytics & Heatmaps** - Visualize patterns and data

---

## 1️⃣ Search & Discovery Module

### Scenario
Users search for locations and get suggestions with maps.

### Implementation

```typescript
// src/pages/Search.tsx
import { useState, useEffect } from 'react';
import { geocodingService, mapService } from '@/services/maptiler';
import { MAP_STYLE_PRESETS } from '@/services/maptiler';

export function SearchPage() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Autocomplete search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const results = await geocodingService.search(query, {
          limit: 10,
          proximity: [2.3522, 48.8566], // User location
          language: 'fr',
        });
        setSuggestions(results);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Handle suggestion click
  const handleSelectLocation = (suggestion) => {
    if (suggestion.coordinates) {
      mapService.setCenter(suggestion.coordinates, 14);
      mapService.addMarker({
        id: 'search-result',
        coordinates: suggestion.coordinates,
        title: suggestion.name,
        popup: true,
        popupContent: `<h3>${suggestion.name}</h3>`,
      });
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search locations..."
      />
      <ul>
        {suggestions.map(s => (
          <li key={s.id} onClick={() => handleSelectLocation(s)}>
            {s.name}
          </li>
        ))}
      </ul>
      <div id="map" style={{height: '400px'}} />
    </div>
  );
}
```

### Key Features
- ✅ Real-time autocomplete
- ✅ Proxy search with proximity bias
- ✅ Map integration
- ✅ Debounced requests

---

## 2️⃣ Missing Persons Module

### Scenario
Display missing person locations on map with last seen markers.

### Implementation

```typescript
// src/pages/MissingPersons.tsx
import { useEffect, useState } from 'react';
import { mapService, geocodingService } from '@/services/maptiler';
import { MAP_STYLE_PRESETS, MARKER_PRESETS } from '@/services/maptiler';

interface MissingPerson {
  id: string;
  name: string;
  lastSeenLocation: string;
  lastSeenDate: string;
  description: string;
  photo?: string;
}

export function MissingPersonsPage() {
  const [persons, setPersons] = useState<MissingPerson[]>([]);

  useEffect(() => {
    // Initialize map for missing persons (satellite view)
    mapService.initializeMap({
      container: 'map-missing-persons',
      style: MAP_STYLE_PRESETS.MISSING_PERSONS,
      center: [2.3522, 48.8566],
      zoom: 6,
    });

    // Load missing persons from API
    loadMissingPersons();

    return () => mapService.destroy();
  }, []);

  const loadMissingPersons = async () => {
    try {
      // Mock API call
      const data = [
        {
          id: '1',
          name: 'Sophie Martin',
          lastSeenLocation: 'Gare de Lyon, Paris',
          lastSeenDate: '2024-01-15',
          description: 'Brown hair, blue eyes',
        },
        {
          id: '2',
          name: 'Jean Dupont',
          lastSeenLocation: 'Marseille Port',
          lastSeenDate: '2024-01-10',
          description: 'Gray hair',
        },
      ];

      setPersons(data);

      // Geocode and display each person
      for (const person of data) {
        await displayMissingPerson(person);
      }
    } catch (error) {
      console.error('Failed to load missing persons:', error);
    }
  };

  const displayMissingPerson = async (person: MissingPerson) => {
    try {
      // Geocode location
      const geoResults = await geocodingService.forwardGeocode(
        person.lastSeenLocation,
        { limit: 1, language: 'fr' }
      );

      if (geoResults.length === 0) return;

      const [lng, lat] = geoResults[0].geometry.coordinates;

      // Add marker
      mapService.addMarker({
        id: `missing-${person.id}`,
        coordinates: [lng, lat],
        title: person.name,
        color: MARKER_PRESETS.MISSING_PERSON.color,
        icon: MARKER_PRESETS.MISSING_PERSON.icon,
        popup: true,
        popupContent: `
          <div class="popup-content">
            <h3>${person.name}</h3>
            <p><strong>Last seen:</strong> ${person.lastSeenDate}</p>
            <p><strong>Location:</strong> ${person.lastSeenLocation}</p>
            <p>${person.description}</p>
            <a href="/missing-persons/${person.id}">View details</a>
          </div>
        `,
      });

      // Add search radius (5km)
      mapService.addGeoJSONSource(`radius-${person.id}`, {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: { personId: person.id },
      });
    } catch (error) {
      console.error(`Failed to display person ${person.id}:`, error);
    }
  };

  return (
    <div>
      <h1>Missing Persons Map</h1>
      <div id="map-missing-persons" style={{height: '600px'}} />
      <div className="persons-list">
        {persons.map(person => (
          <div key={person.id} className="person-card">
            <h3>{person.name}</h3>
            <p>Last seen: {person.lastSeenDate}</p>
            <p>{person.lastSeenLocation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Key Features
- ✅ Satellite view for visual inspection
- ✅ Marker presets for missing persons
- ✅ Popup with person details
- ✅ Geocoding of textual locations
- ✅ Search radius visualization

---

## 3️⃣ Found Persons Module

### Scenario
Display found person locations and create routes to verification centers.

### Implementation

```typescript
// src/pages/FoundPersons.tsx
import { useEffect, useState } from 'react';
import { mapService, geocodingService, routingService } from '@/services/maptiler';
import { MAP_STYLE_PRESETS, MARKER_PRESETS } from '@/services/maptiler';

interface FoundPerson {
  id: string;
  description: string;
  foundLocation: string;
  foundDate: string;
}

interface VerificationCenter {
  id: string;
  name: string;
  address: string;
  coordinates?: [number, number];
}

export function FoundPersonsPage() {
  const [foundPersons, setFoundPersons] = useState<FoundPerson[]>([]);
  const [centers, setCenters] = useState<VerificationCenter[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<FoundPerson | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<VerificationCenter | null>(null);

  useEffect(() => {
    mapService.initializeMap({
      container: 'map-found-persons',
      style: MAP_STYLE_PRESETS.FOUND_PERSONS,
      center: [2.3522, 48.8566],
      zoom: 8,
    });

    loadData();
    return () => mapService.destroy();
  }, []);

  const loadData = async () => {
    // Load found persons and centers
    const foundData: FoundPerson[] = [
      {
        id: '1',
        description: 'Woman matching Sophie Martin description',
        foundLocation: 'Bois de Boulogne, Paris',
        foundDate: '2024-01-16',
      },
    ];

    const centerData: VerificationCenter[] = [
      { id: '1', name: 'Police HQ', address: 'Préfecture de Police, Paris' },
      { id: '2', name: 'Hospital', address: 'Hôtel-Dieu, Paris' },
    ];

    setFoundPersons(foundData);
    setCenters(centerData);

    // Geocode centers
    for (const center of centerData) {
      await geocodingService.forwardGeocode(center.address, { limit: 1 })
        .then(results => {
          if (results[0]) {
            center.coordinates = results[0].geometry.coordinates;
            mapService.addMarker({
              id: `center-${center.id}`,
              coordinates: center.coordinates,
              title: center.name,
              color: MARKER_PRESETS.ORGANIZATION.color,
              popup: true,
              popupContent: `<h3>${center.name}</h3><p>${center.address}</p>`,
            });
          }
        });
    }

    // Display found persons
    for (const person of foundData) {
      const geoResults = await geocodingService.forwardGeocode(
        person.foundLocation
      );
      if (geoResults[0]) {
        mapService.addMarker({
          id: `found-${person.id}`,
          coordinates: geoResults[0].geometry.coordinates,
          title: 'Found Person Match',
          color: MARKER_PRESETS.FOUND_PERSON.color,
          popup: true,
          popupContent: `
            <h3>Potential Match</h3>
            <p>${person.description}</p>
            <p>Found: ${person.foundDate}</p>
          `,
        });
      }
    }
  };

  const calculateRouteToCenterRouting = async (
    person: FoundPerson,
    center: VerificationCenter
  ) => {
    if (!center.coordinates) return;

    try {
      // Get person location
      const personGeo = await geocodingService.forwardGeocode(
        person.foundLocation
      );
      const personCoords = personGeo[0].geometry.coordinates;

      // Calculate route
      const route = await routingService.calculateRoute({
        coordinates: [personCoords, center.coordinates],
        profile: 'car',
        options: {
          steps: true,
          annotations: ['distance', 'duration'],
        },
      });

      if (route.routes[0]) {
        const distance = (route.routes[0].distance / 1000).toFixed(2);
        const duration = (route.routes[0].duration / 60).toFixed(0);

        alert(`Route to ${center.name}:\n${distance} km\n${duration} minutes`);

        // Draw route on map
        mapService.addGeoJSONSource('route', {
          type: 'Feature',
          geometry: route.routes[0].geometry as any,
          properties: {},
        });
      }
    } catch (error) {
      console.error('Failed to calculate route:', error);
    }
  };

  return (
    <div>
      <h1>Found Persons</h1>
      <div id="map-found-persons" style={{height: '600px'}} />
      <div className="actions">
        <select onChange={(e) => setSelectedPerson(
          foundPersons.find(p => p.id === e.target.value) || null
        )}>
          <option>Select person...</option>
          {foundPersons.map(p => (
            <option key={p.id} value={p.id}>{p.description}</option>
          ))}
        </select>
        <select onChange={(e) => setSelectedCenter(
          centers.find(c => c.id === e.target.value) || null
        )}>
          <option>Select verification center...</option>
          {centers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => selectedPerson && selectedCenter && 
            calculateRouteToCenterRouting(selectedPerson, selectedCenter)
          }
        >
          Calculate Route
        </button>
      </div>
    </div>
  );
}
```

### Key Features
- ✅ Found person markers with details
- ✅ Verification center locations
- ✅ Route calculation to centers
- ✅ Distance and duration display

---

## 4️⃣ Organizations Module

### Scenario
Display police stations, hospitals, NGOs, and other organizations.

### Implementation

```typescript
// src/pages/Organizations.tsx
import { useEffect, useState } from 'react';
import { mapService, geocodingService } from '@/services/maptiler';
import { MAP_STYLE_PRESETS, MARKER_PRESETS } from '@/services/maptiler';

interface Organization {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'ngo' | 'other';
  address: string;
  phone: string;
  coordinates?: [number, number];
}

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  useEffect(() => {
    mapService.initializeMap({
      container: 'map-organizations',
      style: MAP_STYLE_PRESETS.ORGANIZATIONS,
      center: [2.3522, 48.8566],
      zoom: 8,
    });

    loadOrganizations();
    return () => mapService.destroy();
  }, []);

  const loadOrganizations = async () => {
    const orgs: Organization[] = [
      {
        id: '1',
        name: 'Police Headquarters',
        type: 'police',
        address: 'Préfecture de Police, Paris',
        phone: '01 40 49 50 00',
      },
      {
        id: '2',
        name: 'Hôtel-Dieu Hospital',
        type: 'hospital',
        address: 'Île de la Cité, Paris',
        phone: '01 42 34 82 34',
      },
      {
        id: '3',
        name: 'Missing Children Foundation',
        type: 'ngo',
        address: 'SOS Children, France',
        phone: '116 000',
      },
    ];

    // Geocode all organizations
    for (const org of orgs) {
      try {
        const results = await geocodingService.forwardGeocode(org.address, { limit: 1 });
        if (results[0]) {
          org.coordinates = results[0].geometry.coordinates;
        }
      } catch (error) {
        console.error(`Failed to geocode ${org.name}`);
      }
    }

    setOrganizations(orgs);

    // Add markers
    orgs.forEach(org => {
      if (org.coordinates) {
        mapService.addMarker({
          id: `org-${org.id}`,
          coordinates: org.coordinates,
          title: org.name,
          color: getColorByType(org.type),
          popup: true,
          popupContent: `
            <div>
              <h3>${org.name}</h3>
              <p>${org.address}</p>
              <p><strong>Phone:</strong> <a href="tel:${org.phone}">${org.phone}</a></p>
            </div>
          `,
        });
      }
    });

    // Fit bounds to all organizations
    const bounds = mapService.getBounds();
    mapService.fitBounds([bounds.minX, bounds.minY, bounds.maxX, bounds.maxY]);
  };

  const getColorByType = (type: Organization['type']): string => {
    switch (type) {
      case 'police': return '#FF0000';  // Red
      case 'hospital': return '#00FF00'; // Green
      case 'ngo': return '#0000FF';      // Blue
      default: return '#808080';          // Gray
    }
  };

  return (
    <div>
      <h1>Organizations</h1>
      <div id="map-organizations" style={{height: '600px'}} />
      <div className="legend">
        <div><span style={{color: '#FF0000'}}>●</span> Police</div>
        <div><span style={{color: '#00FF00'}}>●</span> Hospital</div>
        <div><span style={{color: '#0000FF'}}>●</span> NGO</div>
      </div>
    </div>
  );
}
```

### Key Features
- ✅ Multiple organization types
- ✅ Geocoding of addresses
- ✅ Contact information in popups
- ✅ Color-coded markers
- ✅ Auto-fit to all locations

---

## 5️⃣ Route Planning Module

### Scenario
Plan routes for search operations, calculate distances between locations.

### Implementation

```typescript
// src/pages/RoutePlanning.tsx
import { useEffect, useState } from 'react';
import { mapService, routingService, geocodingService } from '@/services/maptiler';

interface RouteStep {
  location: string;
  type: 'start' | 'checkpoint' | 'end';
  coordinates?: [number, number];
}

export function RoutePlanningPage() {
  const [steps, setSteps] = useState<RouteStep[]>([
    { location: '', type: 'start' },
    { location: '', type: 'end' },
  ]);
  const [routeInfo, setRouteInfo] = useState<any>(null);

  useEffect(() => {
    mapService.initializeMap({
      container: 'map-route-planning',
      style: 'https://api.maptiler.com/maps/bright-v2/style.json',
      center: [2.3522, 48.8566],
      zoom: 8,
    });

    return () => mapService.destroy();
  }, []);

  const addStep = () => {
    setSteps([
      ...steps.slice(0, -1),
      { location: '', type: 'checkpoint' },
      steps[steps.length - 1],
    ]);
  };

  const removeStep = (index: number) => {
    if (steps.length > 2) {
      setSteps(steps.filter((_, i) => i !== index));
    }
  };

  const updateStep = (index: number, location: string) => {
    const newSteps = [...steps];
    newSteps[index].location = location;
    setSteps(newSteps);
  };

  const calculateRoute = async () => {
    try {
      mapService.clearMarkers();

      // Geocode all locations
      const coordinates: [number, number][] = [];
      for (const step of steps) {
        if (!step.location) {
          alert('Please fill all locations');
          return;
        }

        const results = await geocodingService.forwardGeocode(step.location);
        if (results[0]) {
          const coords = results[0].geometry.coordinates;
          coordinates.push(coords);
          step.coordinates = coords;

          mapService.addMarker({
            id: `step-${steps.indexOf(step)}`,
            coordinates: coords,
            title: step.location,
            popup: true,
          });
        }
      }

      // Calculate route
      const route = await routingService.calculateRoute({
        coordinates,
        profile: 'car',
        options: {
          steps: true,
          annotations: ['distance', 'duration'],
        },
      });

      if (route.routes[0]) {
        const distance = (route.routes[0].distance / 1000).toFixed(2);
        const duration = route.routes[0].duration;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);

        setRouteInfo({
          distance,
          hours,
          minutes,
          routes: route.routes,
        });

        // Draw route geometry
        mapService.addGeoJSONSource('route-geometry', {
          type: 'Feature',
          geometry: route.routes[0].geometry as any,
          properties: {},
        });

        mapService.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route-geometry',
          paint: {
            'line-color': '#FF0000',
            'line-width': 3,
          },
        });
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
  };

  return (
    <div>
      <h1>Route Planning</h1>
      <div id="map-route-planning" style={{height: '600px'}} />
      <div className="route-planner">
        {steps.map((step, index) => (
          <div key={index} className="route-step">
            <input
              type="text"
              placeholder={`${step.type.toUpperCase()}: Enter location`}
              value={step.location}
              onChange={(e) => updateStep(index, e.target.value)}
            />
            {index > 0 && index < steps.length - 1 && (
              <button onClick={() => removeStep(index)}>Remove</button>
            )}
          </div>
        ))}
        <button onClick={addStep}>+ Add Checkpoint</button>
        <button onClick={calculateRoute} style={{backgroundColor: '#4CAF50', color: 'white'}}>
          Calculate Route
        </button>
      </div>
      {routeInfo && (
        <div className="route-info">
          <h3>Route Information</h3>
          <p><strong>Distance:</strong> {routeInfo.distance} km</p>
          <p><strong>Duration:</strong> {routeInfo.hours}h {routeInfo.minutes}m</p>
        </div>
      )}
    </div>
  );
}
```

### Key Features
- ✅ Multi-step route planning
- ✅ Add/remove waypoints
- ✅ Automatic geocoding
- ✅ Distance and time calculation
- ✅ Visual route on map

---

## 6️⃣ Analytics & Heatmaps Module

### Scenario
Visualize patterns of missing person sightings using heatmaps.

### Implementation

```typescript
// src/pages/Analytics.tsx
import { useEffect, useState } from 'react';
import { mapService } from '@/services/maptiler';
import { MAP_STYLE_PRESETS } from '@/services/maptiler';

export function AnalyticsPage() {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    mapService.initializeMap({
      container: 'map-analytics',
      style: MAP_STYLE_PRESETS.HEATMAP,
      center: [2.3522, 48.8566],
      zoom: 7,
    });

    loadHeatmapData();
    return () => mapService.destroy();
  }, []);

  const loadHeatmapData = () => {
    // Sighting data: [longitude, latitude, intensity]
    const data = [
      [2.3522, 48.8566, 100],  // Paris - high sightings
      [5.3698, 43.2965, 75],   // Marseille
      [4.8357, 45.7640, 60],   // Lyon
      [1.4442, 43.6047, 45],   // Toulouse
      [2.5, 48.9, 50],          // Northern Paris area
      [2.2, 48.8, 55],          // Western Paris area
    ];

    setHeatmapData(data);

    // Add heatmap layer
    mapService.addGeoJSONSource('heatmap-data', {
      type: 'FeatureCollection',
      features: data.map(([lng, lat, intensity]) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          sightings: intensity,
        },
      })),
    });

    mapService.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap-data',
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'sightings'],
          0,
          0,
          100,
          1,
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          1,
          9,
          3,
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0,
          'rgba(0, 0, 255, 0)',
          0.1,
          'royalblue',
          0.3,
          'cyan',
          0.5,
          'lime',
          0.7,
          'yellow',
          1,
          'red',
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          2,
          9,
          20,
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7,
          1,
          9,
          0.3,
        ],
      },
    });
  };

  return (
    <div>
      <h1>Sighting Analytics</h1>
      <div id="map-analytics" style={{height: '600px'}} />
      <div className="analytics-info">
        <h3>Sighting Heatmap</h3>
        <p>Red areas indicate high concentration of sightings</p>
        <div className="legend">
          <div style={{color: 'blue'}}>Low</div>
          <div style={{color: 'cyan'}}>Medium</div>
          <div style={{color: 'red'}}>High</div>
        </div>
      </div>
    </div>
  );
}
```

### Key Features
- ✅ Heatmap visualization
- ✅ Color gradient based on density
- ✅ Zoom-responsive heatmap
- ✅ Pattern analysis visualization

---

## Integration Checklist

### Before Integration
- [ ] MapTiler API key configured
- [ ] `maptilerConfig.initialize()` called in App.tsx
- [ ] CSS for map styles imported
- [ ] Required HTML container elements added

### During Integration
- [ ] Initialize map in `useEffect`
- [ ] Add error handling for API calls
- [ ] Geocode addresses before using
- [ ] Validate coordinates before adding markers
- [ ] Clean up map on component unmount

### After Integration
- [ ] Test with real data
- [ ] Verify performance with many markers
- [ ] Test error scenarios
- [ ] Cache optimization
- [ ] Mobile responsiveness

---

## Common Patterns

### Pattern 1: Search and Display

```typescript
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

const handleSearch = async () => {
  const res = await geocodingService.forwardGeocode(query);
  setResults(res);
  res.forEach(r => mapService.addMarker({...}));
};
```

### Pattern 2: Route Display

```typescript
const route = await routingService.calculateRoute({...});
mapService.addGeoJSONSource('route', {
  type: 'Feature',
  geometry: route.routes[0].geometry,
  properties: {},
});
```

### Pattern 3: Error Handling

```typescript
try {
  const res = await geocodingService.forwardGeocode(query);
} catch (error) {
  if (error instanceof GeocodingError) {
    handleError(error.code);
  }
}
```

---

## Performance Tips

1. **Batch Geocoding**: Use Promise.all() for multiple geocodes
2. **Cache Results**: Services automatically cache for TTL
3. **Lazy Load Markers**: Add markers only for visible area
4. **Optimize Layers**: Use clustering for many points
5. **Debounce Search**: 300ms delay for autocomplete

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Markers not showing | Check geocoding results are valid |
| Map not loading | Verify API key configuration |
| Routes not calculating | Ensure coordinates are [lon, lat] |
| Slow performance | Use clustering or reduce markers |
| API quota exceeded | Check cache TTL and usage patterns |

---

For complete API reference, see **MAPTILER_IMPLEMENTATION_COMPLETE.md**  
For deployment guide, see **MAPTILER_IMPLEMENTATION_FINAL_REPORT.md**
