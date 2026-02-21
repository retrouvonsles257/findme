/**
 * =====================================================
 * RETROUVONSLES - Admin Statistics Page
 * Analyse statistique des données de l'organisation
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/cards/StatCard';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import {
  getAdminDashboardStats,
  getAdminOrganisationUrgencyCounts,
  getAdminStatsExtended,
  getAdminMonthlyActivity,
  type AdminMonthlyActivityRow,
} from '../../features/admin-organisation/services';
import {
  BarChart3,
  TrendingUp,
  Users,
  FolderOpen,
  CheckCircle2,
  Clock,
  Loader2,
  Calendar,
  Download,
  UsersRound,
} from 'lucide-react';
import { StatistiquesSkeleton } from './skeletons';
import styles from './StatistiquesPage.module.css';

export const AdminOrganisationStatistiquesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [statsData, setStatsData] = useState({
    totalDossiers: 0,
    dossiersResolus: 0,
    personnesRetrouvees: 0,
    utilisateurs: 0,
    rapportsRecents: 0,
    avgResolutionDays: 0,
  });
  const [urgencyCounts, setUrgencyCounts] = useState({
    critique: 0,
    urgent: 0,
    normal: 0,
    faible: 0,
  });
  const [extended, setExtended] = useState({
    avgResolutionDays: 0,
    newDossiersThisMonth: 0,
    resolvedThisMonth: 0,
    foundThisMonth: 0,
  });
  const [monthlyActivity, setMonthlyActivity] = useState<AdminMonthlyActivityRow[]>([]);
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = useCallback(() => {
    setExporting(true);
    try {
      const rows: string[] = [
        'Indicateur,Valeur',
        `Total dossiers,${statsData.totalDossiers}`,
        `Dossiers résolus,${statsData.dossiersResolus}`,
        `Personnes retrouvées,${statsData.personnesRetrouvees}`,
        `Utilisateurs,${statsData.utilisateurs}`,
        `Rapports récents,${statsData.rapportsRecents}`,
        `Temps moyen résolution (jours),${statsData.avgResolutionDays}`,
        `Urgence critique,${urgencyCounts.critique}`,
        `Urgence urgent,${urgencyCounts.urgent}`,
        `Urgence normal,${urgencyCounts.normal}`,
        `Urgence faible,${urgencyCounts.faible}`,
      ];
      const csv = '\uFEFF' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistiques_organisation_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [statsData, urgencyCounts]);

  const loadStatistics = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      setLoadError(false);
      const [data, urgency, ext, monthly] = await Promise.all([
        getAdminDashboardStats(orgId),
        getAdminOrganisationUrgencyCounts(orgId),
        getAdminStatsExtended(orgId),
        getAdminMonthlyActivity(orgId, 6),
      ]);
      setStatsData({
        totalDossiers: data.totalDossiers,
        dossiersResolus: data.dossiersResolus,
        personnesRetrouvees: data.personnesRetrouvees,
        utilisateurs: data.utilisateurs,
        rapportsRecents: data.rapportsRecents,
        avgResolutionDays: ext.avgResolutionDays,
      });
      setUrgencyCounts(urgency);
      setExtended(ext);
      setMonthlyActivity(monthly);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadStatistics();
  }, [currentUser, navigate, period, loadStatistics]);

  const stats = [
    {
      icon: <FolderOpen />,
      title: t('admin.totalDossiers'),
      value: String(statsData.totalDossiers),
      trend: { value: extended.newDossiersThisMonth, isPositive: true },
      period: 'month',
    },
    {
      icon: <CheckCircle2 />,
      title: t('admin.resolvedDossiers'),
      value: String(statsData.dossiersResolus),
      trend: { value: extended.resolvedThisMonth, isPositive: true },
      period: 'month',
    },
    {
      icon: <Users />,
      title: t('admin.foundPersons'),
      value: String(statsData.personnesRetrouvees),
      trend: { value: extended.foundThisMonth, isPositive: true },
      period: 'month',
    },
    {
      icon: <Clock />,
      title: t('admin.avgResolutionTime'),
      value: `${statsData.avgResolutionDays} ${t('admin.days')}`,
      trend: { value: 0, isPositive: true },
      period: 'month',
    },
  ];

  return (
    <AdminOrganisationLayout title={t('admin.statistiques')} activeNav="statistiques">
      <div className={styles.statistiques__container}>
        {loading ? (
          <div className={styles.statistiques__skeletonWrap}>
            <StatistiquesSkeleton />
          </div>
        ) : (
          <>
        {loadError && (
          <div className={`${styles.statistiques__error} ${styles.statistiques__errorBanner}`} role="alert">
            <span>{t('common.error')}</span>
          </div>
        )}
        {/* Header */}
        <div className={styles.statistiques__header}>
          <div className={styles.statistiques__headerContent}>
            <div className={styles.statistiques__headerIcon}>
              <BarChart3 />
            </div>
            <div>
              <h1 className={styles.statistiques__title}>{t('admin.statistiques')}</h1>
              <p className={styles.statistiques__subtitle}>{t('admin.analyzeOrganisationData')}</p>
            </div>
          </div>
          <div className={styles.statistiques__periodSelector}>
            <Button
              variant="secondary"
              onClick={handleExportCsv}
              disabled={exporting}
              size="sm"
              title={t('admin.exportCsv')}
              aria-label={t('admin.exportCsv')}
            >
              {exporting ? <Loader2 size={16} className={styles.statistiques__loadingSpin} /> : <Download size={16} />}
              <span style={{ marginLeft: 6 }}>{t('admin.exportCsv')}</span>
            </Button>
            <Button
              variant={period === 'month' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('month')}
              size="sm"
              title={t('admin.thisMonth')}
              aria-label={t('admin.thisMonth')}
            >
              {t('admin.thisMonth')}
            </Button>
            <Button
              variant={period === 'quarter' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('quarter')}
              size="sm"
              title={t('admin.thisQuarter')}
              aria-label={t('admin.thisQuarter')}
            >
              {t('admin.thisQuarter')}
            </Button>
            <Button
              variant={period === 'year' ? 'primary' : 'secondary'}
              onClick={() => setPeriod('year')}
              size="sm"
              title={t('admin.thisYear')}
              aria-label={t('admin.thisYear')}
            >
              {t('admin.thisYear')}
            </Button>
          </div>
        </div>

        {/* Lien Coordination (Authority) */}
        <div className={styles.statistiques__statsGrid} style={{ marginBottom: 16 }}>
          <div
            className={styles.statistiques__coordinationCard}
            onClick={() => navigate('/admin/coordination')}
            role="button"
            tabIndex={0}
          >
            <Card>
              <CardBody className={styles.statistiques__coordinationCardBody}>
                <UsersRound size={28} style={{ color: '#1d4ed8' }} />
                <div>
                  <h3 className={styles.statistiques__cardTitle} style={{ margin: 0, fontSize: '1rem' }}>
                    {t('admin.coordinationLink')}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                    {t('admin.coordinationLinkDesc')}
                  </p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles.statistiques__statsGrid}>
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              icon={stat.icon}
              title={stat.title}
              value={stat.value}
              trend={stat.trend}
              color={
                idx % 4 === 0
                  ? '#1d4ed8'
                  : idx % 4 === 1
                    ? 'rgba(30, 144, 255, 0.92)'
                    : idx % 4 === 2
                      ? '#10b981'
                      : '#64748b'
              }
            />
          ))}
        </div>

        {/* Analytics Grid */}
        <div className={styles.statistiques__analyticsGrid}>
          {/* Distribution by urgency (bar chart) */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <BarChart3 className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.disburtionByType')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__barChart}>
                {(['critique', 'urgent', 'normal', 'faible'] as const).map(key => {
                  const value = urgencyCounts[key] ?? 0;
                  const max = Math.max(1, urgencyCounts.critique + urgencyCounts.urgent + urgencyCounts.normal + urgencyCounts.faible);
                  const pct = max ? Math.round((value / max) * 100) : 0;
                  const colors: Record<string, string> = { critique: '#dc2626', urgent: '#ea580c', normal: '#1d4ed8', faible: '#10b981' };
                  return (
                    <div key={key} className={styles.statistiques__barRow}>
                      <span className={styles.statistiques__barLabel}>{t(`admin.urgence.${key}`, t('common.unknown'))}</span>
                      <div className={styles.statistiques__barTrack}>
                        <div
                          className={styles.statistiques__barFill}
                          style={{ width: `${pct}%`, backgroundColor: colors[key] }}
                        />
                      </div>
                      <span className={styles.statistiques__barValue}>{value}</span>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Resolution Rate */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <TrendingUp className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.resolutionRate')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__progressContainer}>
                <div className={styles.statistiques__progressBar}>
                  <div
                    className={styles.statistiques__progress}
                    style={{
                      width: `${
                        statsData.totalDossiers > 0
                          ? Math.round(
                              (statsData.dossiersResolus / statsData.totalDossiers) * 100
                            )
                          : 0
                      }%`,
                    }}
                  >
                    {statsData.totalDossiers > 0
                      ? Math.round(
                          (statsData.dossiersResolus / statsData.totalDossiers) * 100
                        )
                      : 0}
                    {t('admin.percent')}
                  </div>
                </div>
                <p className={styles.statistiques__progressText}>
                  {t('admin.casesResolved')}{t('common.colon')} {statsData.dossiersResolus}{t('common.countSeparator')}{statsData.totalDossiers}
                </p>
              </div>
            </CardBody>
          </Card>

          {/* Monthly Activity (bar chart) */}
          <Card>
            <CardHeader>
              <div className={styles.statistiques__cardHeader}>
                <Calendar className={styles.statistiques__cardIcon} />
                <h3 className={styles.statistiques__cardTitle}>{t('admin.monthlyActivity')}</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className={styles.statistiques__monthlyChart}>
                {monthlyActivity.length === 0 ? (
                  <p className={styles.statistiques__chartEmpty}>{t('admin.chartWillBeDisplayedHere')}</p>
                ) : (
                  <>
                    <div className={styles.statistiques__monthlyBars}>
                      {monthlyActivity.map(row => {
                        const maxVal = Math.max(1, ...monthlyActivity.map(r => r.newDossiers + r.resolved));
                        const newH = (row.newDossiers / maxVal) * 100;
                        const resH = (row.resolved / maxVal) * 100;
                        return (
                          <div key={row.month} className={styles.statistiques__monthlyBarGroup}>
                            <div className={styles.statistiques__monthlyBarStack}>
                              <div title={t('admin.newCountLabel').replace('{{count}}', String(row.newDossiers))} style={{ height: `${newH}%`, backgroundColor: '#1d4ed8' }} />
                              <div title={t('admin.resolvedCountLabel').replace('{{count}}', String(row.resolved))} style={{ height: `${resH}%`, backgroundColor: '#10b981' }} />
                            </div>
                            <span className={styles.statistiques__monthlyLabel}>{row.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className={styles.statistiques__monthlyLegend}>
                      <span><span className={styles.statistiques__legendDot} style={{ background: '#1d4ed8' }} /> {t('admin.newDossier')}</span>
                      <span><span className={styles.statistiques__legendDot} style={{ background: '#10b981' }} /> {t('admin.resolvedDossiers')}</span>
                    </div>
                  </>
                )}
              </div>
            </CardBody>
          </Card>

        </div>

        {/* Performance Summary */}
        <Card>
          <CardHeader>
            <div className={styles.statistiques__cardHeader}>
              <TrendingUp className={styles.statistiques__cardIcon} />
              <h3 className={styles.statistiques__cardTitle}>{t('admin.performanceSummary')}</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className={styles.statistiques__performanceGrid}>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.avgResponseTime')}</span>
                <span className={styles.statistiques__metricValue}>{t('common.notAvailable')}</span>
              </div>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.teamProductivity')}</span>
                <span className={styles.statistiques__metricValue}>{statsData.totalDossiers > 0 ? Math.round((statsData.dossiersResolus / statsData.totalDossiers) * 100) : 0}{t('admin.percent')}</span>
              </div>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.caseUptakeRate')}</span>
                <span className={styles.statistiques__metricValue}>{statsData.totalDossiers > 0 ? Math.round((Math.max(0, statsData.totalDossiers - statsData.dossiersResolus) / statsData.totalDossiers) * 100) : 0}{t('admin.percent')}</span>
              </div>
              <div className={styles.statistiques__performanceMetric}>
                <span className={styles.statistiques__metricLabel}>{t('admin.publicReports')}</span>
                <span className={styles.statistiques__metricValue}>{statsData.rapportsRecents}</span>
              </div>
            </div>
          </CardBody>
        </Card>
          </>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationStatistiquesPage;