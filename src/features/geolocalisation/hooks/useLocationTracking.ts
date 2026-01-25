/**
 * =====================================================
 * RETROUVONSLES - useLocationTracking Hook
 * Hook for managing location history and tracking
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchLocationsByDossier,
  createNewLocation,
  deleteLocationThunk,
} from '../store/geolocalisationSlice';
import {
  selectLocationHistory,
  selectGeolocationLoading,
  selectGeolocationError,
} from '../store/geolocalisationSelectors';
import type { LocationDatabase, LocationInput, UseLocationTrackingReturn } from '../types';

export const useLocationTracking = (): UseLocationTrackingReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const locationHistory = useSelector(selectLocationHistory);
  const isLoading = useSelector(selectGeolocationLoading);
  const error = useSelector(selectGeolocationError);

  const saveLocation = useCallback(
    async (location: LocationInput): Promise<LocationDatabase> => {
      const result = await (dispatch(createNewLocation(location)) as any).unwrap();
      return result;
    },
    [dispatch],
  );

  const getLocationHistory = useCallback(
    async (dossier_id: string) => {
      await dispatch(fetchLocationsByDossier(dossier_id));
    },
    [dispatch],
  );

  const deleteLocation = useCallback(
    async (location_id: string) => {
      await dispatch(deleteLocationThunk(location_id));
    },
    [dispatch],
  );

  const getLocationsByType = useCallback(
    (type: string) => {
      return locationHistory.filter((loc: any) => loc.type_localisation === type);
    },
    [locationHistory],
  );

  return {
    locationHistory,
    isLoading,
    error,
    saveLocation,
    getLocationHistory,
    deleteLocation,
    getLocationsByType,
  };
};
