/**
 * =====================================================
 * RETROUVONSLES - useLocationPrediction Hook
 * Hook for location prediction operations
 * Utilise le type ResultatIA selon le modèle de données
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
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
import type { ResultatIA } from '../services/iaAPI';

// Interface pour les inputs de prédiction
interface LocationPredictionInput {
  dossierId: string;
}

// Interface de retour du hook
export interface UseLocationPredictionReturn {
  predictions: ResultatIA[];
  currentPrediction: ResultatIA | null;
  predictLocation: (data: LocationPredictionInput) => Promise<ResultatIA>;
  getPredictionHistory: (dossierId?: string) => Promise<ResultatIA[]>;
  setCurrentPrediction: (prediction: ResultatIA | null) => void;
  isLoading: boolean;
  error: string | null;
}

export const useLocationPrediction = (): UseLocationPredictionReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const predictions = useSelector(selectLocationPredictions);
  const currentPrediction = useSelector(selectCurrentLocationPrediction);
  const isLoading = useSelector(selectIALoading);
  const error = useSelector(selectIAError);

  const predictLocation = useCallback(
    async (data: LocationPredictionInput): Promise<ResultatIA> => {
      return (dispatch(performLocationPrediction(data)) as any).unwrap();
    },
    [dispatch],
  );

  const getPredictionHistory = useCallback(
    async (dossierId?: string): Promise<ResultatIA[]> => {
      try {
        return await (dispatch(fetchLocationPredictions(dossierId)) as any).unwrap();
      } catch {
        return [];
      }
    },
    [dispatch],
  );

  const handleSetCurrentPrediction = useCallback(
    (prediction: ResultatIA | null) => {
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
