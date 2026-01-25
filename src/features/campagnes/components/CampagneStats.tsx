/**
 * =====================================================
 * RETROUVONSLES - CampagneStats Component
 * Tableau de bord statistique pour les campagnes
 * =====================================================
 */

import React, { useMemo, useState } from 'react';
import { useCampagnes } from '../hooks';
import {
  calculateCampagneStatistics,
  getCampagneTypeLabel,
  getCampagneStatusLabel,
} from '../services';
import type { CampagneStatsProps } from '../types';
import styles from './CampagneStats.module.css';

interface PeriodOption {
  label: string;
  value: 'month' | 'quarter' | 'year';
}

/**
 * Composant de statistiques des campagnes
 */
const CampagneStats: React.FC<CampagneStatsProps> = ({ className = '' }) => {
  const { campagnes, isLoading } = useCampagnes();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  const periods: PeriodOption[] = [
    { label: 'Ce mois', value: 'month' },
    { label: 'Ce trimestre', value: 'quarter' },
    { label: 'Cette année', value: 'year' },
  ];

  // Calculate filtered campaigns based on period
  const filteredCampagnes = useMemo(() => {
    const now = new Date();
    return campagnes.filter((c) => {
      const createdAt = new Date(c.created_at);
      const monthDiff = now.getMonth() - createdAt.getMonth() +
        (now.getFullYear() - createdAt.getFullYear()) * 12;

      switch (period) {
        case 'month':
          return monthDiff === 0;
        case 'quarter':
          return monthDiff < 3;
        case 'year':
          return now.getFullYear() === createdAt.getFullYear();
        default:
          return true;
      }
    });
  }, [campagnes, period]);

  // Calculate statistics
  const statistics = useMemo(() => {
    return calculateCampagneStatistics(filteredCampagnes);
  }, [filteredCampagnes]);

  // Type breakdown
  const typeBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredCampagnes.forEach((c) => {
      breakdown[c.type_campagne] = (breakdown[c.type_campagne] || 0) + 1;
    });
    return breakdown;
  }, [filteredCampagnes]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    filteredCampagnes.forEach((c) => {
      breakdown[c.statut_campagne] = (breakdown[c.statut_campagne] || 0) + 1;
    });
    return breakdown;
  }, [filteredCampagnes]);

  // Top campaigns by reach
  const topCampaignesByReach = useMemo(() => {
    return [...filteredCampagnes]
      .sort((a, b) => (b.nombre_personnes_touchees || 0) - (a.nombre_personnes_touchees || 0))
      .slice(0, 5);
  }, [filteredCampagnes]);

  // Top campaigns by budget
  const topCampaignesByBudget = useMemo(() => {
    return [...filteredCampagnes]
      .sort((a, b) => (b.budget_depense || 0) - (a.budget_depense || 0))
      .slice(0, 5);
  }, [filteredCampagnes]);

  if (isLoading) {
    return <div className={`${styles.loading} ${className}`}>Chargement des statistiques...</div>;
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <h1>Tableau de Bord - Campagnes</h1>

      {isLoading && <div className={styles.loading}>Chargement des statistiques...</div>}

      {/* Period Selector */}
      <div className={styles.periodSelector}>
        {periods.map((p) => (
          <button
            key={p.value}
            className={`${styles.periodBtn} ${period === p.value ? styles.active : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Campagnes</span>
          <span className={styles.metricValue}>{statistics.totalCampagnes}</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Campagnes Actives</span>
          <span className={styles.metricValue} style={{ color: '#27ae60' }}>
            {statistics.campagnesActives}
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Budget Total</span>
          <span className={styles.metricValue}>
            {(statistics.budgetTotal / 1000000).toFixed(1)}M
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Portée Totale</span>
          <span className={styles.metricValue}>
            {(statistics.personnesTouchees / 1000).toFixed(0)}K
          </span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Taux Engagement</span>
          <span className={styles.metricValue}>
            {statistics.tauxEngagement.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsSection}>
        {/* Type Breakdown */}
        <div className={styles.chartCard}>
          <h3>Répartition par Type</h3>
          <div className={styles.typeBreakdown}>
            {Object.entries(typeBreakdown).map(([type, count]) => (
              <div key={type} className={styles.breakdownItem}>
                <span className={styles.label}>{getCampagneTypeLabel(type as any)}</span>
                <div className={styles.barContainer}>
                  <div
                    className={styles.bar}
                    style={{
                      width: `${(count / Math.max(...Object.values(typeBreakdown), 1)) * 100}%`,
                    }}
                  />
                </div>
                <span className={styles.count}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Status Breakdown */}
        <div className={styles.chartCard}>
          <h3>Répartition par Statut</h3>
          <div className={styles.statusBreakdown}>
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className={styles.statusItem}>
                <span className={styles.label}>{getCampagneStatusLabel(status as any)}</span>
                <span className={styles.count}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Campaigns */}
      <div className={styles.topSection}>
        {/* Top by Reach */}
        <div className={styles.topCard}>
          <h3>Top 5 - Par Portée</h3>
          <div className={styles.topList}>
            {topCampaignesByReach.map((c, idx) => (
              <div key={c.id} className={styles.topItem}>
                <span className={styles.rank}>{idx + 1}</span>
                <span className={styles.title}>{c.titre}</span>
                <span className={styles.value}>
                  {(c.nombre_personnes_touchees || 0).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top by Budget */}
        <div className={styles.topCard}>
          <h3>Top 5 - Par Budget Dépensé</h3>
          <div className={styles.topList}>
            {topCampaignesByBudget.map((c, idx) => (
              <div key={c.id} className={styles.topItem}>
                <span className={styles.rank}>{idx + 1}</span>
                <span className={styles.title}>{c.titre}</span>
                <span className={styles.value}>
                  {(c.budget_depense || 0).toLocaleString('fr-FR')} XAF
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Impact Section */}
      <div className={styles.impactSection}>
        <h2>Impact Global</h2>
        <div className={styles.impactGrid}>
          <div className={styles.impactCard}>
            <h4>Personnes Touchées</h4>
            <p className={styles.impactValue}>
              {statistics.personnesTouchees.toLocaleString('fr-FR')}
            </p>
          </div>

          <div className={styles.impactCard}>
            <h4>Total Interactions</h4>
            <p className={styles.impactValue}>
              {filteredCampagnes.reduce((sum, c) => sum + (c.nombre_interactions || 0), 0).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className={styles.impactCard}>
            <h4>Budget Dépensé</h4>
            <p className={styles.impactValue}>
              {(statistics.budgetDepense / 1000000).toFixed(1)}M XAF
            </p>
          </div>

          <div className={styles.impactCard}>
            <h4>Coût par Personne</h4>
            <p className={styles.impactValue}>
              {statistics.personnesTouchees > 0
                ? (statistics.budgetDepense / statistics.personnesTouchees).toFixed(0)
                : 0}{' '}
              XAF
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampagneStats;
