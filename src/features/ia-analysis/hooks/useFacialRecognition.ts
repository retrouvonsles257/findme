/**
 * =====================================================
 * RETROUVONSLES - useFacialRecognition Hook
 * Hook for facial recognition operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  performFacialAnalysis,
  fetchFacialRecognitionResults,
  setCurrentFacialAnalysis,
} from '../store/iaSlice';
import {
  selectFacialRecognitionResults,
  selectCurrentFacialAnalysis,
  selectIALoading,
  selectIAError,
} from '../store/iaSelectors';
import type { FacialRecognitionFormData, UseFacialRecognitionReturn, FacialRecognitionResult } from '../types';

export const useFacialRecognition = (): UseFacialRecognitionReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const results = useSelector(selectFacialRecognitionResults);
  const currentAnalysis = useSelector(selectCurrentFacialAnalysis);
  const isLoading = useSelector(selectIALoading);
  const error = useSelector(selectIAError);

  const analyzeFacial = useCallback(
    async (data: FacialRecognitionFormData): Promise<FacialRecognitionResult> => {
      return (dispatch(performFacialAnalysis(data)) as any).unwrap();
    },
    [dispatch],
  );

  const getFacialHistory = useCallback(
    async (personId: string): Promise<FacialRecognitionResult[]> => {
      try {
        return await (dispatch(fetchFacialRecognitionResults(personId)) as any).unwrap();
      } catch {
        return [];
      }
    },
    [dispatch],
  );

  const handleSetCurrentAnalysis = useCallback(
    (analysis: FacialRecognitionResult | null) => {
      dispatch(setCurrentFacialAnalysis(analysis));
    },
    [dispatch],
  );

  return {
    results,
    currentAnalysis,
    analyzeFacial,
    getFacialHistory,
    setCurrentAnalysis: handleSetCurrentAnalysis,
    isLoading,
    error,
  };
};
