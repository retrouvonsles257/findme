/**
 * =====================================================
 * RETROUVONSLES - Geolocation Provider
 * Fournisseur de géolocalisation avec tracking
 * =====================================================
 */

import React, { ReactNode, useEffect, useState, useCallback, useRef } from 'react';
import {
  GeolocationContext,
  GeolocationCoordinates,
  GeolocationContextType,
} from './GeolocaltionContext';

interface GeolocationProviderProps {
  children: ReactNode;
  enableAutoTracking?: boolean;
}

/**
 * Provider de géolocalisation
 */
export const GeolocationProvider: React.FC<GeolocationProviderProps> = ({
  children,
  enableAutoTracking = false,
}) => {
  const [location, setLocation] = useState<GeolocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [isSupported] = useState(
    typeof navigator !== 'undefined' && !!navigator.geolocation
  );
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | 'unknown'>('unknown');
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  // Vérifier la permission de géolocalisation
  useEffect(() => {
    if (isSupported && navigator.permissions) {
      navigator.permissions
        .query({ name: 'geolocation' } as PermissionDescriptor)
        .then(result => {
          setPermissionStatus(result.state as unknown as PermissionStatus);
        })
        .catch(() => {
          setPermissionStatus('unknown');
        });
    }
  }, [isSupported]);

  // Convertir les coordonnées
  const convertCoordinates = (position: GeolocationPosition): GeolocationCoordinates => {
    const { coords, timestamp } = position;
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      altitude: coords.altitude,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: coords.heading,
      speed: coords.speed,
      timestamp: timestamp || Date.now(),
    };
  };

  // Obtenir la position actuelle
  const getCurrentLocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        setError(new GeolocationPositionError());
        resolve(null);
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = convertCoordinates(position);
          setLocation(coords);
          setError(null);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          setError(err);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [isSupported]);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!isSupported) {
        resolve(false);
        return;
      }

      getCurrentLocation().then(location => {
        resolve(location !== null);
      });
    });
  }, [isSupported, getCurrentLocation]);

  // Commencer le tracking
  const startTracking = useCallback(
    async (options?: PositionOptions) => {
      if (!isSupported) {
        setError(new GeolocationPositionError());
        return;
      }

      setLoading(true);
      setIsTracking(true);

      try {
        // Obtenir la position initiale
        await getCurrentLocation();

        // Commencer le tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const coords = convertCoordinates(position);
            setLocation(coords);
            setError(null);
          },
          (err) => {
            setError(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            ...options,
          }
        );
      } catch (err) {
        setError(new GeolocationPositionError());
      } finally {
        setLoading(false);
      }
    },
    [isSupported, getCurrentLocation]
  );

  // Arrêter le tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
    }
  }, []);

  // Auto-tracking au montage
  useEffect(() => {
    if (enableAutoTracking && isSupported) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enableAutoTracking, isSupported, startTracking, stopTracking]);

  // Calculer la distance entre deux points (formule Haversine)
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Rayon de la Terre en km
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
    },
    []
  );

  // Vérifier si l'utilisateur est à proximité
  const isWithinRadius = useCallback((lat: number, lon: number, radius: number): boolean => {
    if (!location) return false;
    const distance = calculateDistance(location.latitude, location.longitude, lat, lon);
    return distance <= radius;
  }, [location, calculateDistance]);

  const contextValue: GeolocationContextType = {
    location,
    loading,
    error,
    isSupported,
    permissionStatus,
    isTracking,
    startTracking,
    stopTracking,
    getCurrentLocation,
    requestPermission,
    calculateDistance,
    isWithinRadius,
  };

  return (
    <GeolocationContext.Provider value={contextValue}>
      {children}
    </GeolocationContext.Provider>
  );
};

export default GeolocationProvider;
