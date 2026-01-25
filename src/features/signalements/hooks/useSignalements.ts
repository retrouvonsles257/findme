/**
 * =====================================================
 * RETROUVONSLES - useSignalements Hook
 * Hook for signalement list operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchSignalements,
  fetchSignalementById,
  createNewSignalement,
  updateSignalementData,
  deleteSignalementData,
  searchSignalementsData,
  fetchSignalementStats,
} from '../store/signalementSlice';
import { selectAllSignalements, selectIsLoading, selectError, selectPagination, selectStats } from '../store/signalementSelectors';
import type { Signalement, SignalementFilter, SignalementCreatePayload, SignalementUpdatePayload } from '../types';

export interface UseSignalementsResult {
  signalements: Signalement[];
  isLoading: boolean;
  error: string | null;
  pagination: { currentPage: number; pageSize: number; total: number };
  stats: any | null;
  fetchSignalements: (filter?: SignalementFilter, page?: number) => Promise<any>;
  fetchSignalementById: (id: string) => Promise<any>;
  createSignalement: (payload: SignalementCreatePayload, userId: string) => Promise<any>;
  updateSignalement: (id: string, payload: SignalementUpdatePayload) => Promise<any>;
  deleteSignalement: (id: string) => Promise<any>;
  searchSignalements: (filter: SignalementFilter) => Promise<any>;
  fetchStats: () => Promise<any>;
}

export const useSignalements = (): UseSignalementsResult => {
  const dispatch = useDispatch<AppDispatch>();
  const signalements = useSelector(selectAllSignalements);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination);
  const stats = useSelector(selectStats);

  const handleFetchSignalements = useCallback(
    (filter?: SignalementFilter, page: number = 1) => {
      return (dispatch(fetchSignalements({ filter, page })) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchSignalementById = useCallback(
    (id: string) => {
      return (dispatch(fetchSignalementById(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleCreateSignalement = useCallback(
    (payload: SignalementCreatePayload, userId: string) => {
      return (dispatch(createNewSignalement({ payload, userId })) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateSignalement = useCallback(
    (id: string, payload: SignalementUpdatePayload) => {
      return (dispatch(updateSignalementData({ id, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleDeleteSignalement = useCallback(
    (id: string) => {
      return (dispatch(deleteSignalementData(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleSearchSignalements = useCallback(
    (filter: SignalementFilter) => {
      return (dispatch(searchSignalementsData(filter as any)) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchStats = useCallback(() => {
    return (dispatch(fetchSignalementStats()) as any).unwrap();
  }, [dispatch]);

  return {
    signalements,
    isLoading,
    error,
    pagination,
    stats,
    fetchSignalements: handleFetchSignalements,
    fetchSignalementById: handleFetchSignalementById,
    createSignalement: handleCreateSignalement,
    updateSignalement: handleUpdateSignalement,
    deleteSignalement: handleDeleteSignalement,
    searchSignalements: handleSearchSignalements,
    fetchStats: handleFetchStats,
  };
};
