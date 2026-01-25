/**
 * =====================================================
 * RETROUVONSLES - AlerteList Component
 * Liste des alertes avec filtres
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import styles from './AlerteList.module.css';
import { useAlertes } from '../hooks/useAlertes';
import { AlertePreview } from './AlertePreview';
import type { StatutAlerte, TypeAlerte } from '../../../@types/enums.types';
import { StatutAlerte as StatutAlerteEnum, TypeAlerte as TypeAlerteEnum } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteListProps {
  dossierId?: string;
  showFilters?: boolean;
  pageSize?: number;
  onAlerteSelect?: (alerteId: string) => void;
}

// ============================================
// COMPONENT
// ============================================

export const AlerteList: React.FC<AlerteListProps> = ({
  dossierId,
  showFilters = true,
  pageSize = 10,
  onAlerteSelect,
}) => {
  const { fetchAlertes, alertes, loading, error, total } = useAlertes();

  // State
  const [statusFilter, setStatusFilter] = useState<StatutAlerte[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeAlerte[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // ========== EFFECTS ==========

  useEffect(() => {
    const filters = {
      ...(dossierId && { id_dossier: dossierId }),
      ...(statusFilter.length > 0 && { statut: statusFilter }),
      ...(typeFilter.length > 0 && { type_alerte: typeFilter }),
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };

    fetchAlertes(filters);
  }, [statusFilter, typeFilter, currentPage, dossierId, pageSize, fetchAlertes]);

  // ========== HANDLERS ==========

  const handleStatusFilterChange = (status: StatutAlerte) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
    setCurrentPage(1);
  };

  const handleTypeFilterChange = (type: TypeAlerte) => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredAlertes = alertes.filter(
    (alerte) =>
      !searchTerm ||
      alerte.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alerte.message.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(total / pageSize);

  // ========== RENDER ==========

  const statusOptions: Array<{ value: StatutAlerte; label: string; color: string }> = [
    { value: StatutAlerteEnum.BROUILLON, label: 'Brouillon', color: '#9CA3AF' },
    { value: StatutAlerteEnum.PROGRAMMEE, label: 'Programmée', color: '#F59E0B' },
    { value: StatutAlerteEnum.EN_COURS, label: 'En cours', color: '#DC2626' },
    { value: StatutAlerteEnum.TERMINEE, label: 'Terminée', color: '#10B981' },
    { value: StatutAlerteEnum.ANNULEE, label: 'Annulée', color: '#6B7280' },
  ];

  const typeOptions: Array<{ value: TypeAlerte; label: string }> = [
    { value: TypeAlerteEnum.AMBER_ALERT, label: 'AMBER Alert' },
    { value: TypeAlerteEnum.DISPARITION_ENFANT, label: 'Enfant' },
    { value: TypeAlerteEnum.DISPARITION_ADULTE_VULNERABLE, label: 'Adulte vulnérable' },
    { value: TypeAlerteEnum.DISPARITION_STANDARD, label: 'Standard' },
    { value: TypeAlerteEnum.MISE_A_JOUR, label: 'Mise à jour' },
    { value: TypeAlerteEnum.PERSONNE_RETROUVEE, label: 'Retrouvée' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>Alertes</h2>
        <span className={styles.count}>{total} alerte(s)</span>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={styles.filters}>
          {/* Search */}
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Status Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Statut:</label>
            <div className={styles.filterOptions}>
              {statusOptions.map((option) => (
                <label key={option.value} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={statusFilter.includes(option.value)}
                    onChange={() => handleStatusFilterChange(option.value)}
                  />
                  <span
                    className={styles.filterTag}
                    style={{ backgroundColor: option.color }}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type:</label>
            <div className={styles.filterOptions}>
              {typeOptions.map((option) => (
                <label key={option.value} className={styles.filterCheckbox}>
                  <input
                    type="checkbox"
                    checked={typeFilter.includes(option.value)}
                    onChange={() => handleTypeFilterChange(option.value)}
                  />
                  <span className={styles.filterTag}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(statusFilter.length > 0 || typeFilter.length > 0 || searchTerm) && (
            <button onClick={handleClearFilters} className={styles.clearButton}>
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading}>Chargement des alertes...</div>
        ) : error ? (
          <div className={styles.error}>
            {error}
            <button onClick={() => fetchAlertes()} className={styles.retryButton}>
              Réessayer
            </button>
          </div>
        ) : filteredAlertes.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyMessage}>Aucune alerte trouvée</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filteredAlertes.map((alerte) => (
              <AlertePreview
                key={alerte.id}
                alerte={alerte}
                onClick={() => onAlerteSelect?.(alerte.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            ← Précédent
          </button>

          <span className={styles.paginationInfo}>
            Page {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  );
};

AlerteList.displayName = 'AlerteList';
