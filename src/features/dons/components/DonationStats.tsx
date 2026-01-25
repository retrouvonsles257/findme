/**
 * =====================================================
 * RETROUVONSLES - DonationStats Component
 * Affichage des statistiques des dons
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useDonationHistory } from '../hooks/useDonationHistory';

// ============================================
// COMPONENT PROPS
// ============================================

export interface DonationStatsProps {
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Composant statistiques des dons
 */
export const DonationStats: React.FC<DonationStatsProps> = ({ className = '' }) => {
  const { statistics, isLoading, fetchStatistics } = useDonationHistory();

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  if (isLoading) {
    return <div className={className}>Chargement des statistiques...</div>;
  }

  if (!statistics) {
    return <div className={className}>Aucune statistique disponible</div>;
  }

  const successRate = statistics.total_dons > 0
    ? ((Object.values(statistics.par_statut)[0] || 0) / statistics.total_dons * 100).toFixed(0)
    : 0;

  return (
    <div className={`donation-stats ${className}`}>
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total des dons</h4>
          <p className="stat-value">{statistics.total_dons}</p>
        </div>

        <div className="stat-card">
          <h4>Montant total</h4>
          <p className="stat-value">
            {(statistics.total_dons === 0 ? 0 : statistics.total_dons).toLocaleString('fr-CM')} XAF
          </p>
        </div>

        <div className="stat-card">
          <h4>Montant moyen</h4>
          <p className="stat-value">
            {(statistics.total_dons === 0 ? 0 : Math.round(statistics.total_dons / Math.max(1, Object.keys(statistics.par_statut).length))).toLocaleString('fr-CM')} XAF
          </p>
        </div>

        <div className="stat-card">
          <h4>Taux de succès</h4>
          <p className="stat-value">{successRate}%</p>
        </div>
      </div>

      <div className="stats-details">
        <div className="details-column">
          <h5>Par type</h5>
          <ul>
            {Object.entries(statistics.par_type).map(([type, count]) => (
              <li key={type}>
                <span>{type}</span>
                <span className="count">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="details-column">
          <h5>Par méthode</h5>
          <ul>
            {Object.entries(statistics.par_methode).map(([methode, count]) => (
              <li key={methode}>
                <span>{methode}</span>
                <span className="count">{count}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="details-column">
          <h5>Par statut</h5>
          <ul>
            {Object.entries(statistics.par_statut).map(([statut, count]) => (
              <li key={statut}>
                <span>{statut}</span>
                <span className="count">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DonationStats;
