/**
 * =====================================================
 * RETROUVONSLES - useSignalementDetail Hook
 * Hook for signalement detail operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchSignalementById,
  updateSignalementData,
  addSignalementVerificationData,
} from '../store/signalementSlice';
import { selectSelectedSignalement, selectIsLoading, selectError } from '../store/signalementSelectors';
import type { Signalement, SignalementUpdatePayload, SignalementValidationPayload } from '../types';

export interface UseSignalementDetailResult {
  signalement: Signalement | null;
  isLoading: boolean;
  error: string | null;
  fetchSignalement: (id: string) => Promise<any>;
  updateSignalement: (id: string, payload: SignalementUpdatePayload) => Promise<any>;
  addVerification: (signalementId: string, verificateurId: string, payload: SignalementValidationPayload) => Promise<any>;
}

export const useSignalementDetail = (): UseSignalementDetailResult => {
  const dispatch = useDispatch<AppDispatch>();
  const signalement = useSelector(selectSelectedSignalement);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const handleFetchSignalement = useCallback(
    (id: string) => {
      return (dispatch(fetchSignalementById(id)) as any).unwrap();
    },
    [dispatch]
  );

  const handleUpdateSignalement = useCallback(
    (id: string, payload: SignalementUpdatePayload) => {
      return (dispatch(updateSignalementData({ id, payload })) as any).unwrap();
    },
    [dispatch]
  );

  const handleAddVerification = useCallback(
    (signalementId: string, verificateurId: string, payload: SignalementValidationPayload) => {
      return (dispatch(addSignalementVerificationData({ signalementId, verificateurId, payload })) as any).unwrap();
    },
    [dispatch]
  );

  return {
    signalement,
    isLoading,
    error,
    fetchSignalement: handleFetchSignalement,
    updateSignalement: handleUpdateSignalement,
    addVerification: handleAddVerification,
  };
};
