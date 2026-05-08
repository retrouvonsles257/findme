/**
 * =====================================================
 * RETROUVONSLES - useInfiniteScroll Hook
 * Detects when user scrolls near bottom of element
 * =====================================================
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseInfiniteScrollOptions {
  threshold?: number;
  initialLoad?: boolean;
}

export interface UseInfiniteScrollResult {
  ref: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

export const useInfiniteScroll = (
  onLoadMore: () => Promise<void>,
  options: UseInfiniteScrollOptions = {}
): UseInfiniteScrollResult => {
  const { threshold = 100, initialLoad = true } = options;
  const [isLoading, setIsLoading] = useState(initialLoad);
  const ref = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onLoadMore]);

  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    const handleScroll = () => {
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      if (scrollHeight - (scrollTop + clientHeight) < threshold) {
        loadMore();
      }
    };

    element.addEventListener('scroll', handleScroll);

    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [loadMore, threshold]);

  return { ref: ref as React.RefObject<HTMLDivElement>, isLoading, hasMore: true, loadMore };
};
