/**
 * =====================================================
 * RETROUVONSLES - useStatsByType Hook
 * Hook for case type statistics operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import type { DistributionType } from '../types';
import { fetchDistributionType } from '../store/statistiqueSlice';
import {
  selectDistributions,
  selectIsLoading,
  selectError,
  selectCaseTypeDistribution,
} from '../store/statistiqueSelectors';

export interface UseStatsByTypeResult {
  distributions: any[];
  caseTypeData: any[];
  isLoading: boolean;
  error: string | null;
  
  fetch: () => void;
  getTypeStats: (type: string) => any;
}

export const useStatsByType = (): UseStatsByTypeResult => {
  const dispatch = useDispatch<AppDispatch>();

  const distributions = useSelector(selectDistributions);
  const caseTypeData = useSelector(selectCaseTypeDistribution);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const fetch = useCallback(() => {
    dispatch(fetchDistributionType());
  }, [dispatch]);

  const getTypeStats = useCallback(
    (type: string) => {
      return distributions.find((d: DistributionType) => d.type === type);
    },
    [distributions]
  );

  return {
    distributions,
    caseTypeData,
    isLoading,
    error,
    fetch,
    getTypeStats,
  };
};
