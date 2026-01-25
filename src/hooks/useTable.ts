/**
 * =====================================================
 * RETROUVONSLES - useTable Hook
 * Combines pagination, sorting, and filtering for tables
 * =====================================================
 */

import { usePagination } from './usePagination';
import { useSort, SortDirection } from './useSort';
import { useFilter } from './useFilter';

export interface UseTableState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortField: string | null;
  sortDirection: SortDirection;
  filters: { [key: string]: any };
}

export interface UseTableResult extends UseTableState {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
  sort: (field: string) => void;
  clearSort: () => void;
  isSorted: (field: string) => boolean;
  getSortDirection: (field: string) => SortDirection;
  setFilter: (key: string, value: any) => void;
  setFilters: (filters: { [key: string]: any }) => void;
  clearFilters: () => void;
  removeFilter: (key: string) => void;
  hasFilters: boolean;
}

export const useTable = (
  initialPage = 1,
  initialLimit = 10,
  initialTotal = 0,
  initialSortField: string | null = null,
  initialSortDirection: SortDirection = null,
  initialFilters: { [key: string]: any } = {}
): UseTableResult => {
  const pagination = usePagination(initialPage, initialLimit, initialTotal);
  const sorting = useSort(initialSortField, initialSortDirection);
  const filtering = useFilter(initialFilters);

  return {
    // Pagination
    page: pagination.page,
    limit: pagination.limit,
    total: pagination.total,
    totalPages: pagination.totalPages,
    goToPage: pagination.goToPage,
    nextPage: pagination.nextPage,
    previousPage: pagination.previousPage,
    setLimit: pagination.setLimit,
    setTotal: pagination.setTotal,
    hasNextPage: pagination.hasNextPage,
    hasPreviousPage: pagination.hasPreviousPage,
    startIndex: pagination.startIndex,
    endIndex: pagination.endIndex,

    // Sorting
    sortField: sorting.field,
    sortDirection: sorting.direction,
    sort: sorting.sort,
    clearSort: sorting.clearSort,
    isSorted: sorting.isSorted,
    getSortDirection: sorting.getSortDirection,

    // Filtering
    filters: filtering.filters,
    setFilter: filtering.setFilter,
    setFilters: filtering.setFilters,
    clearFilters: filtering.clearFilters,
    removeFilter: filtering.removeFilter,
    hasFilters: filtering.hasFilters,
  };
};
