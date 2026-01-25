import React, { useState } from 'react';
import styles from './AdvancedSearch.module.css';
import { AdvancedSearchFilters } from './AdvancedSearchFilters';

export interface AdvancedSearchFiltersState {
  type?: 'missing' | 'sighting' | 'organization' | 'alert';
  region?: string;
  status?: 'active' | 'resolved' | 'pending';
  dateFrom?: string;
  dateTo?: string;
  ageFrom?: number;
  ageTo?: number;
  gender?: 'male' | 'female' | 'other';
  tags?: string[];
}

export interface AdvancedSearchProps {
  onSearch?: (filters: AdvancedSearchFiltersState) => void;
  onResultsChange?: (count: number) => void;
  isLoading?: boolean;
}

/**
 * AdvancedSearch component for complex search with multiple filters
 */
export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onResultsChange,
  isLoading = false,
}) => {
  const [filters, setFilters] = useState<AdvancedSearchFiltersState>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (newFilters: AdvancedSearchFiltersState) => {
    setFilters(newFilters);
    onSearch?.(newFilters);
  };

  const handleReset = () => {
    setFilters({});
    onSearch?.({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={styles.advancedSearch}>
      <div className={styles.header}>
        <h3 className={styles.title}>Advanced Search</h3>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? '−' : '+'}</span>
          {activeFilterCount > 0 && (
            <span className={styles.badge}>{activeFilterCount}</span>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <AdvancedSearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />

          <div className={styles.actions}>
            <button
              className={styles.resetButton}
              onClick={handleReset}
              disabled={activeFilterCount === 0}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
