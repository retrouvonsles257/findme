/**
 * =====================================================
 * RETROUVONSLES - useSignalementValidation Hook
 * Hook for signalement validation
 * =====================================================
 */

import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import { addSignalementVerificationData } from '../store/signalementSlice';
import { selectIsLoading, selectError } from '../store/signalementSelectors';
import type { SignalementValidationPayload } from '../types';

export interface UseSignalementValidationResult {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  validateSignalement: (signalementId: string, verificateurId: string, payload: SignalementValidationPayload) => Promise<any>;
  reset: () => void;
}

export const useSignalementValidation = (): UseSignalementValidationResult => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const [success, setSuccess] = useState(false);

  const handleValidateSignalement = useCallback(
    async (signalementId: string, verificateurId: string, payload: SignalementValidationPayload): Promise<any | undefined> => {
      setSuccess(false);
      try {
        const result = await (dispatch(addSignalementVerificationData({ signalementId, verificateurId, payload })) as any).unwrap();
        setSuccess(true);
        return result;
      } catch (err) {
        console.error('Error validating signalement:', err);
      }
      return undefined;
    },
    [dispatch]
  );

  const handleReset = useCallback(() => {
    setSuccess(false);
  }, []);

  return {
    isLoading,
    error,
    success,
    validateSignalement: handleValidateSignalement,
    reset: handleReset,
  };
};
