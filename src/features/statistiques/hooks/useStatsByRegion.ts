/**
 * =====================================================
 * RETROUVONSLES - useStatsByRegion Hook
 * Hook for regional statistics operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import type { StatistiquesRegionales } from '../types';
import {
  fetchStatistiquesRegionales,
  setSelectedRegion,
} from '../store/statistiqueSlice';
import {
  selectStatsRegionales,
  selectIsLoading,
  selectError,
  selectTopRegions,
  selectBottomRegions,
} from '../store/statistiqueSelectors';

export interface UseStatsByRegionResult {
  regions: any[];
  topRegions: any[];
  bottomRegions: any[];
  isLoading: boolean;
  error: string | null;
  
  fetch: () => void;
  selectRegion: (region: string | undefined) => void;
  getRegion: (name: string) => any;
}

export const useStatsByRegion = (): UseStatsByRegionResult => {
  const dispatch = useDispatch<AppDispatch>();

  const regions = useSelector(selectStatsRegionales);
  const topRegions = useSelector(selectTopRegions);
  const bottomRegions = useSelector(selectBottomRegions);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const fetch = useCallback(() => {
    dispatch(fetchStatistiquesRegionales());
  }, [dispatch]);

  const selectRegion = useCallback(
    (region: string | undefined) => {
      dispatch(setSelectedRegion(region));
    },
    [dispatch]
  );

  const getRegion = useCallback(
    (name: string) => {
      return regions.find((r: StatistiquesRegionales) => r.region === name);
    },
    [regions]
  );

  return {
    regions,
    topRegions,
    bottomRegions,
    isLoading,
    error,
    fetch,
    selectRegion,
    getRegion,
  };
};
