/**
 * =====================================================
 * RETROUVONSLES - CampagneList Component
 * Affiche la liste des campagnes avec filtres et pagination
 * =====================================================
 */

import React, { useState } from 'react';
import { useCampagnes } from '../hooks';
import {
  getCampagneTypeLabel,
  getCampagneStatusLabel,
  getCampagneStatusColor,
  formatBudget,
  calculateBudgetUtilization,
} from '../services';
import type { CampagneSensibilisation, UUID } from '@types';
import type { CampagneFilterCriteria, CampagneListProps } from '../types';
import styles from './CampagneList.module.css';

/**
 * Composant de liste des campagnes
 */
const CampagneList: React.FC<CampagneListProps> = ({
  className = '',
  onSelectCampagne,
  initialFilters,
}) => {
  const {
    campagnes,
    isLoading,
    error,
    totalItems,
    currentPage,
    pageSize,
    statistics,
    fetchCampagnes,
    deleteCampagne,
  } = useCampagnes();

  const [selectedIds, setSelectedIds] = useState<UUID[]>([]);
  const [filters, setFilters] = useState<CampagneFilterCriteria>(initialFilters || {});

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query }));
    fetchCampagnes(1, { ...filters, search: query });
  };

  const handlePageChange = (page: number) => {
    fetchCampagnes(page, filters);
  };

  const handleSelectCampagne = (campagne: CampagneSensibilisation) => {
    if (onSelectCampagne) {
      onSelectCampagne(campagne);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === campagnes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campagnes.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: UUID) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleDeleteSelected = async () => {
    if (window.confirm(`Suppression de ${selectedIds.length} campagne(s) ?`)) {
      for (const id of selectedIds) {
        await deleteCampagne(id);
      }
      setSelectedIds([]);
    }
  };

  if (error && !campagnes.length) {
    return <div className={`${styles.error} ${className}`}>{error}</div>;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Statistics */}
      {statistics && (
        <div className={styles.statsBar}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Total:</span>
            <span className={styles.statValue}>{statistics.totalCampagnes}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Actives:</span>
            <span className={styles.statValue}>{statistics.campagnesActives}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Budget:</span>
            <span className={styles.statValue}>{formatBudget(statistics.budgetTotal)}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Personnes:</span>
            <span className={styles.statValue}>{statistics.personnesTouchees}</span>
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className={styles.header}>
        <input
          type="text"
          className={styles.search}
          placeholder="Rechercher une campagne..."
          onChange={(e) => handleSearch(e.target.value)}
        />
        {selectedIds.length > 0 && (
          <button className={styles.deleteBtn} onClick={handleDeleteSelected}>
            Supprimer ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Campagnes List */}
      {isLoading && campagnes.length === 0 ? (
        <div className={styles.loading}>Chargement...</div>
      ) : campagnes.length === 0 ? (
        <div className={styles.empty}>Aucune campagne trouvée</div>
      ) : (
        <>
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <input
                type="checkbox"
                checked={selectedIds.length === campagnes.length && campagnes.length > 0}
                onChange={handleSelectAll}
                className={styles.checkbox}
              />
              <div className={styles.titleCol}>Titre</div>
              <div className={styles.typeCol}>Type</div>
              <div className={styles.statusCol}>Statut</div>
              <div className={styles.budgetCol}>Budget</div>
              <div className={styles.reachCol}>Portée</div>
            </div>

            {campagnes.map((campagne) => (
              <div key={campagne.id} className={styles.tableRow}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(campagne.id)}
                  onChange={() => handleToggleSelect(campagne.id)}
                  className={styles.checkbox}
                />
                <div
                  className={styles.titleCol}
                  onClick={() => handleSelectCampagne(campagne)}
                >
                  <strong>{campagne.titre}</strong>
                  <small>{campagne.description}</small>
                </div>
                <div className={styles.typeCol}>{getCampagneTypeLabel(campagne.type_campagne)}</div>
                <div className={styles.statusCol}>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getCampagneStatusColor(campagne.statut_campagne) }}
                  >
                    {getCampagneStatusLabel(campagne.statut_campagne)}
                  </span>
                </div>
                <div className={styles.budgetCol}>
                  <div>{formatBudget(campagne.budget_alloue ?? 0)}</div>
                  <div className={styles.budgetBar}>
                    <div
                      className={styles.budgetUsed}
                      style={{
                        width: `${calculateBudgetUtilization(
                          campagne.budget_alloue ?? 0,
                          campagne.budget_depense ?? 0,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className={styles.reachCol}>
                  <div>{campagne.nombre_personnes_touchees} personnes</div>
                  <small>{campagne.nombre_interactions} interactions</small>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Précédent
              </button>
              <span>
                Page {currentPage} sur {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CampagneList;
