/**
 * =====================================================
 * RETROUVONSLES - Dashboard Component
 * Main dashboard for statistics
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useStatistiques } from '../hooks';
import { ResolutionRate } from './ResolutionRate';
import { StatsByRegion } from './StatsByRegion';
import { TrendsAnalysis } from './TrendsAnalysis';
import { StatsFilters } from './StatsFilters';
import styles from './Dashboard.module.css';

export interface DashboardProps {
  date_debut?: string;
  date_fin?: string;
  region?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  date_debut,
  date_fin,
  region,
}) => {
  const {
    stats_globales,
    stats_regionales,
    tendances,
    isLoading,
    error,
    fetch,
    fetchRegionales,
    fetchTendances,
    updateDateRange,
    selectRegion,
  } = useStatistiques();

  useEffect(() => {
    fetch();
    fetchRegionales();
    if (date_debut && date_fin) {
      fetchTendances(date_debut, date_fin);
    }
    if (region) {
      selectRegion(region);
    }
  }, [fetch, fetchRegionales, fetchTendances, date_debut, date_fin, region, selectRegion]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Tableau de Bord Statistiques</h1>
        <p>Vue d'ensemble des statistiques de recherche</p>
      </header>

      {error && <div className={styles.error}>Erreur: {error}</div>}

      <StatsFilters
        onFilterChange={(filter) => {
          if (filter.date_debut && filter.date_fin) {
            updateDateRange(filter.date_debut, filter.date_fin);
          }
        }}
      />

      <div className={styles.metricsGrid}>
        {stats_globales && (
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats_globales.total_personnes}</div>
            <div className={styles.metricLabel}>Personnes</div>
          </div>
        )}
        {stats_globales && (
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats_globales.total_dossiers}</div>
            <div className={styles.metricLabel}>Dossiers</div>
          </div>
        )}
        {stats_globales && (
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>{stats_globales.total_signalements}</div>
            <div className={styles.metricLabel}>Signalements</div>
          </div>
        )}
        {stats_globales && (
          <div className={styles.metricCard}>
            <div className={styles.metricValue}>
              {Math.round(stats_globales.taux_resolution_global * 10) / 10}%
            </div>
            <div className={styles.metricLabel}>Taux Résolution</div>
          </div>
        )}
      </div>

      <div className={styles.chartsGrid}>
        <ResolutionRate stats={stats_globales} isLoading={isLoading} />
        <StatsByRegion
          stats={stats_regionales}
          isLoading={isLoading}
          onRegionSelect={selectRegion}
        />
        <TrendsAnalysis data={tendances} isLoading={isLoading} />
      </div>
    </div>
  );
};