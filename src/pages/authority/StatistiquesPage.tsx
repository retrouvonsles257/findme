/**
 * =====================================================
 * RETROUVONSLES - Statistiques Page
 * Tableaux de bord et analyses statistiques
 * Données 100% réelles depuis Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useStatisticsHistory } from '../../features/statistiques/hooks/useStatisticsHistory';
import { usePerformanceMetrics } from '../../features/statistiques/hooks/usePerformanceMetrics';
import { exportStatistics } from '../../features/statistiques/services/statistiqueAPI';
import { AuthorityLayout } from '../../components/layout';
import {
  BarChart2,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  PieChart,
  Activity,
  Users,
  Bell,
  FileText,
  Target,
  Calendar,
  Loader2,
  ArrowUp,
  Minus,
  Zap,
  Award,
} from 'lucide-react';
import styles from './StatistiquesPage.module.css';

type StatsPeriod = '7j' | '30j' | '90j' | 'tout';

export const StatistiquesPage: React.FC = () => {
  const { dossiers, isLoading: dossiersLoading } = useDossiers();
  const { trendData, fetchTrendData, isLoading: trendLoading } = useStatisticsHistory();
  const { metrics, isLoading: metricsLoading, fetchMetrics } = usePerformanceMetrics();
  const [period, setPeriod] = useState<StatsPeriod>('30j');
  const [isExporting, setIsExporting] = useState(false);

  // Rafraîchir les données selon la période
  useEffect(() => {
    const days = period === '7j' ? 7 : period === '30j' ? 30 : period === '90j' ? 90 : 365;
    fetchTrendData(days);
  }, [period, fetchTrendData]);

  // Calculate statistics from real dossiers data
  const stats = {
    totalDossiers: dossiers.length,
    dossierActifs: dossiers.filter((d: any) => d.statut_dossier === 'en_cours').length,
    dossierRetrouves: dossiers.filter((d: any) => 
      d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede'
    ).length,
    dossiersSuspendus: dossiers.filter((d: any) => d.statut_dossier === 'suspendu').length,
    dossierUrgent: dossiers.filter((d: any) => 
      d.niveau_urgence === 'critique' || d.niveau_urgence === 'urgent'
    ).length,
    tauxResolution: dossiers.length > 0 
      ? Math.round(
          (dossiers.filter((d: any) => 
            d.statut_dossier === 'retrouve_vivant' || d.statut_dossier === 'retrouve_decede'
          ).length / dossiers.length) * 100
        )
      : 0,
  };

  // Calculer la distribution d'urgence à partir des vraies données
  const urgenceDistribution = (() => {
    if (dossiers.length === 0) {
      return [
        { label: 'Critique', count: 0, color: '#dc3545', icon: AlertTriangle },
        { label: 'Urgent', count: 0, color: '#fd7e14', icon: Zap },
        { label: 'Normal', count: 0, color: '#ffc107', icon: Minus },
        { label: 'Faible', count: 0, color: '#28a745', icon: CheckCircle },
      ];
    }

    const urgenceCounts = {
      critique: dossiers.filter((d: any) => d.niveau_urgence === 'critique').length,
      urgent: dossiers.filter((d: any) => d.niveau_urgence === 'urgent').length,
      normal: dossiers.filter((d: any) => d.niveau_urgence === 'normal').length,
      faible: dossiers.filter((d: any) => d.niveau_urgence === 'faible').length,
    };

    return [
      { label: 'Critique', count: urgenceCounts.critique, color: '#dc3545', icon: AlertTriangle },
      { label: 'Urgent', count: urgenceCounts.urgent, color: '#fd7e14', icon: Zap },
      { label: 'Normal', count: urgenceCounts.normal, color: '#ffc107', icon: Minus },
      { label: 'Faible', count: urgenceCounts.faible, color: '#28a745', icon: CheckCircle },
    ];
  })();

  const resolutionData = [
    { 
      status: 'Retrouvés', 
      count: stats.dossierRetrouves, 
      percent: stats.totalDossiers > 0 
        ? Math.round((stats.dossierRetrouves / stats.totalDossiers) * 100) 
        : 0,
      color: '#22c55e',
    },
    { 
      status: 'En Cours', 
      count: stats.dossierActifs, 
      percent: stats.totalDossiers > 0 
        ? Math.round((stats.dossierActifs / stats.totalDossiers) * 100) 
        : 0,
      color: '#1d4ed8',
    },
    { 
      status: 'Suspendus', 
      count: stats.dossiersSuspendus, 
      percent: stats.totalDossiers > 0 
        ? Math.round((stats.dossiersSuspendus / stats.totalDossiers) * 100) 
        : 0,
      color: '#9ca3af',
    },
  ];

  // Export handler
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await exportStatistics('json');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistiques_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      // Erreur silencieuse
    } finally {
      setIsExporting(false);
    }
  }, []);

  const isLoading = dossiersLoading || trendLoading || metricsLoading;

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <BarChart2 size={32} />
          </div>
          <div className={styles.headerContent}>
            <h1>Tableau de Bord Statistique</h1>
            <p className={styles.subtitle}>
              Analyse des données et tendances (données en temps réel)
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className={styles.periodSelector}>
          {(['7j', '30j', '90j', 'tout'] as const).map((p) => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.active : ''}`}
              onClick={() => setPeriod(p)}
            >
              <Calendar size={16} />
              <span>
                {p === '7j' && '7 Jours'}
                {p === '30j' && '30 Jours'}
                {p === '90j' && '90 Jours'}
                {p === 'tout' && 'Tous'}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.loadingState}>
            <Loader2 size={40} className={styles.spinner} />
            <span>Chargement des statistiques...</span>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className={styles.metrics}>
              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #1d4ed8, rgba(30, 144, 255, 0.92))' }}>
                  <FolderOpen size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Dossiers Total</span>
                  <span className={styles.metricValue}>{stats.totalDossiers}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Cas Urgents</span>
                  <span className={styles.metricValue}>{stats.dossierUrgent}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }}>
                  <CheckCircle size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Retrouvés</span>
                  <span className={styles.metricValue}>{stats.dossierRetrouves}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>Taux Résolution</span>
                  <span className={styles.metricValue}>{stats.tauxResolution}%</span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div className={styles.chartsGrid}>
              {/* Trend Chart */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <Activity size={20} className={styles.chartIcon} />
                  <h3>Tendances Hebdomadaires</h3>
                </div>
                <div className={styles.chart}>
                  <div className={styles.chartBars}>
                    {trendData.length > 0 ? (
                      trendData.map((data, idx) => (
                        <div key={idx} className={styles.barGroup}>
                          <div className={styles.barContainer}>
                            <div
                              className={styles.bar}
                              style={{ 
                                height: `${Math.min((data.dossiers / Math.max(...trendData.map(d => d.dossiers), 1)) * 100, 100)}%`, 
                                background: 'linear-gradient(to top, #1d4ed8, #60a5fa)'
                              }}
                              title={`${data.dossiers} dossiers`}
                            />
                          </div>
                          <div className={styles.barContainer}>
                            <div
                              className={styles.bar}
                              style={{ 
                                height: `${Math.min((data.retrouves / Math.max(...trendData.map(d => d.dossiers), 1)) * 100, 100)}%`, 
                                background: 'linear-gradient(to top, #22c55e, #4ade80)'
                              }}
                              title={`${data.retrouves} retrouvés`}
                            />
                          </div>
                          <span className={styles.barLabel}>{data.period}</span>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noData}>
                        <PieChart size={32} className={styles.noDataIcon} />
                        <p>Aucune donnée pour cette période</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.legend}>
                    <span className={styles.legendItem}>
                      <span className={styles.dot} style={{ background: 'linear-gradient(135deg, #1d4ed8, #60a5fa)' }} />
                      Dossiers
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.dot} style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }} />
                      Retrouvés
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Status */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <PieChart size={20} className={styles.chartIcon} />
                  <h3>État des Dossiers</h3>
                </div>
                <div className={styles.statusChart}>
                  {resolutionData.map((data, idx) => (
                    <div key={idx} className={styles.statusItem}>
                      <div className={styles.statusLabel}>
                        <span>{data.status}</span>
                        <span className={styles.statusCount} style={{ backgroundColor: data.color }}>
                          {data.count}
                        </span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progress}
                          style={{ width: `${data.percent}%`, backgroundColor: data.color }}
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
              <div className={styles.cardHeader}>
                <AlertTriangle size={20} className={styles.cardIcon} />
                <h3>Distribution par Niveau d'Urgence</h3>
              </div>
              <div className={styles.urgenceGrid}>
                {urgenceDistribution.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className={styles.urgenceItem}>
                      <div className={styles.urgenceBadge} style={{ backgroundColor: item.color }}>
                        <Icon size={24} />
                        <span className={styles.urgenceCount}>{item.count}</span>
                      </div>
                      <p className={styles.urgenceLabel}>{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance Metrics - REAL DATA */}
            <div className={styles.fullWidthCard}>
              <div className={styles.cardHeader}>
                <Activity size={20} className={styles.cardIcon} />
                <h3>Métriques de Performance (Temps Réel)</h3>
              </div>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <Clock size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Temps Moyen de Résolution</h4>
                    <p className={styles.performanceValue}>
                      {metrics.tempsMoyenResolution > 0 
                        ? `${metrics.tempsMoyenResolution} jours` 
                        : 'N/A'}
                    </p>
                    {metrics.tempsMedianResolution > 0 && (
                      <small className={styles.performanceSubtext}>
                        Médiane: {metrics.tempsMedianResolution} jours
                      </small>
                    )}
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Signalements par Dossier</h4>
                    <p className={styles.performanceValue}>
                      {metrics.signalementsParDossier > 0 
                        ? `${metrics.signalementsParDossier} avg` 
                        : '0 avg'}
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <Target size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Taux de Validation</h4>
                    <p className={styles.performanceValue}>
                      {metrics.tauxValidation}%
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <Bell size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Alertes Diffusées</h4>
                    <p className={styles.performanceValue}>
                      {metrics.alertesDiffusees}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className={styles.fullWidthCard}>
              <div className={styles.cardHeader}>
                <Award size={20} className={styles.cardIcon} />
                <h3>Statistiques Complémentaires</h3>
              </div>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon} style={{ backgroundColor: '#dcfce7', color: '#22c55e' }}>
                    <ArrowUp size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Dossiers Résolus ce Mois</h4>
                    <p className={styles.performanceValue}>
                      {metrics.dossiersResolusRecemment}
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon} style={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Taux Résolution Mensuel</h4>
                    <p className={styles.performanceValue}>
                      {metrics.tauxResolutionMensuel}%
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon} style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
                    <Activity size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Dossiers En Cours</h4>
                    <p className={styles.performanceValue}>
                      {stats.dossierActifs}
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon} style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
                    <Users size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>Dossiers Suspendus</h4>
                    <p className={styles.performanceValue}>
                      {stats.dossiersSuspendus}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className={styles.footer}>
              <button 
                className={styles.exportBtn} 
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    <span>Export en cours...</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>Exporter Rapport</span>
                  </>
                )}
              </button>
              <button 
                className={styles.refreshBtn}
                onClick={() => {
                  fetchTrendData(period === '7j' ? 7 : period === '30j' ? 30 : period === '90j' ? 90 : 365);
                  fetchMetrics();
                }}
              >
                <RefreshCw size={18} />
                <span>Rafraîchir</span>
              </button>
            </div>
          </>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default StatistiquesPage;
