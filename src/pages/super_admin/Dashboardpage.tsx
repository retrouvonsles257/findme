/**
 * =====================================================
 * RETROUVONSLES - Super Admin Dashboard Page
 * Dashboard principal pour les super administrateurs
 * Connecté à Supabase pour les données réelles
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { SuperAdminLayout } from './SuperAdminLayout';
import { DashboardSkeleton } from 'components/skeletons';
import {
  Building2,
  Users,
  Activity,
  BellRing,
  DatabaseBackup,
  Shield,
  ShieldCheck,
  AlertCircle,
  FileText,
  Settings,
} from 'lucide-react';
import styles from './Dashboardpage.module.css';

interface DashboardStats {
  totalOrganisations: number;
  totalUsers: number;
  totalRoles: number;
  totalLogs: number;
  totalConfigurations: number;
}

export const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrganisations: 0,
    totalUsers: 0,
    totalRoles: 0,
    totalLogs: 0,
    totalConfigurations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques depuis Supabase
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [
          orgResult,
          usersResult,
          rolesResult,
          logsResult,
          configResult,
        ] = await Promise.all([
          (supabase as any).from('organisation').select('id', { count: 'exact', head: true }),
          (supabase as any).from('utilisateur').select('id', { count: 'exact', head: true }),
          (supabase as any).from('role').select('id', { count: 'exact', head: true }),
          (supabase as any).from('journal_activite').select('id', { count: 'exact', head: true }),
          (supabase as any).from('configuration_systeme').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalOrganisations: orgResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalRoles: rolesResult.count || 0,
          totalLogs: logsResult.count || 0,
          totalConfigurations: configResult.count || 0,
        });

      } catch (err: any) {
        console.error('Erreur chargement stats:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  const statsCards = [
    { label: t('super_admin.totalOrganisations'), value: stats.totalOrganisations.toString(), icon: Building2, color: '#38bdf8' },
    { label: t('super_admin.totalUsers'), value: stats.totalUsers.toString(), icon: Users, color: '#10b981' },
    { label: t('super_admin.rolesMenu'), value: stats.totalRoles.toString(), icon: Shield, color: '#8b5cf6' },
    { label: t('super_admin.systemLogsMenu'), value: stats.totalLogs.toString(), icon: FileText, color: '#f59e0b' },
    { label: t('super_admin.systemSettingsMenu'), value: stats.totalConfigurations.toString(), icon: Settings, color: '#06b6d4' },
    { label: t('super_admin.observabilityMenu'), value: 'OK', icon: Activity, color: '#0ea5e9' },
  ];

  const quickActions = [
    { title: t('super_admin.viewAllOrganisations'), description: t('super_admin.manageOrganisations'), icon: Building2, onClick: () => navigate('/super-admin/organisations'), primary: true },
    { title: t('super_admin.viewSystemUsers'), description: t('super_admin.manageSystemUsers'), icon: Users, onClick: () => navigate('/super-admin/system-users'), primary: false },
    { title: t('super_admin.manageRoles'), description: t('super_admin.rolesDescription'), icon: Shield, onClick: () => navigate('/super-admin/roles'), primary: false },
    { title: t('super_admin.securityAccessMenu'), description: 'Audit des accès, privilèges et rôles sensibles', icon: ShieldCheck, onClick: () => navigate('/super-admin/security-access'), primary: false },
    { title: t('super_admin.systemLogsMenu'), description: t('super_admin.systemLogsTitle'), icon: FileText, onClick: () => navigate('/super-admin/system-logs'), primary: false },
    { title: t('super_admin.systemSettingsMenu'), description: t('super_admin.systemSettingsTitle'), icon: Settings, onClick: () => navigate('/super-admin/system-settings'), primary: false },
    { title: t('super_admin.observabilityMenu'), description: 'Santé technique Supabase, push et services critiques', icon: Activity, onClick: () => navigate('/super-admin/observability'), primary: false },
    { title: t('super_admin.backupRetentionMenu'), description: 'Sauvegardes, conservation et exports conformité', icon: DatabaseBackup, onClick: () => navigate('/super-admin/backup-retention'), primary: false },
    { title: t('super_admin.systemNotificationsMenu'), description: 'Monitoring FCM/Web Push sans contenu métier', icon: BellRing, onClick: () => navigate('/super-admin/system-notifications'), primary: false },
  ];

  return (
    <SuperAdminLayout
      title={t('super_admin.dashboardTitle')}
      activeNav="dashboard"
    >
      <div className={styles.dashboard}>
        {/* Welcome Section */}
        <section className={styles['dashboard__welcome']}>
          <div className={styles['dashboard__welcome-content']}>
            <h1 className={styles['dashboard__welcome-title']}>
              {t('super_admin.dashboardSubtitle')}
            </h1>
            <p className={styles['dashboard__welcome-description']}>
              {t('super_admin.dashboardDescription')}
            </p>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className={styles['dashboard__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className={styles['dashboard__skeletonWrap']}>
            <DashboardSkeleton statCount={6} actionCount={9} listRows={5} />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className={styles['dashboard__stats-grid']}>
              {statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={styles['dashboard__stat-card']}>
                    <div className={styles['dashboard__stat-header']}>
                      <div className={styles['dashboard__stat-icon']} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                        <Icon size={24} />
                      </div>
                      <div className={styles['dashboard__stat-content']}>
                        <h3 className={styles['dashboard__stat-value']}>{stat.value}</h3>
                        <p className={styles['dashboard__stat-label']}>{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <h2 className={styles['dashboard__section-title']}>{t('super_admin.quickActions')}</h2>
            <div className={styles['dashboard__actions-grid']}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    className={`${styles['dashboard__action-card']} ${action.primary ? styles['dashboard__action-card--primary'] : ''}`}
                    onClick={action.onClick}
                  >
                    <Icon size={32} className={styles['dashboard__action-icon']} />
                    <div>
                      <h3 className={styles['dashboard__action-title']}>{action.title}</h3>
                      <p className={styles['dashboard__action-description']}>{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboardPage;
