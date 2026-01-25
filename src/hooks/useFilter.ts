/**
 * =====================================================
 * RETROUVONSLES - useFilter Hook
 * Manages filter state with multiple conditions
 * =====================================================
 */

import { useState, useCallback } from 'react';

export interface UseFilterState {
  [key: string]: any;
}

export interface UseFilterResult {
  filters: UseFilterState;
  setFilter: (key: string, value: any) => void;
  setFilters: (filters: UseFilterState) => void;
  clearFilters: () => void;
  removeFilter: (key: string) => void;
  hasFilters: boolean;
}

export const useFilter = (initialFilters: UseFilterState = {}): UseFilterResult => {
  const [filters, setFiltersState] = useState<UseFilterState>(initialFilters);

  const setFilter = useCallback((key: string, value: any) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const setFilters = useCallback((newFilters: UseFilterState) => {
    setFiltersState(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState({});
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFiltersState((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const hasFilters = Object.keys(filters).length > 0;

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    removeFilter,
    hasFilters,
  };
};
