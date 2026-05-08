/**
 * =====================================================
 * RETROUVONSLES - Statistiques Page
 * Tableaux de bord et analyses statistiques
 * Données 100% réelles depuis Supabase
 * =====================================================
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { useDossiers } from '../../features/dossiers/hooks/useDossiers';
import { useStatisticsHistory } from '../../features/statistiques/hooks/useStatisticsHistory';
import { usePerformanceMetrics } from '../../features/statistiques/hooks/usePerformanceMetrics';
import { exportStatistics } from '../../features/statistiques/services/statistiqueAPI';
import { AuthorityLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { AdminDetailSkeleton } from 'components/skeletons';
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
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const initialCriteria = useMemo(() => {
    if (currentUser?.role === NomRole.AUTORITE && currentUser?.organisation_id) {
      return { organisation_id: currentUser.organisation_id };
    }
    return undefined;
  }, [currentUser?.role, currentUser?.organisation_id]);
  const { dossiers, isLoading: dossiersLoading } = useDossiers({ initialCriteria });
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
        { label: t('authority.dossiers.urgency.critique'), count: 0, color: '#dc3545', icon: AlertTriangle },
        { label: t('authority.dossiers.urgency.urgent'), count: 0, color: '#fd7e14', icon: Zap },
        { label: t('authority.dossiers.urgency.normal'), count: 0, color: '#ffc107', icon: Minus },
        { label: t('authority.dossiers.urgency.faible'), count: 0, color: '#0ea5e9', icon: CheckCircle },
      ];
    }

    const urgenceCounts = {
      critique: dossiers.filter((d: any) => d.niveau_urgence === 'critique').length,
      urgent: dossiers.filter((d: any) => d.niveau_urgence === 'urgent').length,
      normal: dossiers.filter((d: any) => d.niveau_urgence === 'normal').length,
      faible: dossiers.filter((d: any) => d.niveau_urgence === 'faible').length,
    };

    return [
      { label: t('authority.dossiers.urgency.critique'), count: urgenceCounts.critique, color: '#dc3545', icon: AlertTriangle },
      { label: t('authority.dossiers.urgency.urgent'), count: urgenceCounts.urgent, color: '#fd7e14', icon: Zap },
      { label: t('authority.dossiers.urgency.normal'), count: urgenceCounts.normal, color: '#ffc107', icon: Minus },
      { label: t('authority.dossiers.urgency.faible'), count: urgenceCounts.faible, color: '#0ea5e9', icon: CheckCircle },
    ];
  })();

  const resolutionData = [
    { 
      status: t('authority.statistiques.resolution.found'),
      count: stats.dossierRetrouves, 
      percent: stats.totalDossiers > 0 
        ? Math.round((stats.dossierRetrouves / stats.totalDossiers) * 100) 
        : 0,
      color: '#0ea5e9',
    },
    { 
      status: t('authority.dossiers.status.en_cours'),
      count: stats.dossierActifs, 
      percent: stats.totalDossiers > 0 
        ? Math.round((stats.dossierActifs / stats.totalDossiers) * 100) 
        : 0,
      color: '#0ea5e9',
    },
    { 
      status: t('authority.dossiers.status.suspendu'),
      count: stats.dossiersSuspendus, 
      percent: stats.totalDossiers > 0 
        ? Math.round((stats.dossiersSuspendus / stats.totalDossiers) * 100) 
        : 0,
      color: '#9ca3af',
    },
  ];

  // Export handler (JSON ou CSV)
  const handleExport = useCallback(async (format: 'json' | 'csv' = 'json') => {
    setIsExporting(true);
    try {
      const blob = await exportStatistics(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'csv' ? 'csv' : 'json';
      a.download = `statistiques_${new Date().toISOString().split('T')[0]}.${ext}`;
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
            <h1>{t('authority.statistiques.title')}</h1>
            <p className={styles.subtitle}>
              {t('authority.statistiques.subtitle')}
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
                {p === '7j' && t('authority.statistiques.periods.7days')}
                {p === '30j' && t('authority.statistiques.periods.30days')}
                {p === '90j' && t('authority.statistiques.periods.90days')}
                {p === 'tout' && t('authority.statistiques.periods.all')}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.skeletonWrap}>
            <AdminDetailSkeleton blockCount={4} linesPerBlock={4} />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className={styles.metrics}>
              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #0ea5e9, rgba(14, 165, 233, 0.92))' }}>
                  <FolderOpen size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>{t('authority.statistiques.metrics.totalDossiers')}</span>
                  <span className={styles.metricValue}>{stats.totalDossiers}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                  <AlertTriangle size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>{t('authority.statistiques.metrics.urgentCases')}</span>
                  <span className={styles.metricValue}>{stats.dossierUrgent}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                  <CheckCircle size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>{t('authority.statistiques.metrics.found')}</span>
                  <span className={styles.metricValue}>{stats.dossierRetrouves}</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricIconWrapper} style={{ background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.metricContent}>
                  <span className={styles.metricLabel}>{t('authority.statistiques.metrics.resolutionRate')}</span>
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
                  <h3>{t('authority.statistiques.charts.weeklyTrends')}</h3>
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
                                background: 'linear-gradient(to top, #0ea5e9, #38bdf8)'
                              }}
                              title={`${data.dossiers} ${t('authority.statistiques.tooltips.dossiersSuffix')}`}
                            />
                          </div>
                          <div className={styles.barContainer}>
                            <div
                              className={styles.bar}
                              style={{ 
                                height: `${Math.min((data.retrouves / Math.max(...trendData.map(d => d.dossiers), 1)) * 100, 100)}%`, 
                                background: 'linear-gradient(to top, #0ea5e9, #38bdf8)'
                              }}
                              title={`${data.retrouves} ${t('authority.statistiques.tooltips.foundSuffix')}`}
                            />
                          </div>
                          <span className={styles.barLabel}>{data.period}</span>
                        </div>
                      ))
                    ) : (
                      <div className={styles.noData}>
                        <PieChart size={32} className={styles.noDataIcon} />
                        <p>{t('authority.statistiques.noData')}</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.legend}>
                    <span className={styles.legendItem}>
                      <span className={styles.dot} style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }} />
                      {t('authority.statistiques.legend.dossiers')}
                    </span>
                    <span className={styles.legendItem}>
                      <span className={styles.dot} style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }} />
                      {t('authority.statistiques.legend.found')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolution Status */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <PieChart size={20} className={styles.chartIcon} />
                  <h3>{t('authority.statistiques.charts.dossierStatus')}</h3>
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
                <h3>{t('authority.statistiques.charts.urgencyDistribution')}</h3>
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
                <h3>{t('authority.statistiques.performance.title')}</h3>
              </div>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <Clock size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>{t('authority.statistiques.performance.avgResolutionTime')}</h4>
                    <p className={styles.performanceValue}>
                      {metrics.tempsMoyenResolution > 0 
                        ? `${metrics.tempsMoyenResolution} ${t('authority.statistiques.units.days')}`
                        : t('authority.statistiques.values.na')}
                    </p>
                    {metrics.tempsMedianResolution > 0 && (
                      <small className={styles.performanceSubtext}>
                        {t('authority.statistiques.performance.median')}: {metrics.tempsMedianResolution} {t('authority.statistiques.units.days')}
                      </small>
                    )}
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <FileText size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>{t('authority.statistiques.performance.reportsPerDossier')}</h4>
                    <p className={styles.performanceValue}>
                      {metrics.signalementsParDossier > 0 
                        ? `${metrics.signalementsParDossier} ${t('authority.statistiques.units.avg')}`
                        : `0 ${t('authority.statistiques.units.avg')}`}
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon}>
                    <Target size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>{t('authority.statistiques.performance.validationRate')}</h4>
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
                    <h4>{t('authority.statistiques.performance.broadcastAlerts')}</h4>
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
                <h3>{t('authority.statistiques.additional.title')}</h3>
              </div>
              <div className={styles.performanceGrid}>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon} style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
                    <ArrowUp size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>{t('authority.statistiques.additional.resolvedThisMonth')}</h4>
                    <p className={styles.performanceValue}>
                      {metrics.dossiersResolusRecemment}
                    </p>
                  </div>
                </div>
                <div className={styles.performanceItem}>
                  <div className={styles.performanceIcon} style={{ backgroundColor: '#e0f2fe', color: '#0ea5e9' }}>
                    <TrendingUp size={20} />
                  </div>
                  <div className={styles.performanceContent}>
                    <h4>{t('authority.statistiques.additional.monthlyResolutionRate')}</h4>
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
                    <h4>{t('authority.statistiques.additional.inProgress')}</h4>
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
                    <h4>{t('authority.statistiques.additional.suspended')}</h4>
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
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                title={t('authority.statistiques.export.exportCsv')}
              >
                {isExporting ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    <span>{t('authority.statistiques.export.exporting')}</span>
                  </>
                ) : (
                  <>
                    <Download size={18} />
                    <span>{t('authority.statistiques.export.exportCsv')}</span>
                  </>
                )}
              </button>
              <button 
                className={styles.refreshBtn}
                onClick={() => handleExport('json')}
                disabled={isExporting}
                title={t('authority.statistiques.export.exportReport')}
              >
                <Download size={18} />
                <span>{t('authority.statistiques.export.exportReport')}</span>
              </button>
              <button 
                className={styles.refreshBtn}
                onClick={() => {
                  fetchTrendData(period === '7j' ? 7 : period === '30j' ? 30 : period === '90j' ? 90 : 365);
                  fetchMetrics();
                }}
              >
                <RefreshCw size={18} />
                <span>{t('authority.statistiques.refresh')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default StatistiquesPage;
