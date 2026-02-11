/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Dashboard Page
 * Style aligné Super Admin, données Supabase réelles
 * =====================================================
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  FileText,
  Users,
  Bell,
  Brain,
  Megaphone,
  UsersRound,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { useI18n } from '../../hooks';
import {
  getAdminDashboardStats,
  getAdminRecentActivities,
} from '../../features/admin-organisation/services';
import type { AdminDashboardStats } from '../../features/admin-organisation/services';
import {
  ACTIVITY_LABEL_KEYS,
  ACTIVITY_ICONS,
  DEFAULT_ACTIVITY_ICON,
  formatActivityTime,
} from '../../features/admin-organisation/adminActivityConfig';
import {
  DashboardWelcome,
  DashboardStatsGrid,
  DashboardQuickActions,
  DashboardRecentActivity,
  DashboardSummary,
} from './dashboard';
import type { ActivityItem } from './dashboard';
import styles from './DashboardPage.module.css';

export const AdminOrganisationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [activitiesError, setActivitiesError] = useState(false);

  const loadStats = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setStatsError(false);
      setStatsLoading(true);
      const data = await getAdminDashboardStats(orgId);
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setStatsError(true);
    } finally {
      setStatsLoading(false);
    }
  }, [currentUser?.organisation_id]);

  const loadRecentActivities = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setActivitiesError(false);
      setActivitiesLoading(true);
      const rows = await getAdminRecentActivities(orgId, 5);
      const activityLabels: Record<string, string> = {};
      for (const [key, i18nKey] of Object.entries(ACTIVITY_LABEL_KEYS)) {
        activityLabels[key] = t(i18nKey);
      }
      setRecentActivities(
        rows.map((r, i) => ({
          id: `${r.date_action}-${r.type_action}-${i}`,
          type: r.type_action,
          title:
            activityLabels[r.type_action] ||
            r.action_detaillee ||
            r.type_action,
          description: r.action_detaillee || r.description || '',
          time: formatActivityTime(r.date_action, t),
          icon: ACTIVITY_ICONS[r.type_action] || DEFAULT_ACTIVITY_ICON,
        }))
      );
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      setActivitiesError(true);
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [currentUser?.organisation_id, t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    const orgId = currentUser.organisation_id;
    if (!orgId) {
      setStatsLoading(false);
      setActivitiesLoading(false);
      return;
    }

    loadStats();
    loadRecentActivities();
  }, [currentUser, navigate, loadStats, loadRecentActivities]);

  const quickActions = [
    {
      path: '/admin/dossiers/new',
      title: t('admin.newDossier'),
      description: t('admin.createNewFile'),
      icon: Folder,
      action: () => navigate('/admin/dossiers/new'),
    },
    {
      path: '/admin/rapports',
      title: t('admin.viewReports'),
      description: t('admin.manageReports'),
      icon: FileText,
      action: () => navigate('/admin/rapports'),
    },
    {
      path: '/admin/utilisateurs',
      title: t('admin.manageUsers'),
      description: t('admin.manageTeam'),
      icon: Users,
      action: () => navigate('/admin/utilisateurs'),
    },
    {
      path: '/admin/alertes',
      title: t('admin.viewAlertes'),
      description: t('admin.viewAlertesDesc'),
      icon: Bell,
      action: () => navigate('/admin/alertes'),
    },
    {
      path: '/admin/ia',
      title: t('admin.viewIAResults'),
      description: t('admin.viewIAResultsDesc'),
      icon: Brain,
      action: () => navigate('/admin/ia'),
    },
    {
      path: '/admin/campagnes',
      title: t('admin.viewCampagnes'),
      description: t('admin.viewCampagnesDesc'),
      icon: Megaphone,
      action: () => navigate('/admin/campagnes'),
    },
    {
      path: '/admin/coordination',
      title: t('admin.viewCoordination'),
      description: t('admin.coordinationLinkDesc'),
      icon: UsersRound,
      action: () => navigate('/admin/coordination'),
    },
  ];

  const safeStats: AdminDashboardStats = stats || {
    totalDossiers: 0,
    dossiersActifs: 0,
    dossiersResolus: 0,
    personnesRetrouvees: 0,
    rapportsRecents: 0,
    utilisateurs: 0,
    newDossiersThisMonth: 0,
    resolvedThisMonth: 0,
  };
  const successRate =
    safeStats.dossiersResolus > 0
      ? Math.round(
          (safeStats.personnesRetrouvees / safeStats.dossiersResolus) * 100
        )
      : 0;

  return (
    <AdminOrganisationLayout title={t('admin.dashboard')} activeNav="dashboard">
      <div className={styles.dashboard}>
        {statsLoading ? (
          <>
            <div className={styles.dashboard__skeletonWelcome}>
              <div className={styles.dashboard__skeletonWelcomeContent}>
                <div
                  className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonLine} ${styles.dashboard__skeletonLineWide}`}
                />
                <div
                  className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonLine} ${styles.dashboard__skeletonLineShort}`}
                />
              </div>
              <div
                className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonWelcomeBtn}`}
              />
            </div>
            <div className={styles.dashboard__statsGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={`skeleton-stat-${i}`}
                  className={styles.dashboard__skeletonStatCard}
                >
                  <div className={styles.dashboard__skeletonStatHeader}>
                    <div
                      className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonCircle}`}
                    />
                    <div
                      className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonStatValue}`}
                    />
                  </div>
                  <div
                    className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonStatLabel}`}
                  />
                </div>
              ))}
            </div>
            <div
              className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonSectionTitle}`}
            />
            <div className={styles.dashboard__actionsGrid}>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={`skeleton-action-${i}`}
                  className={styles.dashboard__skeletonActionCard}
                >
                  <div
                    className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonActionIcon}`}
                  />
                  <div
                    className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonActionTitle}`}
                  />
                  <div
                    className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonActionDesc}`}
                  />
                </div>
              ))}
            </div>
            <div className={styles.dashboard__overview}>
              <div className={styles.dashboard__overviewLeft}>
                <div
                  className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonSectionTitle} ${styles.dashboard__skeletonSectionTitleWithMargin}`}
                />
                <div className={styles.dashboard__skeletonActivityCard}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={`skeleton-activity-${i}`}
                      className={styles.dashboard__skeletonActivityItem}
                    >
                      <div
                        className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonActivityIcon}`}
                      />
                      <div className={styles.dashboard__skeletonActivityLines}>
                        <div
                          className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonLine}`}
                        />
                        <div
                          className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonLine} ${styles.dashboard__skeletonLineShort}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.dashboard__overviewRight}>
                <div
                  className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonSectionTitle} ${styles.dashboard__skeletonSectionTitleWithMargin}`}
                />
                <div className={styles.dashboard__skeletonSummaryCard}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={`skeleton-summary-${i}`}
                      className={styles.dashboard__skeletonSummaryRow}
                    >
                      <div
                        className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonSummaryLabel}`}
                      />
                      <div
                        className={`${styles.dashboard__skeleton} ${styles.dashboard__skeletonSummaryValue}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {statsError && (
              <div
                className={`${styles.dashboard__error} ${styles.dashboard__errorBanner}`}
                role="alert"
              >
                <AlertCircle size={18} aria-hidden />
                <span>{t('admin.noLogsFound')}</span>
              </div>
            )}
            <DashboardWelcome
              styles={styles}
              welcomeTitle={
                currentUser?.id ? t('admin.welcomeAdmin') : t('admin.welcome')
              }
              welcomeDescription={t('admin.manageMissingPersonFiles')}
              newDossierLabel={t('admin.newDossier')}
              onNewDossier={() => navigate('/admin/dossiers/new')}
            />
            <DashboardStatsGrid styles={styles} stats={safeStats} t={t} />
            <DashboardQuickActions
              styles={styles}
              sectionTitle={t('admin.sectionQuickActions')}
              actions={quickActions}
              accessLabel={t('common.access')}
            />
            <div className={styles.dashboard__overview}>
              <div className={styles.dashboard__overviewLeft}>
                <DashboardRecentActivity
                  styles={styles}
                  sectionTitle={t('admin.sectionRecentActivity')}
                  loading={activitiesLoading}
                  error={activitiesError}
                  errorMessage={t('admin.noLogsFound')}
                  emptyMessage={t('admin.noActivity')}
                  activities={recentActivities}
                />
              </div>
              <div className={styles.dashboard__overviewRight}>
                <DashboardSummary
                  styles={styles}
                  sectionTitle={t('admin.sectionSummary')}
                  totalUsersLabel={t('admin.totalUsers')}
                  recentReportsLabel={t('admin.recentReports')}
                  successRateLabel={t('admin.successRate')}
                  totalUsers={safeStats.utilisateurs}
                  recentReports={safeStats.rapportsRecents}
                  successRate={successRate}
                  percentLabel={t('admin.percent')}
                  viewDetailedStatsLabel={t('admin.viewDetailedStats')}
                  onViewStats={() => navigate('/admin/statistiques')}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDashboardPage;
