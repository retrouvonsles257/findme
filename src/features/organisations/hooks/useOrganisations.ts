/**
 * =====================================================
 * RETROUVONSLES - useOrganisations Hook
 * Hook for organisation operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchOrganisations,
  fetchUserOrganisations,
  createNewOrganisation,
  updateOrganisationData,
  deleteOrganisationData,
} from '../store/organisationSlice';
import {
  selectAllOrganisations,
  selectIsLoading,
  selectError,
  selectPagination,
} from '../store/organisationSelectors';
import type { Organisation, OrganisationFilter, OrganisationCreatePayload, OrganisationUpdatePayload } from '../types';

export interface UseOrganisationsResult {
  organisations: Organisation[];
  isLoading: boolean;
  error: string | null;
  pagination: { currentPage: number; pageSize: number; total: number };
  fetchOrganisations: (filter?: OrganisationFilter, page?: number) => Promise<any>;
  fetchUserOrganisations: (userId: string) => Promise<any>;
  createOrganisation: (payload: OrganisationCreatePayload, userId: string) => Promise<any>;
  updateOrganisation: (id: string, payload: OrganisationUpdatePayload) => Promise<any>;
  deleteOrganisation: (id: string) => Promise<any>;
}

/**
 * useOrganisations hook
 */
export const useOrganisations = (): UseOrganisationsResult => {
  const dispatch = useDispatch<AppDispatch>();
  const organisations = useSelector(selectAllOrganisations);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const pagination = useSelector(selectPagination);

  const handleFetchOrganisations = useCallback(
    (filter?: OrganisationFilter, page: number = 1) => {
      return (dispatch(fetchOrganisations({ filter, page })) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchUserOrganisations = useCallback(
    (userId: string) => {
      return (dispatch(fetchUserOrganisations(userId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleCreateOrganisation = useCallback(
    (payload: OrganisationCreatePayload, userId: string) => {
      return (dispatch(createNewOrganisation({ payload, userId })) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateOrganisation = useCallback(
    (id: string, payload: OrganisationUpdatePayload) => {
      return (dispatch(updateOrganisationData({ id, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleDeleteOrganisation = useCallback(
    (id: string) => {
      return (dispatch(deleteOrganisationData(id)) as any).unwrap();
    },
    [dispatch]
  );

  return {
    organisations,
    isLoading,
    error,
    pagination,
    fetchOrganisations: handleFetchOrganisations,
    fetchUserOrganisations: handleFetchUserOrganisations,
    createOrganisation: handleCreateOrganisation,
    updateOrganisation: handleUpdateOrganisation,
    deleteOrganisation: handleDeleteOrganisation,
  };
};
