import React from 'react';
import styles from './SearchResults.module.css';

export interface SearchResultsEmptyProps {
  message?: string;
  icon?: React.ReactNode;
}

/**
 * SearchResultsEmpty component - empty state display
 */
export const SearchResultsEmpty: React.FC<SearchResultsEmptyProps> = ({
  message = 'No results found',
  icon = '🔍',
}) => {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>{icon}</div>
      <p className={styles.emptyMessage}>{message}</p>
      <p className={styles.emptyHint}>Try different keywords or filters</p>
    </div>
  );
};
