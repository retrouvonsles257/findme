/**
 * =====================================================
 * RETROUVONSLES - Geolocation Redux Selectors
 * Redux state selectors for geolocation
 * =====================================================
 */

import type { RootState } from '../../../store/types';
import type { LocationDisplay } from '../types';

export const selectCurrentLocation = (state: RootState) => state.geolocation?.currentLocation || null;

export const selectLocationHistory = (state: RootState) => state.geolocation?.locationHistory || [];

export const selectSelectedLocation = (state: RootState) => state.geolocation?.selectedLocation || null;

export const selectGeolocationLoading = (state: RootState) => state.geolocation?.loading || false;

export const selectGeolocationError = (state: RootState) => state.geolocation?.error || null;

export const selectIsTracking = (state: RootState) => state.geolocation?.isTracking || false;

export const selectTrackingPermission = (state: RootState) => state.geolocation?.trackingPermission || 'unknown';

export const selectProximityZones = (state: RootState) => state.geolocation?.proximityZones || [];

export const selectProximityAlerts = (state: RootState) => state.geolocation?.proximityAlerts || [];

export const selectActiveAlerts = (state: RootState) => state.geolocation?.activeAlerts || [];

export const selectGeolocationFilters = (state: RootState) => state.geolocation?.filters || {};

/**
 * Get locations filtered by type
 */
export const selectLocationsByType = (state: RootState, type: string) => {
  return (state.geolocation?.locationHistory || []).filter((loc: LocationDisplay) => loc.type_localisation === type);
};

/**
 * Get locations filtered by source
 */
export const selectLocationsBySource = (state: RootState, source: string) => {
  return (state.geolocation?.locationHistory || []).filter((loc: LocationDisplay) => loc.source_localisation === source);
};

/**
 * Get nearby locations (within radius)
 */
export const selectNearbyLocations = (state: RootState, radiusKm: number = 50) => {
  const current = selectCurrentLocation(state);
  if (!current) return [];

  return (state.geolocation?.locationHistory || []).filter((loc: LocationDisplay) => {
    const distance = Math.sqrt(
      Math.pow(loc.latitude - current.latitude, 2) + Math.pow(loc.longitude - current.longitude, 2),
    );
    return distance * 111 <= radiusKm; // Rough conversion of degrees to km
  });
};

/**
 * Get statistics on locations
 */
export const selectLocationStatistics = (state: RootState) => {
  const locations = selectLocationHistory(state);
  const total = locations.length;
  const byType = locations.reduce(
    (acc: Record<string, number>, loc: LocationDisplay) => ({
      ...acc,
      [loc.type_localisation]: (acc[loc.type_localisation as any] || 0) + 1,
    }),
    {} as Record<string, number>,
  );
  const bySource = locations.reduce(
    (acc: Record<string, number>, loc: LocationDisplay) => ({
      ...acc,
      [loc.source_localisation]: (acc[loc.source_localisation as any] || 0) + 1,
    }),
    {} as Record<string, number>,
  );

  return { total, byType, bySource };
};

/**
 * Get filtered locations based on filters
 */
export const selectFilteredLocations = (state: RootState) => {
  const locations = selectLocationHistory(state);
  const filters = selectGeolocationFilters(state);

  return locations.filter((loc: LocationDisplay) => {
    if (filters.type_localisation && loc.type_localisation !== filters.type_localisation) {
      return false;
    }
    if (filters.source_localisation && loc.source_localisation !== filters.source_localisation) {
      return false;
    }
    if (filters.region && loc.region !== filters.region) {
      return false;
    }
    return true;
  });
};
