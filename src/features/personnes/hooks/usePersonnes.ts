/**
 * =====================================================
 * RETROUVONSLES - usePersonnes Hook
 * Hook for personne operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchPersonnes,
  fetchPersonneById,
  createNewPersonne,
  updatePersonneData,
  deletePersonneData,
  searchPersonnes,
} from '../store/personneSlice';
import {
  selectAllPersonnes,
  selectIsLoading,
  selectError,
  selectPagination,
  selectSelectedPersonne,
} from '../store/personneSelectors';
import type { Personne, PersonneFilter, PersonneCreatePayload, PersonneUpdatePayload } from '../types';

export interface UsePersonnesResult {
  personnes: Personne[];
  selectedPersonne: Personne | null;
  isLoading: boolean;
  error: string | null;
  pagination: { currentPage: number; pageSize: number; total: number };
  fetchPersonnes: (filter?: PersonneFilter, page?: number) => Promise<any>;
  fetchPersonneById: (id: string) => Promise<any>;
  createPersonne: (payload: PersonneCreatePayload, userId: string) => Promise<any>;
  updatePersonne: (id: string, payload: PersonneUpdatePayload) => Promise<any>;
  deletePersonne: (id: string) => Promise<any>;
  searchPersonnes: (filter: PersonneFilter) => Promise<any>;
}

/**
 * usePersonnes hook
 */
export const usePersonnes = (): UsePersonnesResult => {
  const dispatch = useDispatch<AppDispatch>();
  const personnes = useSelector(selectAllPersonnes);
  const selectedPersonne = useSelector(selectSelectedPersonne);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination);

  const handleFetchPersonnes = useCallback(
    (filter?: PersonneFilter, page: number = 1) => {
      return (dispatch(fetchPersonnes({ filter, page })) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchPersonneById = useCallback(
    (id: string) => {
      return (dispatch(fetchPersonneById(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleCreatePersonne = useCallback(
    (payload: PersonneCreatePayload, userId: string) => {
      return (dispatch(createNewPersonne({ payload, userId })) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdatePersonne = useCallback(
    (id: string, payload: PersonneUpdatePayload) => {
      return (dispatch(updatePersonneData({ id, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleDeletePersonne = useCallback(
    (id: string) => {
      return (dispatch(deletePersonneData(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleSearchPersonnes = useCallback(
    (filter: PersonneFilter) => {
      return (dispatch(searchPersonnes(filter as any)) as any).unwrap();
    },
    [dispatch]
  );

  return {
    personnes,
    selectedPersonne,
    isLoading,
    error,
    pagination,
    fetchPersonnes: handleFetchPersonnes,
    fetchPersonneById: handleFetchPersonneById,
    createPersonne: handleCreatePersonne,
    updatePersonne: handleUpdatePersonne,
    deletePersonne: handleDeletePersonne,
    searchPersonnes: handleSearchPersonnes,
  };
};
