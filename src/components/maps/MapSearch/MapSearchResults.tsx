import React from 'react';
import styles from './MapSearch.module.css';
import { MapSearchLocation } from './MapSearch';

export interface MapSearchResultsProps {
  results: MapSearchLocation[];
  isLoading?: boolean;
  onLocationSelect?: (location: MapSearchLocation) => void;
}

/**
 * MapSearchResults component - displays search results list
 */
export const MapSearchResults: React.FC<MapSearchResultsProps> = ({
  results,
  isLoading = false,
  onLocationSelect,
}) => {
  const typeIcons = {
    missing: '👤',
    sighting: '👁️',
    organization: '🏢',
    alert: '⚠️',
  };

  return (
    <div className={styles.resultsContainer}>
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Searching...</span>
        </div>
      )}

      {!isLoading && results.length === 0 && (
        <div className={styles.empty}>
          <p>No results found</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <ul className={styles.resultsList}>
          {results.map((result) => (
            <li key={result.id}>
              <button
                className={styles.resultItem}
                onClick={() => onLocationSelect?.(result)}
              >
                <span className={styles.icon}>
                  {typeIcons[result.type]}
                </span>
                <div className={styles.resultContent}>
                  <div className={styles.resultName}>{result.name}</div>
                  {result.region && (
                    <div className={styles.resultRegion}>
                      {result.region}
                      {result.distance && ` • ${result.distance.toFixed(1)} km`}
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
