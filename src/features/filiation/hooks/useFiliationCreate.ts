/**
 * =====================================================
 * RETROUVONSLES - useFiliationCreate Hook
 * Hook for creating and updating filiation links
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import { createNewFiliationLien, updateFiliationLien } from '../store/filiationSlice';
import type { FiliationLienInput, FiliationLienUpdate } from '../types';

export const useFiliationCreate = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLien = useCallback(
    async (input: FiliationLienInput) => {
      setIsCreating(true);
      setError(null);
      try {
        const result = await (dispatch(createNewFiliationLien(input)) as any).unwrap();
        return result;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [dispatch],
  );

  const updateLien = useCallback(
    async (id: string, input: FiliationLienUpdate) => {
      setIsUpdating(true);
      setError(null);
      try {
        const result = await (dispatch(updateFiliationLien({ id, input })) as any).unwrap();
        return result;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsUpdating(false);
      }
    },
    [dispatch],
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createLien,
    updateLien,
    isCreating,
    isUpdating,
    error,
    clearError,
  };
};
