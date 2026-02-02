/**
 * =====================================================
 * RETROUVONSLES - useOrganisationDetail Hook
 * Hook for organisation detail operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchOrganisationById,
  updateOrganisationData,
  fetchStats,
  fetchSettings,
  updateSettings,
} from '../store/organisationSlice';
import {
  selectSelectedOrganisation,
  selectOrganisationStats,
  selectOrganisationSettings,
  selectIsLoading,
  selectError,
} from '../store/organisationSelectors';
import type { Organisation, OrganisationStats, OrganisationSettings, OrganisationUpdatePayload } from '../types';

export interface UseOrganisationDetailResult {
  organisation: Organisation | null;
  stats: OrganisationStats | null;
  settings: OrganisationSettings | null;
  isLoading: boolean;
  error: string | null;
  fetchOrganisation: (id: string) => Promise<any>;
  updateOrganisation: (id: string, payload: OrganisationUpdatePayload) => Promise<any>;
  fetchStats: (id: string) => Promise<any>;
  fetchSettings: (id: string) => Promise<any>;
  updateSettings: (id: string, settings: any) => Promise<any>;
}

/**
 * useOrganisationDetail hook
 */
export const useOrganisationDetail = (): UseOrganisationDetailResult => {
  const dispatch = useDispatch<AppDispatch>();
  const organisation = useSelector(selectSelectedOrganisation);
  const stats = useSelector(selectOrganisationStats);
  const settings = useSelector(selectOrganisationSettings);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const handleFetchOrganisation = useCallback(
    (id: string) => {
      return (dispatch(fetchOrganisationById(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateOrganisation = useCallback(
    (id: string, payload: OrganisationUpdatePayload) => {
      return (dispatch(updateOrganisationData({ id, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchStats = useCallback(
    (id: string) => {
      return (dispatch(fetchStats(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleFetchSettings = useCallback(
    (id: string) => {
      return (dispatch(fetchSettings(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateSettings = useCallback(
    (id: string, settingsData: any) => {
      return (dispatch(updateSettings({ organisationId: id, settings: settingsData })) as any).unwrap();
    },
    [dispatch]
  );

  return {
    organisation,
    stats,
    settings,
    isLoading,
    error,
    fetchOrganisation: handleFetchOrganisation,
    updateOrganisation: handleUpdateOrganisation,
    fetchStats: handleFetchStats,
    fetchSettings: handleFetchSettings,
    updateSettings: handleUpdateSettings,
  };
};
