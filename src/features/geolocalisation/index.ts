// Components
export * from './components';
export type { LocationTrackerProps, ProximityAlertsProps, LocationHistoryProps, LocationPermissionProps, ZoneSearchProps } from './components';

// Hooks
export { useGeolocation, useLocationTracking, useProximityAlerts } from './hooks';
export type { UseGeolocationReturn, UseLocationTrackingReturn, UseProximityAlertsReturn } from './types';

// Services
export { calculateBearing, calculateDistance, createLocationWithValidation, forwardGeocode, getLocationsWithinDistance, getLocationWithMetadata, isWithinZone, reverseGeocode } from './services';

// Store
export { geolocalisationReducer } from './store';
export { setCurrentLocation, setFilters, setSelectedLocation, setTracking, setTrackingPermission, dismissAlert, clearError, resetState } from './store/geolocalisationSlice';
export { selectCurrentLocation, selectLocationHistory, selectSelectedLocation, selectGeolocationLoading, selectGeolocationError, selectIsTracking, selectTrackingPermission, selectProximityZones, selectProximityAlerts, selectActiveAlerts, selectGeolocationFilters, selectLocationsByType, selectLocationsBySource, selectNearbyLocations, selectLocationStatistics, selectFilteredLocations } from './store/geolocalisationSelectors';

// Types
export type { LocationDatabase, LocationInput, LocationUpdate, LocationDisplay, CurrentLocation, ProximityAlert, ProximityZone, TrackingSession, GeolocationState, GeolocationFormErrors, MapLocation, MapMarker, GeocodingResult } from './types';
