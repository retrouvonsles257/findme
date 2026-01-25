import React, { useMemo } from 'react';
import styles from './SearchResults.module.css';
import { SearchResultsEmpty } from './SearchResultsEmpty';
import { SearchResultsItem } from './SearchResultsItem';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  category?: string;
  image?: string;
  metadata?: Record<string, any>;
  score?: number;
}

export interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  onResultClick?: (result: SearchResult) => void;
  layout?: 'list' | 'grid';
}

/**
 * SearchResults component for displaying search results
 */
export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No results found',
  onResultClick,
  layout = 'list',
}) => {
  const groupedResults = useMemo(() => {
    if (!results.length) return {};
    
    const groups: Record<string, SearchResult[]> = {};
    results.forEach((result) => {
      const category = result.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(result);
    });
    return groups;
  }, [results]);

  return (
    <div className={styles.searchResults}>
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Searching...</p>
        </div>
      )}

      {!isLoading && (isEmpty || results.length === 0) && (
        <SearchResultsEmpty message={emptyMessage} />
      )}

      {!isLoading && results.length > 0 && (
        <>
          <div className={styles.resultCount}>
            Found {results.length} result{results.length !== 1 ? 's' : ''}
          </div>

          <div className={`${styles.resultsList} ${styles[`layout-${layout}`]}`}>
            {Object.entries(groupedResults).map(([category, items]) => (
              <div key={category} className={styles.resultCategory}>
                {Object.keys(groupedResults).length > 1 && (
                  <h3 className={styles.categoryTitle}>{category}</h3>
                )}
                <div className={styles.categoryItems}>
                  {items.map((result) => (
                    <SearchResultsItem
                      key={result.id}
                      result={result}
                      onClick={() => onResultClick?.(result)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
