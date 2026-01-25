/**
 * =====================================================
 * RETROUVONSLES - usePagination Hook
 * Manages pagination state with page and limit
 * =====================================================
 */

import { useState, useCallback } from 'react';

export interface UsePaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsePaginationResult extends UsePaginationState {
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startIndex: number;
  endIndex: number;
}

export const usePagination = (
  initialPage = 1,
  initialLimit = 10,
  initialTotal = 0
): UsePaginationResult => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);
  const [total, setTotalState] = useState(initialTotal);

  const totalPages = Math.ceil(total / limit) || 1;

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(page - 1);
  }, [page, goToPage]);

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPage(1); // Reset to first page when limit changes
  }, []);

  const setTotal = useCallback((newTotal: number) => {
    setTotalState(newTotal);
  }, []);

  const hasNextPage = page < totalPages;
  const hasPreviousPage = page > 1;
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  return {
    page,
    limit,
    total,
    totalPages,
    goToPage,
    nextPage,
    previousPage,
    setLimit,
    setTotal,
    hasNextPage,
    hasPreviousPage,
    startIndex,
    endIndex,
  };
};
