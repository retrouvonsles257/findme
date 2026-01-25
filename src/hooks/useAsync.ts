/**
 * =====================================================
 * RETROUVONSLES - useAsync Hook
 * Manages async operations with loading, error, and data states
 * =====================================================
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export interface UseAsyncResult<T> extends UseAsyncState<T> {
  execute: () => Promise<T | void>;
  reset: () => void;
}

export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncResult<T> => {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const mounted = useRef(true);

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      if (mounted.current) {
        setState({ data: response, loading: false, error: null });
      }
      return response;
    } catch (error) {
      if (mounted.current) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
      throw error;
    }
  }, [asyncFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      mounted.current = false;
    };
  }, [execute, immediate]);

  return { ...state, execute, reset };
};
