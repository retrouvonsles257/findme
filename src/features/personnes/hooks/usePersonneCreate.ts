/**
 * =====================================================
 * RETROUVONSLES - usePersonneCreate Hook
 * Hook for creating new personnes
 * =====================================================
 */

import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import { createNewPersonne } from '../store/personneSlice';
import type { PersonneCreatePayload, Personne } from '../types';

export interface UsePersonneCreateState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  newPersonneId: string | null;
}

export interface UsePersonneCreateResult extends UsePersonneCreateState {
  createPersonne: (payload: PersonneCreatePayload, userId: string) => Promise<void>;
  reset: () => void;
}

/**
 * usePersonneCreate hook
 */
export const usePersonneCreate = (): UsePersonneCreateResult => {
  const dispatch = useDispatch<AppDispatch>();
  const [state, setState] = useState<UsePersonneCreateState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    newPersonneId: null,
  });

  const handleCreatePersonne = useCallback(
    async (payload: PersonneCreatePayload, userId: string) => {
      setState({ isLoading: true, isSuccess: false, error: null, newPersonneId: null });

      try {
        const personnePayload = await (dispatch(createNewPersonne({ payload, userId })) as any).unwrap();
        setState({
          isLoading: false,
          isSuccess: true,
          error: null,
          newPersonneId: personnePayload.id,
        });
      } catch (error) {
        setState({
          isLoading: false,
          isSuccess: false,
          error: error instanceof Error ? error.message : 'Failed to create personne',
          newPersonneId: null,
        });
      }
    },
    [dispatch]
  );

  const handleReset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      error: null,
      newPersonneId: null,
    });
  }, []);

  return {
    ...state,
    createPersonne: handleCreatePersonne,
    reset: handleReset,
  };
};
