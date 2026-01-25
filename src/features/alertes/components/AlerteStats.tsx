/**
 * =====================================================
 * RETROUVONSLES - AlerteStats Component
 * Affichage des statistiques des alertes
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import styles from './AlerteList.module.css';
import * as alerteAPI from '../services/alerteAPI';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteStatsProps {
  className?: string;
  refreshInterval?: number;
}

// ============================================
// COMPONENT
// ============================================

export const AlerteStats: React.FC<AlerteStatsProps> = ({
  className = '',
  refreshInterval = 60000,
}) => {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof alerteAPI.getAlerteStats>> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========== EFFECTS ==========

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await alerteAPI.getAlerteStats();
        setStats(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Auto-refresh
    const interval = setInterval(loadStats, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // ========== RENDER ==========

  if (loading) {
    return <div className={`${styles.statsContainer} ${className}`}>Chargement...</div>;
  }

  if (error) {
    return <div className={`${styles.statsContainer} ${className}`}>Erreur: {error}</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`${styles.statsContainer} ${className}`}>
      {/* Main Stats */}
      <div className={styles.mainStats}>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.total}</span>
          <span className={styles.statLabel}>Total d'alertes</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>{stats.active}</span>
          <span className={styles.statLabel}>Alertes actives</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNumber}>
            {stats.total > 0
              ? Math.round((stats.active / stats.total) * 100)
              : 0}
            %
          </span>
          <span className={styles.statLabel}>Taux d'activité</span>
        </div>
      </div>

      {/* By Status */}
      <div className={styles.byStatus}>
        <h4 className={styles.categoryTitle}>Par statut</h4>
        <div className={styles.categoryList}>
          {Object.entries(stats.par_statut || {}).map(([status, count]) => (
            <div key={status} className={styles.categoryItem}>
              <span className={styles.categoryName}>{status}</span>
              <span className={styles.categoryCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* By Type */}
      <div className={styles.byType}>
        <h4 className={styles.categoryTitle}>Par type</h4>
        <div className={styles.categoryList}>
          {Object.entries(stats.par_type || {}).map(([type, count]) => (
            <div key={type} className={styles.categoryItem}>
              <span className={styles.categoryName}>{type}</span>
              <span className={styles.categoryCount}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

AlerteStats.displayName = 'AlerteStats';
