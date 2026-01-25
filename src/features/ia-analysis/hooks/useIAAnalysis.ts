/**
 * =====================================================
 * RETROUVONSLES - useIAAnalysis Hook
 * Main hook for IA analysis operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  setAnalysisMode,
  setConfidenceThreshold,
} from '../store/iaSlice';
import {
  selectFacialRecognitionResults,
  selectImageComparisonResults,
  selectLocationPredictions,
  selectSimilaritiesResults,
  selectIALoading,
  selectIAError,
  selectAnalysisMode,
  selectConfidenceThreshold,
} from '../store/iaSelectors';
import type {
  UseIAAnalysisReturn,
} from '../types';

export const useIAAnalysis = (): UseIAAnalysisReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const facialResults = useSelector(selectFacialRecognitionResults);
  const comparisonResults = useSelector(selectImageComparisonResults);
  const locationPredictions = useSelector(selectLocationPredictions);
  const similaritiesResults = useSelector(selectSimilaritiesResults);
  const isLoading = useSelector(selectIALoading);
  const error = useSelector(selectIAError);
  const analysisMode = useSelector(selectAnalysisMode);
  const confidenceThreshold = useSelector(selectConfidenceThreshold);

  const handleSetAnalysisMode = useCallback(
    (mode: 'facial' | 'comparison' | 'location' | 'similarities' | null) => {
      dispatch(setAnalysisMode(mode));
    },
    [dispatch],
  );

  const handleSetConfidenceThreshold = useCallback(
    (threshold: number) => {
      dispatch(setConfidenceThreshold(threshold));
    },
    [dispatch],
  );

  return {
    facialResults,
    comparisonResults,
    locationPredictions,
    similaritiesResults,
    isLoading,
    error,
    analysisMode,
    setAnalysisMode: handleSetAnalysisMode,
    confidenceThreshold,
    setConfidenceThreshold: handleSetConfidenceThreshold,
  };
};
