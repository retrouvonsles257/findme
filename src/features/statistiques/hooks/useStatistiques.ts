/**
 * =====================================================
 * RETROUVONSLES - useStatistiques Hook
 * Main hook for statistics operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchStatistiquesGlobales,
  fetchStatistiquesRegionales,
  fetchTendancesTemporelles,
  fetchDemographieStats,
  fetchDistributionType,
  fetchDashboardMetrics,
  exportStatisticsData,
  setFilter,
  setDateRange,
  setSelectedRegion,
  setSelectedPeriod,
} from '../store/statistiqueSlice';
import {
  selectStatsGlobales,
  selectStatsRegionales,
  selectTendances,
  selectDemographics,
  selectDistributions,
  selectIsLoading,
  selectError,
  selectDateRange,
  selectCurrentFilter,
} from '../store/statistiqueSelectors';
import type { StatistiquesFilter } from '../types';

export interface UseStatistiquesResult {
  // Data
  stats_globales: any;
  stats_regionales: any[];
  tendances: any[];
  demographics: any[];
  distributions: any[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  dateRange: any;
  currentFilter: any;
  
  // Functions
  fetch: () => void;
  fetchRegionales: () => void;
  fetchTendances: (debut: string, fin: string) => void;
  fetchDemographics: () => void;
  fetchDistributions: () => void;
  fetchDashboard: (days?: number) => void;
  updateFilter: (filter: StatistiquesFilter) => void;
  updateDateRange: (debut: string, fin: string) => void;
  selectRegion: (region: string | undefined) => void;
  selectPeriod: (period: string | undefined) => void;
  exportData: (format: 'csv' | 'json' | 'pdf' | 'xlsx') => void;
}

export const useStatistiques = (): UseStatistiquesResult => {
  const dispatch = useDispatch<AppDispatch>();

  const stats_globales = useSelector(selectStatsGlobales);
  const stats_regionales = useSelector(selectStatsRegionales);
  const tendances = useSelector(selectTendances);
  const demographics = useSelector(selectDemographics);
  const distributions = useSelector(selectDistributions);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const dateRange = useSelector(selectDateRange);
  const currentFilter = useSelector(selectCurrentFilter);

  const fetch = useCallback(() => {
    dispatch(fetchStatistiquesGlobales());
  }, [dispatch]);

  const fetchRegionales = useCallback(() => {
    dispatch(fetchStatistiquesRegionales());
  }, [dispatch]);

  const fetchTendances = useCallback(
    (debut: string, fin: string) => {
      dispatch(fetchTendancesTemporelles({ debut, fin }));
    },
    [dispatch]
  );

  const fetchDemographics = useCallback(() => {
    dispatch(fetchDemographieStats());
  }, [dispatch]);

  const fetchDistributions = useCallback(() => {
    dispatch(fetchDistributionType());
  }, [dispatch]);

  const fetchDashboard = useCallback(
    (days: number = 7) => {
      dispatch(fetchDashboardMetrics(days));
    },
    [dispatch]
  );

  const updateFilter = useCallback(
    (filter: StatistiquesFilter) => {
      dispatch(setFilter(filter));
    },
    [dispatch]
  );

  const updateDateRange = useCallback(
    (debut: string, fin: string) => {
      dispatch(setDateRange({ debut, fin }));
    },
    [dispatch]
  );

  const selectRegion = useCallback(
    (region: string | undefined) => {
      dispatch(setSelectedRegion(region));
    },
    [dispatch]
  );

  const selectPeriod = useCallback(
    (period: string | undefined) => {
      dispatch(setSelectedPeriod(period));
    },
    [dispatch]
  );

  const exportData = useCallback(
    (format: 'csv' | 'json' | 'pdf' | 'xlsx') => {
      dispatch(exportStatisticsData(format));
    },
    [dispatch]
  );

  return {
    stats_globales,
    stats_regionales,
    tendances,
    demographics,
    distributions,
    isLoading,
    error,
    dateRange,
    currentFilter,
    fetch,
    fetchRegionales,
    fetchTendances,
    fetchDemographics,
    fetchDistributions,
    fetchDashboard,
    updateFilter,
    updateDateRange,
    selectRegion,
    selectPeriod,
    exportData,
  };
};
