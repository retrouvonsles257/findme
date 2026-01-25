/**
 * =====================================================
 * RETROUVONSLES - useSignalementCreate Hook
 * Hook for signalement creation
 * =====================================================
 */

import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import { createNewSignalement } from '../store/signalementSlice';
import { selectIsLoading, selectError } from '../store/signalementSelectors';
import type { SignalementCreatePayload, Signalement } from '../types';

export interface UseSignalementCreateResult {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  createSignalement: (payload: SignalementCreatePayload, userId: string) => Promise<Signalement | undefined>;
  reset: () => void;
}

export const useSignalementCreate = (): UseSignalementCreateResult => {
  const dispatch = useDispatch<AppDispatch>();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const [success, setSuccess] = useState(false);

  const handleCreateSignalement = useCallback(
    async (payload: SignalementCreatePayload, userId: string): Promise<Signalement | undefined> => {
      setSuccess(false);
      try {
        const result = await (dispatch(createNewSignalement({ payload, userId })) as any).unwrap();
        setSuccess(true);
        return result;
      } catch (err) {
        console.error('Error creating signalement:', err);
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
    createSignalement: handleCreateSignalement,
    reset: handleReset,
  };
};
