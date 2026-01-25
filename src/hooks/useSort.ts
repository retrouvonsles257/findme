/**
 * =====================================================
 * RETROUVONSLES - useSort Hook
 * Manages sort state with direction and field
 * =====================================================
 */

import { useState, useCallback } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface UseSortState {
  field: string | null;
  direction: SortDirection;
}

export interface UseSortResult extends UseSortState {
  sort: (field: string) => void;
  clearSort: () => void;
  isSorted: (field: string) => boolean;
  getSortDirection: (field: string) => SortDirection;
  toggleSort: (field: string) => void;
}

export const useSort = (
  initialField: string | null = null,
  initialDirection: SortDirection = null
): UseSortResult => {
  const [state, setState] = useState<UseSortState>({
    field: initialField,
    direction: initialDirection,
  });

  const sort = useCallback((field: string) => {
    setState((prev) => {
      if (prev.field === field) {
        // Toggle direction if same field
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        } else if (prev.direction === 'desc') {
          return { field: null, direction: null };
        }
      }
      // Set new field with asc direction
      return { field, direction: 'asc' };
    });
  }, []);

  const clearSort = useCallback(() => {
    setState({ field: null, direction: null });
  }, []);

  const isSorted = useCallback(
    (field: string) => state.field === field && state.direction !== null,
    [state.field, state.direction]
  );

  const getSortDirection = useCallback(
    (field: string) => (state.field === field ? state.direction : null),
    [state.field, state.direction]
  );

  const toggleSort = useCallback(
    (field: string) => {
      sort(field);
    },
    [sort]
  );

  return {
    field: state.field,
    direction: state.direction,
    sort,
    clearSort,
    isSorted,
    getSortDirection,
    toggleSort,
  };
};
