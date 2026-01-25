/**
 * =====================================================
 * RETROUVONSLES - Statistiques Page
 * Tableaux de bord et analyses statistiques
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useStatisticsHistory } from '../../features/statistiques/hooks/useStatisticsHistory';
import { DashboardLayout, HeaderAuthority, SidebarAuthority } from '../../components/layout';
import styles from './StatistiquesPage.module.css';

type StatsPeriod = '7j' | '30j' | '90j' | 'tout';

export const StatistiquesPage: React.FC = () => {
  const { dossiers } = useDossiers();
  const { trendData, fetchTrendData } = useStatisticsHistory();
  const [period, setPeriod] = useState<StatsPeriod>('30j');

  useEffect(() => {
    fetchTrendData(30);
  }, [fetchTrendData]);

  // Calculate statistics
  const stats = {
    totalDossiers: dossiers.length,
    dossierActifs: dossiers.filter((d: any) => d.statut_dossier === 'en_cours').length,
    dossierRetrouves: dossiers.filter((d: any) => d.statut_dossier === 'retrouve').length,
    dossiersSuspendus: dossiers.filter((d: any) => d.statut_dossier === 'suspendu').length,
    dossierUrgent: dossiers.filter((d: any) => d.niveau_urgence === 'URGENCY_CRITICAL').length,
    tauxResolution: dossiers.length > 0 
      ? Math.round((dossiers.filter((d: any) => d.statut_dossier === 'retrouve').length / dossiers.length) * 100)
      : 0,
  };

  // Calculer la distribution d'urgence à partir des vraies données
  const urgenceDistribution = (() => {
    if (dossiers.length === 0) {
      return [
        { label: 'Critique', count: 0, color: '#dc3545' },
        { label: 'Haute', count: 0, color: '#fd7e14' },
        { label: 'Moyenne', count: 0, color: '#ffc107' },
        { label: 'Basse', count: 0, color: '#28a745' },
      ];
    }

    const urgenceCounts = {
      critique: dossiers.filter((d: any) => d.niveau_urgence === 'critique').length,
      urgent: dossiers.filter((d: any) => d.niveau_urgence === 'urgent').length,
      normal: dossiers.filter((d: any) => d.niveau_urgence === 'normal').length,
      basse: dossiers.filter((d: any) => d.niveau_urgence === 'basse').length,
    };

    return [
      { label: 'Critique', count: urgenceCounts.critique, color: '#dc3545' },
      { label: 'Haute', count: urgenceCounts.urgent, color: '#fd7e14' },
      { label: 'Moyenne', count: urgenceCounts.normal, color: '#ffc107' },
      { label: 'Basse', count: urgenceCounts.basse, color: '#28a745' },
    ];
  })();

  const resolutionData = [
    { status: 'Retrouvés', count: stats.dossierRetrouves, percent: stats.totalDossiers > 0 ? Math.round((stats.dossierRetrouves / stats.totalDossiers) * 100) : 0 },
    { status: 'En Cours', count: stats.dossierActifs, percent: stats.totalDossiers > 0 ? Math.round((stats.dossierActifs / stats.totalDossiers) * 100) : 0 },
    { status: 'Suspendus', count: stats.dossiersSuspendus, percent: stats.totalDossiers > 0 ? Math.round((stats.dossiersSuspendus / stats.totalDossiers) * 100) : 0 },
  ];

  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>RetrouvonsLes</span>} />}
      sidebar={<SidebarAuthority />}
    >
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Tableau de Bord Statistique</h1>
          <p className={styles.subtitle}>Analyse des données et tendances</p>
        </div>

        {/* Period Selector */}
        <div className={styles.periodSelector}>
          {(['7j', '30j', '90j', 'tout'] as const).map((p) => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7j' && '7 Jours'}
              {p === '30j' && '30 Jours'}
              {p === '90j' && '90 Jours'}
              {p === 'tout' && 'Tous'}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className={styles.metrics}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>📁</div>
            <div className={styles.metricContent}>
              <h3>Dossiers Total</h3>
              <p className={styles.metricValue}>{stats.totalDossiers}</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>⚠️</div>
            <div className={styles.metricContent}>
              <h3>Cas Urgents</h3>
              <p className={styles.metricValue}>{stats.dossierUrgent}</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>✅</div>
            <div className={styles.metricContent}>
              <h3>Retrouvés</h3>
              <p className={styles.metricValue}>{stats.dossierRetrouves}</p>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricIcon}>📊</div>
            <div className={styles.metricContent}>
              <h3>Taux Résolution</h3>
              <p className={styles.metricValue}>{stats.tauxResolution}%</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Trend Chart */}
          <div className={styles.chartCard}>
            <h3>Tendances Hebdomadaires</h3>
            <div className={styles.chart}>
              <div className={styles.chartBars}>
                {trendData.map((data, idx) => (
                  <div key={idx} className={styles.barGroup}>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{ height: `${(data.dossiers / 10) * 100}%`, backgroundColor: '#007bff' }}
                        title={`${data.dossiers} dossiers`}
                      />
                    </div>
                    <div className={styles.barContainer}>
                      <div
                        className={styles.bar}
                        style={{ height: `${(data.retrouves / 5) * 100}%`, backgroundColor: '#28a745' }}
                        title={`${data.retrouves} retrouvés`}
                      />
                    </div>
                    <span className={styles.barLabel}>{data.period}</span>
                  </div>
                ))}
              </div>
              <div className={styles.legend}>
                <span><span className={styles.dot} style={{ backgroundColor: '#007bff' }} /> Dossiers</span>
                <span><span className={styles.dot} style={{ backgroundColor: '#28a745' }} /> Retrouvés</span>
              </div>
            </div>
          </div>

          {/* Resolution Status */}
          <div className={styles.chartCard}>
            <h3>État des Dossiers</h3>
            <div className={styles.statusChart}>
              {resolutionData.map((data, idx) => (
                <div key={idx} className={styles.statusItem}>
                  <div className={styles.statusLabel}>
                    <span>{data.status}</span>
                    <span className={styles.statusCount}>{data.count}</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progress}
                      style={{ width: `${data.percent}%` }}
                    />
                  </div>
                  <span className={styles.statusPercent}>{data.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgence Distribution */}
        <div className={styles.fullWidthCard}>
          <h3>Distribution par Niveau d'Urgence</h3>
          <div className={styles.urgenceGrid}>
            {urgenceDistribution.map((item, idx) => (
              <div key={idx} className={styles.urgenceItem}>
                <div className={styles.urgenceBadge} style={{ backgroundColor: item.color }}>
                  {item.count}
                </div>
                <p className={styles.urgenceLabel}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className={styles.fullWidthCard}>
          <h3>Métriques de Performance</h3>
          <div className={styles.performanceGrid}>
            <div className={styles.performanceItem}>
              <h4>Temps Moyen de Résolution</h4>
              <p className={styles.performanceValue}>4.2 jours</p>
            </div>
            <div className={styles.performanceItem}>
              <h4>Signalements par Dossier</h4>
              <p className={styles.performanceValue}>8.5 avg</p>
            </div>
            <div className={styles.performanceItem}>
              <h4>Taux de Validation</h4>
              <p className={styles.performanceValue}>92%</p>
            </div>
            <div className={styles.performanceItem}>
              <h4>Alertes Diffusées</h4>
              <p className={styles.performanceValue}>156</p>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className={styles.footer}>
          <button className={styles.exportBtn}>📥 Exporter Rapport</button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StatistiquesPage;
