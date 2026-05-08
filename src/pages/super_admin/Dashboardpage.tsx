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
  FolderOpen,
  Zap,
  Bell,
  Heart,
  Globe,
  Shield,
  AlertCircle,
  DollarSign,
  Brain,
  Megaphone,
  Image,
  MessageSquare,
  FileText,
} from 'lucide-react';
import styles from './Dashboardpage.module.css';

interface DashboardStats {
  totalOrganisations: number;
  totalUsers: number;
  totalDossiers: number;
  activeDossiers: number;
  totalAlerts: number;
  totalSignalements: number;
  pendingValidations: number;
  totalNotifications: number;
  unreadNotifications: number;
  pendingPhotos: number;
  confidentialComments: number;
  totalDocuments: number;
}

export const SuperAdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  const [stats, setStats] = useState<DashboardStats>({
    totalOrganisations: 0,
    totalUsers: 0,
    totalDossiers: 0,
    activeDossiers: 0,
    totalAlerts: 0,
    totalSignalements: 0,
    pendingValidations: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    pendingPhotos: 0,
    confidentialComments: 0,
    totalDocuments: 0,
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
          dossiersResult,
          activeDossiersResult,
          alertsResult,
          signalementsResult,
          pendingResult,
          notificationsResult,
          unreadNotificationsResult,
          pendingPhotosResult,
          confidentialCommentsResult,
          documentsResult,
        ] = await Promise.all([
          (supabase as any).from('organisation').select('id', { count: 'exact', head: true }),
          (supabase as any).from('utilisateur').select('id', { count: 'exact', head: true }),
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }),
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).eq('statut_dossier', 'en_cours'),
          (supabase as any).from('alerte').select('id', { count: 'exact', head: true }),
          (supabase as any).from('signalement').select('id', { count: 'exact', head: true }),
          (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'en_attente'),
          (supabase as any).from('notification').select('id', { count: 'exact', head: true }),
          (supabase as any).from('notification').select('id', { count: 'exact', head: true }).eq('lue', false),
          (supabase as any).from('photo').select('id', { count: 'exact', head: true }).eq('approuvee', false),
          (supabase as any).from('commentaire').select('id', { count: 'exact', head: true }).eq('confidentiel', true),
          (supabase as any).from('document').select('id', { count: 'exact', head: true }),
        ]);

        setStats({
          totalOrganisations: orgResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalDossiers: dossiersResult.count || 0,
          activeDossiers: activeDossiersResult.count || 0,
          totalAlerts: alertsResult.count || 0,
          totalSignalements: signalementsResult.count || 0,
          pendingValidations: pendingResult.count || 0,
          totalNotifications: notificationsResult.count || 0,
          unreadNotifications: unreadNotificationsResult.count || 0,
          pendingPhotos: pendingPhotosResult.count || 0,
          confidentialComments: confidentialCommentsResult.count || 0,
          totalDocuments: documentsResult.count || 0,
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
    { label: t('super_admin.totalDossiers'), value: stats.totalDossiers.toString(), icon: FolderOpen, color: '#f59e0b' },
    { label: t('super_admin.activeDossiers'), value: stats.activeDossiers.toString(), icon: Zap, color: '#ef4444' },
    { label: t('super_admin.totalAlerts'), value: stats.totalAlerts.toString(), icon: Bell, color: '#8b5cf6' },
    { label: t('super_admin.totalSignalements'), value: stats.totalSignalements.toString(), icon: Globe, color: '#06b6d4' },
    { label: t('super_admin.pendingValidations'), value: stats.pendingValidations.toString(), icon: AlertCircle, color: '#f97316' },
    { label: t('super_admin.dashboardNotificationsSystem'), value: stats.totalNotifications.toString(), icon: Bell, color: '#9333ea' },
    { label: t('super_admin.dashboardNotificationsUnread'), value: stats.unreadNotifications.toString(), icon: AlertCircle, color: '#dc2626' },
    { label: t('super_admin.dashboardPhotosPending'), value: stats.pendingPhotos.toString(), icon: Image, color: '#ea580c' },
    { label: t('super_admin.dashboardCommentsConfidential'), value: stats.confidentialComments.toString(), icon: MessageSquare, color: '#7c3aed' },
    { label: t('super_admin.dashboardDocumentsAttached'), value: stats.totalDocuments.toString(), icon: FileText, color: '#0284c7' },
    { label: t('super_admin.systemHealth'), value: '99%', icon: Heart, color: '#0ea5e9' },
  ];

  const quickActions = [
    { title: t('super_admin.viewAllOrganisations'), description: t('super_admin.manageOrganisations'), icon: Building2, onClick: () => navigate('/super-admin/organisations'), primary: true },
    { title: t('super_admin.viewSystemUsers'), description: t('super_admin.manageSystemUsers'), icon: Users, onClick: () => navigate('/super-admin/system-users'), primary: false },
    { title: t('super_admin.manageRoles'), description: t('super_admin.rolesDescription'), icon: Shield, onClick: () => navigate('/super-admin/roles'), primary: false },
    { title: t('super_admin.globalStatistics'), description: t('super_admin.viewGlobalStatistics'), icon: Globe, onClick: () => navigate('/super-admin/global-stats'), primary: false },
    { title: t('super_admin.criticalDossiers'), description: t('super_admin.criticalDossiersDesc'), icon: Zap, onClick: () => navigate('/super-admin/dossiers-critiques'), primary: true },
    { title: t('super_admin.iaResults'), description: t('super_admin.iaResultsDesc'), icon: Brain, onClick: () => navigate('/super-admin/resultats-ia'), primary: false },
    { title: t('super_admin.donations'), description: t('super_admin.donationsDesc'), icon: DollarSign, onClick: () => navigate('/super-admin/dons'), primary: false },
    { title: t('super_admin.campaigns'), description: t('super_admin.campaignsDesc'), icon: Megaphone, onClick: () => navigate('/super-admin/campagnes'), primary: false },
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
            <DashboardSkeleton statCount={12} actionCount={8} listRows={5} />
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
