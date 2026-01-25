/**
 * =====================================================
 * RETROUVONSLES - CampagneDetail Component
 * Affiche les détails d'une campagne
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useCampagneDetail } from '../hooks';
import {
  getCampagneTypeLabel,
  getCampagneStatusLabel,
  getCampagneStatusColor,
  formatBudget,
  calculateBudgetUtilization,
} from '../services';
import type { CampagneDetailProps } from '../types';
import styles from './CampagneDetail.module.css';

/**
 * Composant de détail d'une campagne
 */
const CampagneDetail: React.FC<CampagneDetailProps> = ({
  campagneId,
  onBack,
  onEdit,
  className = '',
}) => {
  const { campagne, isLoading, error, fetchCampagne } = useCampagneDetail();

  useEffect(() => {
    fetchCampagne(campagneId);
  }, [campagneId, fetchCampagne]);

  if (isLoading) {
    return <div className={`${styles.loading} ${className}`}>Chargement...</div>;
  }

  if (error || !campagne) {
    return (
      <div className={`${styles.error} ${className}`}>
        {error || 'Campagne non trouvée'}
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header */}
      <div className={styles.header}>
        {onBack && (
          <button className={styles.backBtn} onClick={onBack}>
            ← Retour
          </button>
        )}
        <h1>{campagne.titre}</h1>
        {onEdit && (
          <button className={styles.editBtn} onClick={() => onEdit(campagne)}>
            ✎ Éditer
          </button>
        )}
      </div>

      {/* Status Bar */}
      <div className={styles.statusBar}>
        <span
          className={styles.status}
          style={{ backgroundColor: getCampagneStatusColor(campagne.statut_campagne) }}
        >
          {getCampagneStatusLabel(campagne.statut_campagne)}
        </span>
        <span className={styles.type}>
          {getCampagneTypeLabel(campagne.type_campagne)}
        </span>
        <span className={styles.dates}>
          {new Date(campagne.date_debut).toLocaleDateString('fr-FR')}
          {campagne.date_fin && ` - ${new Date(campagne.date_fin).toLocaleDateString('fr-FR')}`}
        </span>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Description */}
        {campagne.description && (
          <section className={styles.section}>
            <h2>Description</h2>
            <p>{campagne.description}</p>
          </section>
        )}

        {/* Objectif */}
        {campagne.objectif && (
          <section className={styles.section}>
            <h2>Objectif</h2>
            <p>{campagne.objectif}</p>
          </section>
        )}

        {/* Public Cible */}
        {campagne.public_cible && (
          <section className={styles.section}>
            <h2>Public Cible</h2>
            <p>{campagne.public_cible}</p>
          </section>
        )}

        {/* Budget Info */}
        <section className={styles.section}>
          <h2>Budget</h2>
          <div className={styles.budgetInfo}>
            <div className={styles.budgetItem}>
              <span className={styles.label}>Budget Alloué:</span>
              <span className={styles.value}>
                {formatBudget(campagne.budget_alloue ?? 0)}
              </span>
            </div>
            <div className={styles.budgetItem}>
              <span className={styles.label}>Budget Dépensé:</span>
              <span className={styles.value}>
                {formatBudget(campagne.budget_depense ?? 0)}
              </span>
            </div>
            <div className={styles.budgetItem}>
              <span className={styles.label}>Utilisation:</span>
              <span className={styles.value}>
                {calculateBudgetUtilization(
                  campagne.budget_alloue ?? 0,
                  campagne.budget_depense ?? 0,
                ).toFixed(1)}%
              </span>
            </div>
          </div>
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
        </section>

        {/* Impact Statistics */}
        <section className={styles.section}>
          <h2>Impact</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Personnes Touchées</span>
              <span className={styles.statValue}>
                {campagne.nombre_personnes_touchees || 0}
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Interactions</span>
              <span className={styles.statValue}>
                {campagne.nombre_interactions || 0}
              </span>
            </div>
            {campagne.nombre_personnes_touchees > 0 && (
              <div className={styles.statCard}>
                <span className={styles.statLabel}>Taux Engagement</span>
                <span className={styles.statValue}>
                  {(
                    ((campagne.nombre_interactions || 0) /
                      campagne.nombre_personnes_touchees) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Canaux de Diffusion */}
        {campagne.canaux_diffusion && typeof campagne.canaux_diffusion === 'object' && (
          <section className={styles.section}>
            <h2>Canaux de Diffusion</h2>
            <div className={styles.tags}>
              {Object.entries(campagne.canaux_diffusion as Record<string, any>).map(
                ([key, value]) => (
                  <span key={key} className={styles.tag}>
                    {key}: {value}
                  </span>
                ),
              )}
            </div>
          </section>
        )}

        {/* Creator Info */}
        {campagne.createur && (
          <section className={styles.section}>
            <h2>Créateur</h2>
            <div className={styles.creatorInfo}>
              <p>
                <strong>{campagne.createur.prenom} {campagne.createur.nom}</strong>
              </p>
              <p>{campagne.createur.email}</p>
            </div>
          </section>
        )}

        {/* Organisation */}
        {campagne.organisation && (
          <section className={styles.section}>
            <h2>Organisation</h2>
            <p>{campagne.organisation.nom}</p>
          </section>
        )}
      </div>
    </div>
  );
};

export default CampagneDetail;
