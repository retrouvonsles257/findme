/**
 * =====================================================
 * RETROUVONSLES - useGeolocation Hook
 * Hook for managing current geolocation
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../config';
import { maybeSyncCitizenGpsToProfileDebounced } from '../../users/services/citizenLocationSync';
import type { UseGeolocationReturn, CurrentLocation } from '../types';

async function pushGpsToProfilCitoyen(latitude: number, longitude: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id;
    if (!uid) return;
    await maybeSyncCitizenGpsToProfileDebounced(uid, latitude, longitude);
  } catch {
    /* ignore */
  }
}

export const useGeolocation = (autoStart: boolean = false): UseGeolocationReturn => {
  const [currentLocation, setCurrentLocation] = useState<CurrentLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) {
      setPermission('unknown');
      return;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermission(result.state as any);
    } catch {
      setPermission('unknown');
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermission('granted');
          resolve(true);
        },
        () => {
          setPermission('denied');
          resolve(false);
        },
      );
    });
  }, []);

  const getCurrentLocation = useCallback(async (): Promise<CurrentLocation | null> => {
    if (permission === 'denied') {
      setError('Permission denied');
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: CurrentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
            altitude: position.coords.altitude || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          };
          console.log(`Geolocation: ${location.latitude}, ${location.longitude} (accuracy: ${location.accuracy}m)`);
          setCurrentLocation(location);
          setError(null);
          void pushGpsToProfilCitoyen(location.latitude, location.longitude);
          resolve(location);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setError(err.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        },
      );
    });
  }, [permission]);

  const startTracking = useCallback(() => {
    if (permission === 'denied') {
      setError('Permission denied');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: CurrentLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        };
        console.log(`Tracking update: ${location.latitude}, ${location.longitude} (accuracy: ${location.accuracy}m)`);
        setCurrentLocation(location);
        setError(null);
        void pushGpsToProfilCitoyen(location.latitude, location.longitude);
      },
      (err) => {
        console.warn('Tracking error:', err.message);
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );

    setIsTracking(true);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false);
    };
  }, [permission]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  useEffect(() => {
    if (autoStart && permission === 'granted') {
      startTracking();
    }
  }, [autoStart, permission, startTracking]);

  return {
    currentLocation,
    isTracking,
    error,
    startTracking,
    stopTracking,
    getCurrentLocation,
    permission,
    requestPermission,
  };
};
