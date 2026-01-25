/**
 * =====================================================
 * RETROUVONSLES - Geolocation Web Worker
 * Handles geolocation tracking in a background thread
 * Background tracking for missing person location alerts and proximity detection
 * =====================================================
 */

// Declare self as DedicatedWorkerGlobalScope
declare const self: DedicatedWorkerGlobalScope;

// Enums matching database types
type SourceLocalisation = 'gps_mobile' | 'temoignage' | 'camera_surveillance' | 'prediction_ia' | 'document_officiel' | 'autre';
type FiabiliteSource = 'haute' | 'moyenne' | 'faible';
type TypeLocalisation = 'disparition' | 'derniere_observation' | 'signalement' | 'decouverte' | 'prediction' | 'autre';

interface GeolocationMessage {
  type: 'START_TRACKING' | 'STOP_TRACKING' | 'GET_LOCATION' | 'SET_OPTIONS' | 'ADD_PROXIMITY_ZONE' | 'CHECK_PROXIMITY' | 'GET_TRACKING_SESSION';
  options?: GeolocationOptions;
  proximityZone?: ProximityZone;
  dossierId?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
  // RETROUVONSLES specific fields
  source_localisation: SourceLocalisation;
  fiabilite_source: FiabiliteSource;
  type_localisation: TypeLocalisation;
  adresse?: string;
  ville?: string;
  region?: string;
}

interface ProximityZone {
  id: string;
  latitude_centre: number;
  longitude_centre: number;
  rayon_km: number;
  nom: string;
  description?: string;
  created_at: string;
}

interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoSaveToDb?: boolean;
  proximity_check_interval?: number;
}

let watchId: number | null = null;
let isTracking = false;
let proximityZones: ProximityZone[] = [];
let trackingSession: { id: string; startTime: number; locations: LocationData[] } | null = null;
let options: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
  autoSaveToDb: false,
  proximity_check_interval: 5000,
};

/**
 * Start tracking user location
 */
function startTracking(): void {
  if (isTracking) {
    self.postMessage({ type: 'ERROR', message: 'Already tracking' });
    return;
  }

  isTracking = true;
  
  // Initialize tracking session
  trackingSession = {
    id: `session_${Date.now()}`,
    startTime: Date.now(),
    locations: [],
  };

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { coords, timestamp } = position;
      const locationData: LocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp,
        // Default RETROUVONSLES values
        source_localisation: 'gps_mobile',
        fiabilite_source: coords.accuracy < 50 ? 'haute' : coords.accuracy < 100 ? 'moyenne' : 'faible',
        type_localisation: 'signalement',
      };

      // Store in session
      if (trackingSession) {
        trackingSession.locations.push(locationData);
      }

      // Check proximity zones
      const triggeredZones = checkProximityZones(locationData);

      self.postMessage({
        type: 'LOCATION_UPDATE',
        data: locationData,
        sessionId: trackingSession?.id,
        triggeredZones: triggeredZones.length > 0 ? triggeredZones : undefined,
      });
    },
    (error) => {
      let message = 'Geolocation error';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permission denied for geolocation';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Position unavailable';
          break;
        case error.TIMEOUT:
          message = 'Geolocation timeout';
          break;
      }

      self.postMessage({
        type: 'ERROR',
        message,
        code: error.code,
      });
    },
    options
  );

  self.postMessage({
    type: 'TRACKING_STARTED',
    message: 'Geolocation tracking started',
  });
}

/**
 * Stop tracking user location
 */
function stopTracking(): void {
  if (!isTracking || watchId === null) {
    self.postMessage({ type: 'ERROR', message: 'Not currently tracking' });
    return;
  }

  navigator.geolocation.clearWatch(watchId);
  watchId = null;
  isTracking = false;

  self.postMessage({
    type: 'TRACKING_STOPPED',
    message: 'Geolocation tracking stopped',
  });
}

/**
 * Get current location once
 */
function getLocation(): void {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { coords, timestamp } = position;
      const locationData: LocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        altitudeAccuracy: coords.altitudeAccuracy,
        heading: coords.heading,
        speed: coords.speed,
        timestamp,
        source_localisation: 'gps_mobile', // Default source for GPS
        fiabilite_source: coords.accuracy < 50 ? 'haute' : coords.accuracy < 100 ? 'moyenne' : 'faible',
        type_localisation: 'derniere_observation', // Current location
      };

      self.postMessage({
        type: 'LOCATION_DATA',
        data: locationData,
      });
    },
    (error) => {
      let message = 'Geolocation error';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = 'Permission denied for geolocation';
          break;
        case error.POSITION_UNAVAILABLE:
          message = 'Position unavailable';
          break;
        case error.TIMEOUT:
          message = 'Geolocation timeout';
          break;
      }

      self.postMessage({
        type: 'ERROR',
        message,
        code: error.code,
      });
    },
    options
  );
}

/**
 * Update geolocation options
 */
function setOptions(newOptions: GeolocationOptions): void {
  options = { ...options, ...newOptions };
  self.postMessage({
    type: 'OPTIONS_UPDATED',
    options,
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if location triggers any proximity zones
 */
function checkProximityZones(location: LocationData): ProximityZone[] {
  const triggered: ProximityZone[] = [];

  proximityZones.forEach((zone) => {
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      zone.latitude_centre,
      zone.longitude_centre
    );

    if (distance <= zone.rayon_km) {
      triggered.push(zone);
    }
  });

  return triggered;
}

/**
 * Message handler
 */
self.onmessage = (event: MessageEvent<GeolocationMessage>) => {
  const { type, options: newOptions, proximityZone } = event.data;

  switch (type) {
    case 'START_TRACKING':
      startTracking();
      break;

    case 'STOP_TRACKING':
      stopTracking();
      break;

    case 'GET_LOCATION':
      getLocation();
      break;

    case 'SET_OPTIONS':
      if (newOptions) {
        setOptions(newOptions);
      }
      break;

    case 'ADD_PROXIMITY_ZONE':
      if (proximityZone) {
        proximityZones.push(proximityZone);
        self.postMessage({
          type: 'PROXIMITY_ZONE_ADDED',
          zoneId: proximityZone.id,
          totalZones: proximityZones.length,
        });
      }
      break;

    case 'CHECK_PROXIMITY':
      getLocation();
      break;

    case 'GET_TRACKING_SESSION':
      if (trackingSession) {
        self.postMessage({
          type: 'TRACKING_SESSION_DATA',
          session: trackingSession,
        });
      } else {
        self.postMessage({
          type: 'ERROR',
          message: 'No active tracking session',
        });
      }
      break;

    default:
      self.postMessage({
        type: 'ERROR',
        message: `Unknown message type: ${type}`,
      });
  }
};

export {};
