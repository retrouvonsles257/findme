/**
 * =====================================================
 * RETROUVONSLES - NGO Statistiques Page
 * Tableau de bord statistiques et export anonymisé
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import {
  getAdminDashboardStats,
  getAdminOrganisationUrgencyCounts,
  getAdminStatsExtended,
  getAdminMonthlyActivity,
  type AdminMonthlyActivityRow,
} from '../../features/admin-organisation/services';
import { NGOLayout } from './NGOLayout';
import { Card, CardBody, CardHeader } from '../../components/common/Card';
import { StatCard } from '../../components/cards/StatCard';
import { useI18n } from '../../hooks';
import {
  BarChart3,
  FolderOpen,
  CheckCircle2,
  Users,
  Clock,
  Loader2,
  Download,
  TrendingUp,
} from 'lucide-react';
import { AdminDetailSkeleton } from '../admin/skeletons';
import styles from './StatistiquesPage.module.css';

export const NGOStatistiquesPage: React.FC = () => {
  const { t } = useI18n();
  const authUser = useAppSelector(selectUser) as { organisation_id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser) as { organisation_id?: string } | null;
  const organisationId = currentUser?.organisation_id ?? authUser?.organisation_id ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [statsData, setStatsData] = useState({
    totalDossiers: 0,
    dossiersResolus: 0,
    personnesRetrouvees: 0,
    utilisateurs: 0,
    rapportsRecents: 0,
    avgResolutionDays: 0,
  });
  const [urgencyCounts, setUrgencyCounts] = useState({ critique: 0, urgent: 0, normal: 0, faible: 0 });
  const [extended, setExtended] = useState({
    avgResolutionDays: 0,
    newDossiersThisMonth: 0,
    resolvedThisMonth: 0,
    foundThisMonth: 0,
  });
  const [monthlyActivity, setMonthlyActivity] = useState<AdminMonthlyActivityRow[]>([]);

  const loadStatistics = useCallback(async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setLoadError(false);
      const [data, urgency, ext, monthly] = await Promise.all([
        getAdminDashboardStats(organisationId),
        getAdminOrganisationUrgencyCounts(organisationId),
        getAdminStatsExtended(organisationId),
        getAdminMonthlyActivity(organisationId, 6),
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
    } catch (err) {
      console.error('Erreur chargement statistiques NGO:', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  /** Export CSV anonymisé (agrégats uniquement, pas de données personnelles). */
  const handleExportCsv = useCallback(() => {
    setExporting(true);
    try {
      const rows = [
        'Indicateur,Valeur',
        `Total dossiers,${statsData.totalDossiers}`,
        `Dossiers résolus,${statsData.dossiersResolus}`,
        `Personnes retrouvées,${statsData.personnesRetrouvees}`,
        `Utilisateurs organisation,${statsData.utilisateurs}`,
        `Signalements récents,${statsData.rapportsRecents}`,
        `Temps moyen résolution (jours),${statsData.avgResolutionDays}`,
        `Urgence critique,${urgencyCounts.critique}`,
        `Urgence urgent,${urgencyCounts.urgent}`,
        `Urgence normal,${urgencyCounts.normal}`,
        `Urgence faible,${urgencyCounts.faible}`,
        `Nouveaux dossiers ce mois,${extended.newDossiersThisMonth}`,
        `Résolus ce mois,${extended.resolvedThisMonth}`,
        `Retrouvés vivants ce mois,${extended.foundThisMonth}`,
      ];
      const csv = '\uFEFF' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statistiques_ong_anonymise_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [statsData, urgencyCounts, extended]);

  if (!organisationId) {
    return (
      <NGOLayout>
        <div className={styles.error}>
          <p>{t('ngo.noOrganisation')}</p>
        </div>
      </NGOLayout>
    );
  }

  if (loading) {
    return (
      <NGOLayout>
        <div className={styles.skeletonWrap}>
          <AdminDetailSkeleton blockCount={3} linesPerBlock={4} />
        </div>
      </NGOLayout>
    );
  }

  const stats = [
    { icon: <FolderOpen />, title: t('ngo.totalCases'), value: String(statsData.totalDossiers), trend: { value: extended.newDossiersThisMonth, isPositive: true }, color: '#1d4ed8' },
    { icon: <CheckCircle2 />, title: t('ngo.resolvedCases'), value: String(statsData.dossiersResolus), trend: { value: extended.resolvedThisMonth, isPositive: true }, color: '#10b981' },
    { icon: <Users />, title: t('ngo.personsFound'), value: String(statsData.personnesRetrouvees), trend: { value: extended.foundThisMonth, isPositive: true }, color: '#0ea5e9' },
    { icon: <Clock />, title: t('ngo.avgResolutionDays'), value: `${statsData.avgResolutionDays} ${t('ngo.days')}`, trend: { value: 0, isPositive: true }, color: '#64748b' },
  ];

  return (
    <NGOLayout>
      <div className={styles.container}>
        {loadError && (
          <div className={styles.errorBanner} role="alert">
            {t('common.errorLoadingData')}
          </div>
        )}

        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <BarChart3 size={24} />
                {t('ngo.statistics')}
              </h1>
              <p className={styles.pageSubtitle}>{t('ngo.statisticsSubtitle')}</p>
            </div>
            <div className={styles.headerActions}>
              <button
                type="button"
                className={styles.exportBtn}
                onClick={handleExportCsv}
                disabled={exporting}
              >
                {exporting ? <Loader2 size={18} className={styles.spinner} /> : <Download size={18} />}
                <span>{t('ngo.exportAnonymised')}</span>
              </button>
            </div>
          </div>
        </header>

        <div className={styles.statsGrid}>
          {stats.map((s, idx) => (
            <StatCard
              key={idx}
              icon={s.icon}
              title={s.title}
              value={s.value}
              trend={s.trend}
              color={s.color}
            />
          ))}
        </div>

        <div className={styles.chartsRow}>
          <Card>
            <CardHeader>
              <h3 className={styles.cardTitle}><BarChart3 size={20} /> {t('ngo.urgencyDistribution')}</h3>
            </CardHeader>
            <CardBody>
              <ul className={styles.urgencyList}>
                <li><span className={styles.urgencyDot} style={{ background: '#dc2626' }} /> Critique: {urgencyCounts.critique}</li>
                <li><span className={styles.urgencyDot} style={{ background: '#f59e0b' }} /> Urgent: {urgencyCounts.urgent}</li>
                <li><span className={styles.urgencyDot} style={{ background: '#3b82f6' }} /> Normal: {urgencyCounts.normal}</li>
                <li><span className={styles.urgencyDot} style={{ background: '#6b7280' }} /> Faible: {urgencyCounts.faible}</li>
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className={styles.cardTitle}><TrendingUp size={20} /> {t('ngo.monthlyActivity')}</h3>
            </CardHeader>
            <CardBody>
              <div className={styles.monthlyTable}>
                <div className={styles.monthlyRowHeader}>
                  <span>{t('ngo.month')}</span>
                  <span>{t('ngo.newCases')}</span>
                  <span>{t('ngo.resolved')}</span>
                </div>
                {monthlyActivity.map((row) => (
                  <div key={row.month} className={styles.monthlyRow}>
                    <span>{row.label}</span>
                    <span>{row.newDossiers}</span>
                    <span>{row.resolved}</span>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </NGOLayout>
  );
};
