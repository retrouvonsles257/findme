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
import {
  Building2,
  Users,
  FolderOpen,
  Zap,
  Bell,
  Heart,
  Globe,
  Shield,
  Loader2,
  AlertCircle,
  DollarSign,
  Brain,
  Megaphone,
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
        ] = await Promise.all([
          (supabase as any).from('organisation').select('id', { count: 'exact', head: true }),
          (supabase as any).from('utilisateur').select('id', { count: 'exact', head: true }),
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }),
          (supabase as any).from('dossier_disparition').select('id', { count: 'exact', head: true }).eq('statut_dossier', 'en_cours'),
          (supabase as any).from('alerte').select('id', { count: 'exact', head: true }),
          (supabase as any).from('signalement').select('id', { count: 'exact', head: true }),
          (supabase as any).from('signalement').select('id', { count: 'exact', head: true }).eq('statut_validation', 'en_attente'),
        ]);

        setStats({
          totalOrganisations: orgResult.count || 0,
          totalUsers: usersResult.count || 0,
          totalDossiers: dossiersResult.count || 0,
          activeDossiers: activeDossiersResult.count || 0,
          totalAlerts: alertsResult.count || 0,
          totalSignalements: signalementsResult.count || 0,
          pendingValidations: pendingResult.count || 0,
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
    { label: t('super_admin.totalOrganisations'), value: stats.totalOrganisations.toString(), icon: Building2, color: '#3b82f6' },
    { label: t('super_admin.totalUsers'), value: stats.totalUsers.toString(), icon: Users, color: '#10b981' },
    { label: t('super_admin.totalDossiers'), value: stats.totalDossiers.toString(), icon: FolderOpen, color: '#f59e0b' },
    { label: t('super_admin.activeDossiers'), value: stats.activeDossiers.toString(), icon: Zap, color: '#ef4444' },
    { label: t('super_admin.totalAlerts'), value: stats.totalAlerts.toString(), icon: Bell, color: '#8b5cf6' },
    { label: t('super_admin.totalSignalements') || 'Signalements', value: stats.totalSignalements.toString(), icon: Globe, color: '#06b6d4' },
    { label: t('super_admin.pendingValidations') || 'En attente', value: stats.pendingValidations.toString(), icon: AlertCircle, color: '#f97316' },
    { label: t('super_admin.systemHealth'), value: '99%', icon: Heart, color: '#22c55e' },
  ];

  const quickActions = [
    { title: t('super_admin.viewAllOrganisations'), description: t('super_admin.manageOrganisations'), icon: Building2, onClick: () => navigate('/super-admin/organisations'), primary: true },
    { title: t('super_admin.viewSystemUsers'), description: t('super_admin.manageSystemUsers'), icon: Users, onClick: () => navigate('/super-admin/system-users'), primary: false },
    { title: t('super_admin.manageRoles') || 'Gérer les rôles', description: t('super_admin.rolesDescription') || 'Permissions', icon: Shield, onClick: () => navigate('/super-admin/roles'), primary: false },
    { title: t('super_admin.globalStatistics'), description: t('super_admin.viewGlobalStatistics'), icon: Globe, onClick: () => navigate('/super-admin/global-stats'), primary: false },
    { title: t('super_admin.criticalDossiers') || 'Dossiers critiques', description: t('super_admin.criticalDossiersDesc') || 'Cas urgents', icon: Zap, onClick: () => navigate('/super-admin/dossiers-critiques'), primary: true },
    { title: t('super_admin.iaResults') || 'Résultats IA', description: t('super_admin.iaResultsDesc') || 'Validation', icon: Brain, onClick: () => navigate('/super-admin/resultats-ia'), primary: false },
    { title: t('super_admin.donations') || 'Dons', description: t('super_admin.donationsDesc') || 'Finances', icon: DollarSign, onClick: () => navigate('/super-admin/dons'), primary: false },
    { title: t('super_admin.campaigns') || 'Campagnes', description: t('super_admin.campaignsDesc') || 'Sensibilisation', icon: Megaphone, onClick: () => navigate('/super-admin/campagnes'), primary: false },
  ];

  return (
    <SuperAdminLayout
      title={t('super_admin.dashboardTitle')}
      activeNav="dashboard"
    >
      <div className={styles['sa-dashboard']}>
        {/* Welcome Section */}
        <section className={styles['sa-dashboard__welcome']}>
          <div className={styles['sa-dashboard__welcome-content']}>
            <h1 className={styles['sa-dashboard__welcome-title']}>
              {t('super_admin.dashboardSubtitle')}
            </h1>
            <p className={styles['sa-dashboard__welcome-description']}>
              {t('super_admin.dashboardDescription')}
            </p>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className={styles['sa-dashboard__error']}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className={styles['sa-dashboard__loading']}>
            <Loader2 size={32} className={styles['sa-dashboard__spinner']} />
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className={styles['sa-dashboard__stats-grid']}>
              {statsCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={styles['sa-dashboard__stat-card']}>
                    <div className={styles['sa-dashboard__stat-header']}>
                      <div className={styles['sa-dashboard__stat-icon']} style={{ backgroundColor: `${stat.color}20`, color: stat.color }}>
                        <Icon size={24} />
                      </div>
                      <div className={styles['sa-dashboard__stat-content']}>
                        <h3 className={styles['sa-dashboard__stat-value']}>{stat.value}</h3>
                        <p className={styles['sa-dashboard__stat-label']}>{stat.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <h2 className={styles['sa-dashboard__section-title']}>{t('super_admin.quickActions')}</h2>
            <div className={styles['sa-dashboard__actions-grid']}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    className={`${styles['sa-dashboard__action-card']} ${action.primary ? styles['sa-dashboard__action-card--primary'] : ''}`}
                    onClick={action.onClick}
                  >
                    <Icon size={32} className={styles['sa-dashboard__action-icon']} />
                    <div className={styles['sa-dashboard__action-content']}>
                      <h3 className={styles['sa-dashboard__action-title']}>{action.title}</h3>
                      <p className={styles['sa-dashboard__action-description']}>{action.description}</p>
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
