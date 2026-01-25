/**
 * =====================================================
 * RETROUVONSLES - Geolocation Context
 * Gestion de la géolocalisation utilisateur
 * =====================================================
 */

import React, { createContext } from 'react';

/**
 * Interface pour les coordonnées géographiques
 */
export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

/**
 * Interface pour l'état de géolocalisation
 */
export interface GeolocationContextType {
  // État
  location: GeolocationCoordinates | null;
  loading: boolean;
  error: GeolocationPositionError | null;
  isSupported: boolean;
  permissionStatus: PermissionStatus | 'unknown';
  isTracking: boolean;

  // Actions
  startTracking: (options?: PositionOptions) => Promise<void>;
  stopTracking: () => void;
  getCurrentLocation: () => Promise<GeolocationCoordinates | null>;
  requestPermission: () => Promise<boolean>;

  // Helpers
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  isWithinRadius: (lat: number, lon: number, radius: number) => boolean;
}

/**
 * Crée le contexte de géolocalisation
 */
export const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte de géolocalisation
 */
export const useGeolocation = (): GeolocationContextType => {
  const context = React.useContext(GeolocationContext);
  if (!context) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};
