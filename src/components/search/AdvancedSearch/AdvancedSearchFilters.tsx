import React from 'react';
import styles from './AdvancedSearch.module.css';
import { AdvancedSearchFiltersState } from './AdvancedSearch';

export interface AdvancedSearchFiltersProps {
  filters: AdvancedSearchFiltersState;
  onFilterChange?: (filters: AdvancedSearchFiltersState) => void;
  isLoading?: boolean;
}

/**
 * AdvancedSearchFilters component - filter input controls
 */
export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  filters,
  onFilterChange,
  isLoading = false,
}) => {
  const handleChange = (key: keyof AdvancedSearchFiltersState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    if (value === '' || value === null) {
      delete newFilters[key];
    }
    onFilterChange?.(newFilters);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleChange('type', e.target.value || undefined)}
            disabled={isLoading}
            className={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="missing">Missing Persons</option>
            <option value="sighting">Sightings</option>
            <option value="organization">Organizations</option>
            <option value="alert">Alerts</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Region</label>
          <select
            value={filters.region || ''}
            onChange={(e) => handleChange('region', e.target.value || undefined)}
            disabled={isLoading}
            className={styles.filterSelect}
          >
            <option value="">All Regions</option>
            <option value="littoral">Littoral</option>
            <option value="center">Center</option>
            <option value="south">South</option>
            <option value="east">East</option>
            <option value="west">West</option>
            <option value="north">North</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value || undefined)}
            disabled={isLoading}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Gender</label>
          <select
            value={filters.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value || undefined)}
            disabled={isLoading}
            className={styles.filterSelect}
          >
            <option value="">All Genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Age From</label>
          <input
            type="number"
            value={filters.ageFrom || ''}
            onChange={(e) => handleChange('ageFrom', e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={isLoading}
            className={styles.filterInput}
            min="0"
            max="150"
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Age To</label>
          <input
            type="number"
            value={filters.ageTo || ''}
            onChange={(e) => handleChange('ageTo', e.target.value ? parseInt(e.target.value) : undefined)}
            disabled={isLoading}
            className={styles.filterInput}
            min="0"
            max="150"
          />
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date From</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleChange('dateFrom', e.target.value || undefined)}
            disabled={isLoading}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Date To</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleChange('dateTo', e.target.value || undefined)}
            disabled={isLoading}
            className={styles.filterInput}
          />
        </div>
      </div>
    </div>
  );
};
