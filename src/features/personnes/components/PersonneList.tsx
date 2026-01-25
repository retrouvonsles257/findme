/**
 * =====================================================
 * RETROUVONSLES - PersonneList Component
 * List of personnes with search and filter
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { usePersonnes } from '../hooks/usePersonnes';
import styles from './PersonneList.module.css';

export interface PersonneListProps {
  onSelectPersonne?: (id: string) => void;
}

/**
 * PersonneList component
 */
export const PersonneList: React.FC<PersonneListProps> = ({ onSelectPersonne }) => {
  const { personnes, isLoading, error, fetchPersonnes, searchPersonnes } = usePersonnes();
  const [searchText, setSearchText] = useState('');
  const [filterGender, setFilterGender] = useState('');

  useEffect(() => {
    fetchPersonnes();
  }, [fetchPersonnes]);

  const handleSearch = () => {
    if (searchText.trim()) {
      searchPersonnes({
        search: searchText,
        sexe: filterGender as any || undefined,
      });
    } else {
      fetchPersonnes();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isLoading) return <div className={styles.loading}>Loading personnes...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.searchSection}>
        <div className={styles.searchGroup}>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyPress={handleKeyPress}
            className={styles.searchInput}
          />
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Genders</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="U">Unknown</option>
          </select>
          <button onClick={handleSearch} className={styles.searchButton}>
            Search
          </button>
        </div>
      </div>

      <div className={styles.listContainer}>
        {personnes.length === 0 ? (
          <div className={styles.empty}>No personnes found</div>
        ) : (
          <div className={styles.list}>
            {personnes.map((personne) => (
              <div
                key={personne.id}
                className={styles.listItem}
                onClick={() => onSelectPersonne?.(personne.id)}
              >
                <div className={styles.nameSection}>
                  <h3>{personne.nom_complet}</h3>
                  <p className={styles.alias}>{personne.alias && `(${personne.alias})`}</p>
                </div>
                <div className={styles.infoSection}>
                  <span className={styles.gender}>{personne.sexe}</span>
                  {personne.age_estime_min && (
                    <span className={styles.age}>
                      Age: {personne.age_estime_min}
                      {personne.age_estime_max && `-${personne.age_estime_max}`}
                    </span>
                  )}
                  <span className={styles.status}>{personne.statut_identite}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
