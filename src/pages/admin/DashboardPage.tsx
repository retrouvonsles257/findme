/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Dashboard Page
 * Dashboard principal pour les administrateurs d'organisation
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  FileText,
  Users,
  Plus,
  TrendingUp,
  Activity,
  CheckCircle,
  Clock,
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { useAppSelector } from '../../store/types';
import { DashboardLayout, HeaderAdminOrganisation, SidebarAdminOrganisation } from '../../components/layout';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/cards/StatCard';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { NomRole } from '../../@types/enums.types';

import styles from './DashboardPage.module.css';

interface DashboardStats {
  totalDossiers: number;
  dossiersActifs: number;
  dossiersResolus: number;
  personnesRetrouvees: number;
  rapportsRecents: number;
  utilisateurs: number;
}

export const AdminOrganisationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const currentUser = useAppSelector(selectCurrentUser);
  const [stats, setStats] = useState<DashboardStats>({
    totalDossiers: 0,
    dossiersActifs: 0,
    dossiersResolus: 0,
    personnesRetrouvees: 0,
    rapportsRecents: 0,
    utilisateurs: 0,
  });

  useEffect(() => {
    if (!currentUser || currentUser.role !== NomRole.ADMIN_ORGANISATION) {
      navigate('/auth/login');
      return;
    }

    loadStats();
  }, [currentUser, navigate]);

  const loadStats = async () => {
    try {
      setStats({
        totalDossiers: 24,
        dossiersActifs: 18,
        dossiersResolus: 6,
        personnesRetrouvees: 5,
        rapportsRecents: 12,
        utilisateurs: 8,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const navigationItems = [
    {
      label: t('common.dashboard'),
      href: '/admin/dashboard',
      icon: '📊',
      isActive: true,
    },
    {
      label: t('admin.dossiers'),
      href: '/admin/dossiers',
      icon: '📁',
    },
    {
      label: t('admin.rapports'),
      href: '/admin/rapports',
      icon: '📋',
    },
    {
      label: t('admin.utilisateurs'),
      href: '/admin/utilisateurs',
      icon: '👥',
    },
    {
      label: t('admin.statistiques'),
      href: '/admin/statistiques',
      icon: '📈',
    },
    {
      label: t('admin.parametres'),
      href: '/admin/parametres',
      icon: '⚙️',
    },
  ];

  const quickActions = [
    {
      title: t('admin.newDossier'),
      description: t('admin.createNewFile'),
      icon: Folder,
      action: () => navigate('/admin/dossiers/new'),
    },
    {
      title: t('admin.viewReports'),
      description: t('admin.manageReports'),
      icon: FileText,
      action: () => navigate('/admin/rapports'),
    },
    {
      title: t('admin.manageUsers'),
      description: t('admin.manageTeam'),
      icon: Users,
      action: () => navigate('/admin/utilisateurs'),
    },
  ];

  const recentActivities = [
    {
      type: 'dossier_created',
      title: 'Nouveau dossier créé',
      description: 'Dossier #2024-001 - Jean Dupont',
      time: 'Il y a 2 heures',
      icon: Folder,
    },
    {
      type: 'rapport_updated',
      title: 'Rapport mis à jour',
      description: 'Rapport de recherche pour Mariam Traoré',
      time: 'Il y a 4 heures',
      icon: FileText,
    },
    {
      type: 'personne_found',
      title: 'Personne retrouvée',
      description: 'Amara Diallo - Dossier fermé',
      time: 'Il y a 1 jour',
      icon: CheckCircle,
    },
  ];

  return (
    <DashboardLayout
      sidebar={
        <SidebarAdminOrganisation
          navigationItems={navigationItems}
          currentUser={currentUser}
        />
      }
      header={
        <HeaderAdminOrganisation
          currentUser={currentUser}
          onLogout={() => navigate('/auth/login')}
        />
      }
    >
      <div className={styles.dashboard}>
        {/* Header */}
        <div className={styles.dashboard__header}>
          <div>
            <h1 className={styles.dashboard__title}>
              <LayoutDashboard className={styles.dashboard__titleIcon} />
              {t('admin.dashboard')}
            </h1>
            <p className={styles.dashboard__subtitle}>
              {currentUser?.id ? t('admin.welcomeAdmin') : t('admin.welcome')}
            </p>
          </div>
          <button
            className={styles.dashboard__btnCreate}
            onClick={() => navigate('/admin/dossiers/new')}
          >
            <Plus className={styles.dashboard__btnIcon} />
            {t('admin.newDossier')}
          </button>
        </div>

        {/* Stats Grid */}
        <div className={styles.dashboard__statsGrid}>
          <div className={styles.dashboard__statCard}>
            <div className={styles.dashboard__statIcon} style={{ background: 'rgba(30, 144, 255, 0.1)' }}>
              <Folder style={{ color: '#1d4ed8' }} />
            </div>
            <div className={styles.dashboard__statContent}>
              <p className={styles.dashboard__statLabel}>{t('admin.totalDossiers')}</p>
              <p className={styles.dashboard__statValue}>{stats.totalDossiers}</p>
              <div className={styles.dashboard__statTrend}>
                <TrendingUp className={styles.dashboard__statTrendIcon} />
                <span>+2 ce mois</span>
              </div>
            </div>
          </div>

          <div className={styles.dashboard__statCard}>
            <div className={styles.dashboard__statIcon} style={{ background: 'rgba(251, 191, 36, 0.1)' }}>
              <Clock style={{ color: '#d97706' }} />
            </div>
            <div className={styles.dashboard__statContent}>
              <p className={styles.dashboard__statLabel}>{t('admin.activeDossiers')}</p>
              <p className={styles.dashboard__statValue}>{stats.dossiersActifs}</p>
              <div className={styles.dashboard__statTrend}>
                <Activity className={styles.dashboard__statTrendIcon} />
                <span>En cours</span>
              </div>
            </div>
          </div>

          <div className={styles.dashboard__statCard}>
            <div className={styles.dashboard__statIcon} style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
              <CheckCircle style={{ color: '#16a34a' }} />
            </div>
            <div className={styles.dashboard__statContent}>
              <p className={styles.dashboard__statLabel}>{t('admin.resolvedDossiers')}</p>
              <p className={styles.dashboard__statValue}>{stats.dossiersResolus}</p>
              <div className={styles.dashboard__statTrend}>
                <TrendingUp className={styles.dashboard__statTrendIcon} />
                <span>+1 ce mois</span>
              </div>
            </div>
          </div>

          <div className={styles.dashboard__statCard}>
            <div className={styles.dashboard__statIcon} style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
              <UserCheck style={{ color: '#9333ea' }} />
            </div>
            <div className={styles.dashboard__statContent}>
              <p className={styles.dashboard__statLabel}>{t('admin.foundPersons')}</p>
              <p className={styles.dashboard__statValue}>{stats.personnesRetrouvees}</p>
              <div className={styles.dashboard__statTrend}>
                <CheckCircle className={styles.dashboard__statTrendIcon} />
                <span>Retrouvées</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={styles.dashboard__section}>
          <h2 className={styles.dashboard__sectionTitle}>⚡ {t('admin.quickActions')}</h2>
          <div className={styles.dashboard__actionsGrid}>
            {quickActions.map((action, idx) => {
              const IconComponent = action.icon;
              return (
                <div
                  key={idx}
                  className={styles.dashboard__actionCard}
                  onClick={action.action}
                >
                  <div className={styles.dashboard__actionIcon}>
                    <IconComponent />
                  </div>
                  <h3 className={styles.dashboard__actionTitle}>{action.title}</h3>
                  <p className={styles.dashboard__actionDescription}>
                    {action.description}
                  </p>
                  <button className={styles.dashboard__actionBtn}>
                    {t('common.access')}
                    <ArrowRight className={styles.dashboard__actionBtnIcon} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Overview */}
        <div className={styles.dashboard__overview}>
          <div className={styles.dashboard__overviewLeft}>
            <h2 className={styles.dashboard__sectionTitle}>
              📈 {t('admin.recentActivity')}
            </h2>
            <div className={styles.dashboard__activityCard}>
              <div className={styles.dashboard__activityList}>
                {recentActivities.map((activity, idx) => {
                  const IconComponent = activity.icon;
                  return (
                    <div key={idx} className={styles.dashboard__activityItem}>
                      <div className={styles.dashboard__activityIconWrapper}>
                        <IconComponent className={styles.dashboard__activityIcon} />
                      </div>
                      <div className={styles.dashboard__activityContent}>
                        <h4 className={styles.dashboard__activityTitle}>
                          {activity.title}
                        </h4>
                        <p className={styles.dashboard__activityDescription}>
                          {activity.description}
                        </p>
                        <span className={styles.dashboard__activityTime}>
                          {activity.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.dashboard__overviewRight}>
            <h2 className={styles.dashboard__sectionTitle}>📋 {t('admin.summary')}</h2>
            <div className={styles.dashboard__summaryCard}>
              <div className={styles.dashboard__summaryItem}>
                <span className={styles.dashboard__summaryLabel}>
                  {t('admin.totalUsers')}
                </span>
                <span className={styles.dashboard__summaryValue}>
                  {stats.utilisateurs}
                </span>
              </div>
              <div className={styles.dashboard__summaryDivider} />
              <div className={styles.dashboard__summaryItem}>
                <span className={styles.dashboard__summaryLabel}>
                  {t('admin.recentReports')}
                </span>
                <span className={styles.dashboard__summaryValue}>
                  {stats.rapportsRecents}
                </span>
              </div>
              <div className={styles.dashboard__summaryDivider} />
              <div className={styles.dashboard__summaryItem}>
                <span className={styles.dashboard__summaryLabel}>
                  {t('admin.successRate')}
                </span>
                <span className={styles.dashboard__summaryValue}>
                  {Math.round((stats.personnesRetrouvees / stats.dossiersResolus) * 100) || 0}%
                </span>
              </div>
              <div className={styles.dashboard__summaryDivider} />
              <button
                className={styles.dashboard__summaryBtn}
                onClick={() => navigate('/admin/statistiques')}
              >
                {t('admin.viewDetailedStats')}
                <ArrowRight className={styles.dashboard__actionBtnIcon} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrganisationDashboardPage;