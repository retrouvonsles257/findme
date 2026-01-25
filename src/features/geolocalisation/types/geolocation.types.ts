/**
 * =====================================================
 * RETROUVONSLES - Geolocation Types
 * Types et interfaces pour la gestion de la géolocalisation
 * =====================================================
 */

import type {
  SourceLocalisation,
  FiabiliteSource,
  TypeLocalisation,
} from '../../../@types/enums.types';

// ============================================
// DATABASE TYPES
// ============================================

export interface LocationDatabase {
  id: string;
  latitude: number;
  longitude: number;
  point: any; // PostGIS geography
  precision_m?: number;
  altitude_m?: number;
  source_localisation: SourceLocalisation;
  fiabilite_source: FiabiliteSource;
  type_localisation: TypeLocalisation;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  point_interet?: string;
  description?: string;
  date_localisation: string;
  id_dossier?: string;
  id_signalement?: string;
  enregistree_par?: string;
  created_at: string;
}

export interface LocationInput {
  latitude: number;
  longitude: number;
  precision_m?: number;
  altitude_m?: number;
  source_localisation: SourceLocalisation;
  fiabilite_source?: FiabiliteSource;
  type_localisation: TypeLocalisation;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  point_interet?: string;
  description?: string;
  date_localisation: string;
  id_dossier?: string;
  id_signalement?: string;
}

export interface LocationUpdate {
  latitude?: number;
  longitude?: number;
  precision_m?: number;
  altitude_m?: number;
  source_localisation?: SourceLocalisation;
  fiabilite_source?: FiabiliteSource;
  type_localisation?: TypeLocalisation;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  point_interet?: string;
  description?: string;
  date_localisation?: string;
}

export interface LocationDisplay extends LocationDatabase {
  distance_km?: number;
  bearing_degrees?: number;
}

// ============================================
// GEOLOCATION STATE TYPES
// ============================================

export interface CurrentLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationHistory {
  locations: LocationDatabase[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface ProximityAlert {
  id: string;
  center_lat: number;
  center_lon: number;
  radius_km: number;
  nom: string;
  description?: string;
  type_alerte: string;
  est_active: boolean;
  created_at: string;
}

export interface ProximityZone {
  id: string;
  latitude_centre: number;
  longitude_centre: number;
  rayon_km: number;
  nom: string;
  description?: string;
  created_at: string;
}

// ============================================
// TRACKING STATE
// ============================================

export interface TrackingSession {
  id: string;
  isActive: boolean;
  startTime: number;
  lastUpdate: number;
  currentLocation: CurrentLocation | null;
  accuracy: number;
  error: string | null;
}

// ============================================
// REDUX STATE
// ============================================

export interface GeolocationState {
  currentLocation: CurrentLocation | null;
  locationHistory: LocationDatabase[];
  selectedLocation: LocationDisplay | null;
  
  isTracking: boolean;
  trackingPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  
  proximityAlerts: ProximityAlert[];
  proximityZones: ProximityZone[];
  activeAlerts: string[]; // Alert IDs
  
  loading: boolean;
  error: string | null;
  filters: {
    type_localisation?: TypeLocalisation;
    source_localisation?: SourceLocalisation;
    dateRange?: [number, number];
    region?: string;
    radius_km?: number;
    center_lat?: number;
    center_lon?: number;
  };
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseGeolocationReturn {
  currentLocation: CurrentLocation | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => void;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<CurrentLocation | null>;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => Promise<boolean>;
}

export interface UseLocationTrackingReturn {
  locationHistory: LocationDatabase[];
  isLoading: boolean;
  error: string | null;
  saveLocation: (location: LocationInput) => Promise<LocationDatabase>;
  getLocationHistory: (dossier_id: string, limit?: number) => Promise<void>;
  deleteLocation: (location_id: string) => Promise<void>;
  getLocationsByType: (type: TypeLocalisation) => LocationDatabase[];
}

export interface UseProximityAlertsReturn {
  proximityAlerts: ProximityAlert[];
  activeAlerts: string[];
  isLoading: boolean;
  error: string | null;
  addProximityZone: (zone: ProximityZone) => Promise<void>;
  createAlert: (zone: ProximityZone, personnes: string[]) => Promise<ProximityAlert>;
  checkProximity: (location: CurrentLocation) => string[]; // Returns triggered alert IDs
  dismissAlert: (alertId: string) => void;
}

// ============================================
// MAPBOX/MAPTILER TYPES
// ============================================

export interface MapLocation {
  lat: number;
  lng: number;
  name?: string;
  type?: TypeLocalisation;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
  color?: string;
  type?: TypeLocalisation;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeocodingResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    coordinates: [number, number];
    type: string;
  };
  context?: Array<{
    id: string;
    text: string;
  }>;
}

// ============================================
// ERROR TYPES
// ============================================

export interface GeolocationFormErrors {
  latitude?: string;
  longitude?: string;
  precision_m?: string;
  adresse?: string;
  type_localisation?: string;
  source_localisation?: string;
}
