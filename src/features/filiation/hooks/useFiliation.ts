/**
 * =====================================================
 * RETROUVONSLES - useFiliation Hook
 * Main hook for filiation operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchFiliationLiens,
  setSelectedLien,
  setFilters,
  clearError,
} from '../store/filiationSlice';
import {
  selectFiliationLiens,
  selectFiliationLoading,
  selectFiliationError,
  selectSelectedLien,
} from '../store/filiationSelectors';
import type { FiliationLienDisplay } from '../types';

export const useFiliation = (idPersonne: string) => {
  const dispatch = useDispatch<AppDispatch>();

  const liens = useSelector(selectFiliationLiens);
  const loading = useSelector(selectFiliationLoading);
  const error = useSelector(selectFiliationError);
  const selectedLien = useSelector(selectSelectedLien);

  const fetchLiens = useCallback(() => {
    dispatch(fetchFiliationLiens(idPersonne));
  }, [dispatch, idPersonne]);

  const selectLien = useCallback(
    (lien: FiliationLienDisplay | null) => {
      dispatch(setSelectedLien(lien));
    },
    [dispatch],
  );

  const applyFilters = useCallback(
    (filters: any) => {
      dispatch(setFilters(filters));
    },
    [dispatch],
  );

  const dismissError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    liens,
    loading,
    error,
    selectedLien,
    fetchLiens,
    selectLien,
    applyFilters,
    dismissError,
  };
};
