/**
 * =====================================================
 * RETROUVONSLES - useLocationPrediction Hook
 * Hook for location prediction operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  performLocationPrediction,
  fetchLocationPredictions,
  setCurrentLocationPrediction,
} from '../store/iaSlice';
import {
  selectLocationPredictions,
  selectCurrentLocationPrediction,
  selectIALoading,
  selectIAError,
} from '../store/iaSelectors';
import type { LocationPredictionFormData, LocationPredictionResult, UseLocationPredictionReturn } from '../types';

export const useLocationPrediction = (): UseLocationPredictionReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const predictions = useSelector(selectLocationPredictions);
  const currentPrediction = useSelector(selectCurrentLocationPrediction);
  const isLoading = useSelector(selectIALoading);
  const error = useSelector(selectIAError);

  const predictLocation = useCallback(
    async (data: LocationPredictionFormData): Promise<LocationPredictionResult> => {
      return (dispatch(performLocationPrediction(data)) as any).unwrap();
    },
    [dispatch],
  );

  const getPredictionHistory = useCallback(
    async (personId: string): Promise<LocationPredictionResult[]> => {
      try {
        return await (dispatch(fetchLocationPredictions(personId)) as any).unwrap();
      } catch {
        return [];
      }
    },
    [dispatch],
  );

  const handleSetCurrentPrediction = useCallback(
    (prediction: LocationPredictionResult | null) => {
      dispatch(setCurrentLocationPrediction(prediction));
    },
    [dispatch],
  );

  return {
    predictions,
    currentPrediction,
    predictLocation,
    getPredictionHistory,
    setCurrentPrediction: handleSetCurrentPrediction,
    isLoading,
    error,
  };
};
