import React, { useState, useCallback } from 'react';
import styles from './MapSearch.module.css';
import { MapSearchResults } from './MapSearchResults';

export interface MapSearchLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'missing' | 'sighting' | 'organization' | 'alert';
  region?: string;
  distance?: number;
}

export interface MapSearchProps {
  onSearch?: (query: string) => void;
  onLocationSelect?: (location: MapSearchLocation) => void;
  results?: MapSearchLocation[];
  isLoading?: boolean;
  placeholder?: string;
}

/**
 * MapSearch component for searching locations on map
 */
export const MapSearch: React.FC<MapSearchProps> = ({
  onSearch,
  onLocationSelect,
  results = [],
  isLoading = false,
  placeholder = 'Search location...',
}) => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setShowResults(true);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleLocationSelect = (location: MapSearchLocation) => {
    setQuery(location.name);
    setShowResults(false);
    onLocationSelect?.(location);
  };

  return (
    <div className={styles.mapSearch}>
      <div className={styles.searchContainer}>
        <svg
          className={styles.searchIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={styles.searchInput}
        />

        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
          >
            ×
          </button>
        )}
      </div>

      {showResults && (
        <MapSearchResults
          results={results}
          isLoading={isLoading}
          onLocationSelect={handleLocationSelect}
        />
      )}
    </div>
  );
};
