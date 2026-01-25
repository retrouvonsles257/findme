import React from 'react';
import styles from './SearchResults.module.css';
import { SearchResult } from './SearchResults';

export interface SearchResultsItemProps {
  result: SearchResult;
  onClick?: () => void;
}

/**
 * SearchResultsItem component - individual result card
 */
export const SearchResultsItem: React.FC<SearchResultsItemProps> = ({
  result,
  onClick,
}) => {
  return (
    <div className={styles.resultItem} onClick={onClick}>
      {result.image && (
        <div className={styles.resultImage}>
          <img src={result.image} alt={result.title} />
        </div>
      )}

      <div className={styles.resultContent}>
        <h4 className={styles.resultTitle}>{result.title}</h4>

        {result.description && (
          <p className={styles.resultDescription}>{result.description}</p>
        )}

        {result.metadata && Object.keys(result.metadata).length > 0 && (
          <div className={styles.resultMetadata}>
            {Object.entries(result.metadata).slice(0, 2).map(([key, value]) => (
              <span key={key} className={styles.metadataTag}>
                {key}: {String(value)}
              </span>
            ))}
          </div>
        )}
      </div>

      {result.score && (
        <div className={styles.resultScore}>
          <div className={styles.scoreBar}>
            <div
              className={styles.scoreValue}
              style={{ width: `${result.score * 100}%` }}
            />
          </div>
          <span className={styles.scoreLabel}>
            {(result.score * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
};
