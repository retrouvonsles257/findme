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
  Plus,
  Activity,
  CheckCircle,
  Clock,
  UserCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Bell,
  Brain,
  Megaphone,
  UsersRound,
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { AdminOrganisationLayout } from './AdminOrganisationLayout';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';
import { useI18n } from '../../hooks';
import { getAdminDashboardStats, getAdminRecentActivities } from '../../features/admin-organisation/services';
import type { AdminDashboardStats } from '../../features/admin-organisation/services';
import styles from './DashboardPage.module.css';

interface ActivityItem {
  type: string;
  title: string;
  description: string;
  time: string;
  icon: typeof Folder;
}

export const AdminOrganisationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState(false);

  const loadStats = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setLoading(true);
      const data = await getAdminDashboardStats(orgId);
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.organisation_id]);

  const loadRecentActivities = useCallback(async () => {
    const orgId = currentUser?.organisation_id;
    if (!orgId) return;
    try {
      setActivitiesError(false);
      const rows = await getAdminRecentActivities(orgId, 5);
      const activityLabels: Record<string, string> = {
        creation_dossier: t('admin.activityDossierCreated'),
        modification_dossier: t('admin.activityRapportUpdated'),
        creation_signalement: t('admin.activityRapportUpdated'),
        validation_signalement: t('admin.activityRapportUpdated'),
        diffusion_alerte: t('admin.activityDossierCreated'),
        connexion: t('admin.recentActivity'),
        deconnexion: t('admin.recentActivity'),
        modification_profil: t('admin.recentActivity'),
        upload_photo: t('admin.activityDossierCreated'),
        changement_statut: t('admin.activityPersonneFound'),
        attribution_role: t('admin.recentActivity'),
        autre: t('admin.recentActivity'),
      };
      const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffHours < 1) return t('common.time_minutes').replace('{{count}}', String(Math.max(1, Math.floor(diffMs / 60000))));
        if (diffHours < 24) return t('common.time_hours').replace('{{count}}', String(diffHours));
        if (diffDays === 1) return t('common.time_day');
        return t('common.time_days').replace('{{count}}', String(diffDays));
      };
      const iconByType: Record<string, typeof Folder> = {
        creation_dossier: Folder,
        modification_dossier: FileText,
        creation_signalement: FileText,
        validation_signalement: CheckCircle,
        changement_statut: CheckCircle,
        diffusion_alerte: Folder,
      };
      setRecentActivities(
        rows.map((r) => ({
          type: r.type_action,
          title: activityLabels[r.type_action] || r.action_detaillee || r.type_action,
          description: r.action_detaillee || r.description || '',
          time: formatTime(r.date_action),
          icon: iconByType[r.type_action] || Activity,
        }))
      );
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      setActivitiesError(true);
      setRecentActivities([]);
    }
  }, [currentUser?.organisation_id, t]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }
    loadStats();
    loadRecentActivities();
  }, [currentUser, navigate, loadStats, loadRecentActivities]);

  const quickActions = [
    { title: t('admin.newDossier'), description: t('admin.createNewFile'), icon: Folder, action: () => navigate('/admin/dossiers/new') },
    { title: t('admin.viewReports'), description: t('admin.manageReports'), icon: FileText, action: () => navigate('/admin/rapports') },
    { title: t('admin.manageUsers'), description: t('admin.manageTeam'), icon: Users, action: () => navigate('/admin/utilisateurs') },
    { title: t('admin.viewAlertes'), description: t('admin.viewAlertesDesc'), icon: Bell, action: () => navigate('/admin/alertes') },
    { title: t('admin.viewIAResults'), description: t('admin.viewIAResultsDesc'), icon: Brain, action: () => navigate('/admin/ia') },
    { title: t('admin.viewCampagnes'), description: t('admin.viewCampagnesDesc'), icon: Megaphone, action: () => navigate('/admin/campagnes') },
    { title: t('admin.viewCoordination'), description: t('admin.coordinationLinkDesc'), icon: UsersRound, action: () => navigate('/admin/coordination') },
  ];

  const safeStats = stats || {
    totalDossiers: 0,
    dossiersActifs: 0,
    dossiersResolus: 0,
    personnesRetrouvees: 0,
    rapportsRecents: 0,
    utilisateurs: 0,
    newDossiersThisMonth: 0,
    resolvedThisMonth: 0,
  };
  const successRate = safeStats.dossiersResolus > 0 ? Math.round((safeStats.personnesRetrouvees / safeStats.dossiersResolus) * 100) : 0;

  return (
    <AdminOrganisationLayout title={t('admin.dashboard')} activeNav="dashboard">
      <div className={styles.dashboard}>
        {loading ? (
          <div className={styles.dashboard__loading}>
            <Loader2 className={styles.dashboard__loadingSpin} size={32} />
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            <div className={styles.dashboard__welcome}>
              <div className={styles.dashboard__welcomeContent}>
                <h2 className={styles.dashboard__welcomeTitle}>
                  {currentUser?.id ? t('admin.welcomeAdmin') : t('admin.welcome')}
                </h2>
                <p className={styles.dashboard__welcomeDescription}>{t('admin.manageMissingPersonFiles')}</p>
              </div>
              <button
                type="button"
                className={styles.dashboard__btnCreate}
                onClick={() => navigate('/admin/dossiers/new')}
                title={t('admin.newDossier')}
                aria-label={t('admin.newDossier')}
              >
                <Plus size={18} />
                {t('admin.newDossier')}
              </button>
            </div>

            <div className={styles.dashboard__statsGrid}>
              <div className={styles.dashboard__statCard}>
                <div className={styles.dashboard__statHeader}>
                  <div className={styles.dashboard__statIcon}>
                    <Folder size={24} />
                  </div>
                  <div className={styles.dashboard__statContent}>
                    <p className={styles.dashboard__statValue}>{safeStats.totalDossiers}</p>
                    <p className={styles.dashboard__statLabel}>{t('admin.totalDossiers')}</p>
                    {typeof safeStats.newDossiersThisMonth === 'number' && safeStats.newDossiersThisMonth > 0 && (
                      <p className={styles.dashboard__statChange}>+{safeStats.newDossiersThisMonth} {t('admin.trendThisMonth')}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.dashboard__statCard}>
                <div className={styles.dashboard__statHeader}>
                  <div className={styles.dashboard__statIcon} style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#d97706' }}>
                    <Clock size={24} />
                  </div>
                  <div className={styles.dashboard__statContent}>
                    <p className={styles.dashboard__statValue}>{safeStats.dossiersActifs}</p>
                    <p className={styles.dashboard__statLabel}>{t('admin.activeDossiers')}</p>
                    <p className={styles.dashboard__statChange}>{t('admin.trendInProgress')}</p>
                  </div>
                </div>
              </div>
              <div className={styles.dashboard__statCard}>
                <div className={styles.dashboard__statHeader}>
                  <div className={styles.dashboard__statIcon} style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div className={styles.dashboard__statContent}>
                    <p className={styles.dashboard__statValue}>{safeStats.dossiersResolus}</p>
                    <p className={styles.dashboard__statLabel}>{t('admin.resolvedDossiers')}</p>
                    {typeof safeStats.resolvedThisMonth === 'number' && safeStats.resolvedThisMonth > 0 && (
                      <p className={styles.dashboard__statChange}>+{safeStats.resolvedThisMonth} {t('admin.trendThisMonth')}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.dashboard__statCard}>
                <div className={styles.dashboard__statHeader}>
                  <div className={styles.dashboard__statIcon} style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#9333ea' }}>
                    <UserCheck size={24} />
                  </div>
                  <div className={styles.dashboard__statContent}>
                    <p className={styles.dashboard__statValue}>{safeStats.personnesRetrouvees}</p>
                    <p className={styles.dashboard__statLabel}>{t('admin.foundPersons')}</p>
                    <p className={styles.dashboard__statChange}>{t('admin.trendFound')}</p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className={styles.dashboard__sectionTitle}>{t('admin.sectionQuickActions')}</h2>
            <div className={styles.dashboard__actionsGrid}>
              {quickActions.map((action, idx) => {
                const IconComponent = action.icon;
                return (
                  <div key={idx} className={styles.dashboard__actionCard} onClick={action.action}>
                    <IconComponent className={styles.dashboard__actionIcon} size={28} />
                    <h3 className={styles.dashboard__actionTitle}>{action.title}</h3>
                    <p className={styles.dashboard__actionDescription}>{action.description}</p>
                    <span className={styles.dashboard__actionBtn}>
                      {t('common.access')} <ArrowRight size={16} />
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={styles.dashboard__overview}>
              <div className={styles.dashboard__overviewLeft}>
                <h2 className={styles.dashboard__sectionTitle}>{t('admin.sectionRecentActivity')}</h2>
                <div className={styles.dashboard__activityCard}>
                  {activitiesError ? (
                    <div className={styles.dashboard__empty}>
                      <AlertCircle className={styles.dashboard__emptyIcon} />
                      <p>{t('admin.noLogsFound')}</p>
                    </div>
                  ) : recentActivities.length === 0 ? (
                    <div className={styles.dashboard__empty}>
                      <Activity className={styles.dashboard__emptyIcon} />
                      <p>{t('admin.noActivity')}</p>
                    </div>
                  ) : (
                    <div className={styles.dashboard__activityList}>
                      {recentActivities.map((activity, idx) => {
                        const IconComponent = activity.icon;
                        return (
                          <div key={idx} className={styles.dashboard__activityItem}>
                            <div className={styles.dashboard__activityIconWrapper}>
                              <IconComponent className={styles.dashboard__activityIcon} size={18} />
                            </div>
                            <div className={styles.dashboard__activityContent}>
                              <h4 className={styles.dashboard__activityTitle}>{activity.title}</h4>
                              <p className={styles.dashboard__activityDescription}>{activity.description}</p>
                              <span className={styles.dashboard__activityTime}>{activity.time}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.dashboard__overviewRight}>
                <h2 className={styles.dashboard__sectionTitle}>{t('admin.sectionSummary')}</h2>
                <div className={styles.dashboard__summaryCard}>
                  <div className={styles.dashboard__summaryItem}>
                    <span className={styles.dashboard__summaryLabel}>{t('admin.totalUsers')}</span>
                    <span className={styles.dashboard__summaryValue}>{safeStats.utilisateurs}</span>
                  </div>
                  <div className={styles.dashboard__summaryDivider} />
                  <div className={styles.dashboard__summaryItem}>
                    <span className={styles.dashboard__summaryLabel}>{t('admin.recentReports')}</span>
                    <span className={styles.dashboard__summaryValue}>{safeStats.rapportsRecents}</span>
                  </div>
                  <div className={styles.dashboard__summaryDivider} />
                  <div className={styles.dashboard__summaryItem}>
                    <span className={styles.dashboard__summaryLabel}>{t('admin.successRate')}</span>
                    <span className={styles.dashboard__summaryValue}>{successRate}{t('admin.percent')}</span>
                  </div>
                  <div className={styles.dashboard__summaryDivider} />
                  <button
                    type="button"
                    className={styles.dashboard__summaryBtn}
                    onClick={() => navigate('/admin/statistiques')}
                    title={t('admin.viewDetailedStats')}
                    aria-label={t('admin.viewDetailedStats')}
                  >
                    {t('admin.viewDetailedStats')} <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminOrganisationLayout>
  );
};

export default AdminOrganisationDashboardPage;
