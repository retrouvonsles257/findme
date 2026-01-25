/**
 * =====================================================
 * RETROUVONSLES - Geolocation Service
 * Business logic for geolocation operations
 * =====================================================
 */

import * as geolocationAPI from './geolocationAPI';
import type {
  LocationDatabase,
  LocationInput,
  CurrentLocation,
  ProximityZone,
} from '../types';

/**
 * Calculate distance between two points (Haversine formula)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
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
};

/**
 * Calculate bearing between two points
 */
export const calculateBearing = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

  const bearing = Math.atan2(y, x);
  const degrees = (bearing * 180) / Math.PI;
  return (degrees + 360) % 360;
};

/**
 * Check if location is within proximity zone
 */
export const isWithinZone = (
  location: CurrentLocation,
  zone: ProximityZone,
): boolean => {
  const distance = calculateDistance(
    location.latitude,
    location.longitude,
    zone.latitude_centre,
    zone.longitude_centre,
  );
  return distance <= zone.rayon_km;
};

/**
 * Get locations within distance
 */
export const getLocationsWithinDistance = async (
  center: CurrentLocation,
  maxDistanceKm: number,
): Promise<LocationDatabase[]> => {
  const locations = await geolocationAPI.getLocationsNearby(
    center.latitude,
    center.longitude,
    maxDistanceKm,
  );

  return locations.filter((loc) => {
    const dist = calculateDistance(
      center.latitude,
      center.longitude,
      loc.latitude,
      loc.longitude,
    );
    return dist <= maxDistanceKm;
  });
};

/**
 * Create location with validation
 */
export const createLocationWithValidation = async (
  input: LocationInput,
): Promise<LocationDatabase> => {
  // Validate coordinates
  if (input.latitude < -90 || input.latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }
  if (input.longitude < -180 || input.longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  // Validate precision
  if (input.precision_m && input.precision_m < 0) {
    throw new Error('Precision must be positive');
  }

  return geolocationAPI.createLocation(input);
};

/**
 * Get location with enriched data
 */
export const getLocationWithMetadata = async (id: string) => {
  const location = await geolocationAPI.getLocationById(id);
  return {
    ...location,
    locationName: `${location.ville || ''} ${location.region || ''}`.trim(),
    formattedAddress: location.adresse || 'Unknown location',
  };
};

/**
 * Reverse geocode (convert coordinates to address)
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number,
): Promise<{
  address: string;
  city?: string;
  region?: string;
  country?: string;
}> => {
  try {
    // Using MapTiler API (would need API key from config)
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`,
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        address: feature.place_name,
        city: feature.context?.find((c: any) => c.id.startsWith('place'))?.text,
        region: feature.context?.find((c: any) => c.id.startsWith('region'))?.text,
        country: feature.context?.find((c: any) => c.id.startsWith('country'))?.text,
      };
    }

    return {
      address: `${latitude}, ${longitude}`,
    };
  } catch {
    return {
      address: `${latitude}, ${longitude}`,
    };
  }
};

/**
 * Forward geocode (convert address to coordinates)
 */
export const forwardGeocode = async (
  address: string,
): Promise<{
  latitude: number;
  longitude: number;
  formatted_address: string;
} | null> => {
  try {
    const response = await fetch(
      `https://api.maptiler.com/geocoding/${encodeURIComponent(address)}.json?key=${process.env.REACT_APP_MAPTILER_API_KEY}`,
    );
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].geometry.coordinates;
      return {
        latitude,
        longitude,
        formatted_address: data.features[0].place_name,
      };
    }

    return null;
  } catch {
    return null;
  }
};

/**
 * Export service functions
 */
const geolocationService = {
  calculateDistance,
  calculateBearing,
  isWithinZone,
  getLocationsWithinDistance,
  createLocationWithValidation,
  getLocationWithMetadata,
  reverseGeocode,
  forwardGeocode,
};

export default geolocationService;
