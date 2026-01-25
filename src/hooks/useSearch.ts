/**
 * =====================================================
 * RETROUVONSLES - useSearch Hook
 * Manages search state with debounce
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useDebounce } from './useDebounce';

export interface UseSearchResult {
  query: string;
  debouncedQuery: string;
  results: any[];
  isSearching: boolean;
  search: (query: string) => void;
  clearSearch: () => void;
  setResults: (results: any[]) => void;
}

export const useSearch = (
  onSearch?: (query: string) => Promise<any[]>,
  debounceDelay = 500
): UseSearchResult => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedQuery = useDebounce(query, debounceDelay);

  const search = useCallback(
    async (searchQuery: string) => {
      setQuery(searchQuery);

      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      if (onSearch) {
        setIsSearching(true);
        try {
          const searchResults = await onSearch(searchQuery);
          setResults(searchResults);
        } catch (error) {
          console.error('Search error:', error);
          setResults([]);
        } finally {
          setIsSearching(false);
        }
      }
    },
    [onSearch]
  );

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  return {
    query,
    debouncedQuery,
    results,
    isSearching,
    search,
    clearSearch,
    setResults,
  };
};
