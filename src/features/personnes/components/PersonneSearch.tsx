/**
 * =====================================================
 * RETROUVONSLES - PersonneSearch Component
 * Advanced search by physical description
 * =====================================================
 */

import React, { useState } from 'react';
import { usePersonnes } from '../hooks/usePersonnes';
import type { PersonneFilter } from '../types';
import styles from './PersonneSearch.module.css';

export interface PersonneSearchProps {
  onResultsFound?: (count: number) => void;
}

/**
 * PersonneSearch component - Advanced search
 */
export const PersonneSearch: React.FC<PersonneSearchProps> = ({ onResultsFound }) => {
  const { personnes, isLoading, error, searchPersonnes } = usePersonnes();
  const [formData, setFormData] = useState<PersonneFilter>({
    search: '',
    sexe: undefined,
    ageMin: undefined,
    ageMax: undefined,
    nationalite: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? undefined : isNaN(Number(value)) ? value : Number(value),
    }));
  };

  const handleSearch = async () => {
    await searchPersonnes(formData);
    onResultsFound?.(personnes.length);
  };

  const handleReset = () => {
    setFormData({
      search: '',
      sexe: undefined,
      ageMin: undefined,
      ageMax: undefined,
      nationalite: '',
    });
  };

  return (
    <div className={styles.container}>
      <h2>Advanced Search</h2>

      <div className={styles.formContainer}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Name</label>
            <input
              type="text"
              name="search"
              value={formData.search || ''}
              onChange={handleInputChange}
              placeholder="Search by name..."
            />
          </div>

          <div className={styles.formGroup}>
            <label>Gender</label>
            <select name="sexe" value={formData.sexe || ''} onChange={handleInputChange}>
              <option value="">All</option>
              <option value="masculin">Male</option>
              <option value="feminin">Female</option>
              <option value="inconnu">Unknown</option>
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Age Min</label>
            <input
              type="number"
              name="ageMin"
              value={formData.ageMin || ''}
              onChange={handleInputChange}
              min="0"
              max="120"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Age Max</label>
            <input
              type="number"
              name="ageMax"
              value={formData.ageMax || ''}
              onChange={handleInputChange}
              min="0"
              max="120"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Nationality</label>
            <input
              type="text"
              name="nationalite"
              value={formData.nationalite || ''}
              onChange={handleInputChange}
              placeholder="e.g., French, Belgian..."
            />
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button className={styles.searchButton} onClick={handleSearch} disabled={isLoading}>
            {isLoading ? 'Searching...' : 'Search'}
          </button>
          <button className={styles.resetButton} onClick={handleReset}>
            Reset
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.resultsSection}>
        <p className={styles.resultCount}>
          Found {personnes.length} result{personnes.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
