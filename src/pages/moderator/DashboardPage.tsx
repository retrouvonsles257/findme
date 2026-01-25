/**
 * =====================================================
 * RETROUVONSLES - Moderator Dashboard Page
 * Dashboard principal pour les modérateurs
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { ModerationLayout } from './ModerationLayout';
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import styles from './DashboardPage.module.css';

export const ModerationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const { signalements, stats, isLoading } = useSignalements();

  // Filtrer les signalements en attente de validation
  const pendingSignalements = signalements.filter(
    (s) => s.etat === 'nouveau' || s.etat === 'en_cours'
  );

  const statsData = [
    {
      label: t('moderator.totalSignalements'),
      value: stats?.total || 0,
      change: '+5',
      subtext: t('moderator.thisMonth'),
      icon: BarChart3,
    },
    {
      label: t('moderator.pending'),
      value: pendingSignalements.length,
      change: '—',
      subtext: '',
      icon: Clock,
    },
    {
      label: t('moderator.approved'),
      value: stats?.parEtat?.valide || 0,
      change: '+2',
      subtext: t('moderator.thisWeek'),
      icon: CheckCircle,
    },
    {
      label: t('moderator.rejected'),
      value: stats?.parEtat?.rejete || 0,
      change: '—',
      subtext: '',
      icon: XCircle,
    },
  ];

  const quickActions = [
    {
      title: t('moderator.validateReports'),
      description: t('moderator.validateDescription'),
      icon: CheckCircle,
      onClick: () => navigate('/moderator/signalements-validation'),
      primary: true,
    },
    {
      title: t('moderator.photoModeration'),
      description: t('moderator.photoDescription'),
      icon: AlertCircle,
      onClick: () => navigate('/moderator/photos-moderation'),
      primary: false,
    },
    {
      title: t('moderator.reports'),
      description: t('moderator.reportsDescription'),
      icon: BarChart3,
      onClick: () => navigate('/moderator/reports'),
      primary: false,
    },
  ];

  return (
    <ModerationLayout title={t('common.dashboard')} activeNav="dashboard">
      <div className={styles['mod-dashboard']}>
        {/* Welcome Section */}
        <section className={styles['mod-dashboard__welcome']}>
          <div className={styles['mod-dashboard__welcome-content']}>
            <h1 className={styles['mod-dashboard__welcome-title']}>
              {t('moderator.dashboardSubtitle')}
            </h1>
            <p className={styles['mod-dashboard__welcome-subtitle']}>
              {t('moderator.dashboardDescription')}
            </p>
          </div>
        </section>

        {/* Stats Cards */}
        {isLoading ? (
          <div className={styles['mod-dashboard__loading']}>
            {t('common.loading')}...
          </div>
        ) : (
          <>
            <div className={styles['mod-dashboard__stats-grid']}>
              {statsData.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className={styles['mod-dashboard__stat-card']}>
                    <div className={styles['mod-dashboard__stat-header']}>
                      <div className={styles['mod-dashboard__stat-icon']}>
                        <Icon size={24} />
                      </div>
                      <div className={styles['mod-dashboard__stat-content']}>
                        <h3 className={styles['mod-dashboard__stat-value']}>
                          {stat.value}
                        </h3>
                        <p className={styles['mod-dashboard__stat-label']}>
                          {stat.label}
                        </p>
                      </div>
                    </div>
                    <p className={styles['mod-dashboard__stat-change']}>
                      {stat.change} {stat.subtext}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className={styles['mod-dashboard__actions-grid']}>
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    className={`${styles['mod-dashboard__action-card']} ${
                      action.primary ? styles['mod-dashboard__action-card--primary'] : ''
                    }`}
                    onClick={action.onClick}
                  >
                    <Icon size={32} className={styles['mod-dashboard__action-icon']} />
                    <div className={styles['mod-dashboard__action-content']}>
                      <h3 className={styles['mod-dashboard__action-title']}>
                        {action.title}
                      </h3>
                      <p className={styles['mod-dashboard__action-description']}>
                        {action.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Recent Activity */}
            {pendingSignalements.length > 0 && (
              <section className={styles['mod-dashboard__recent']}>
                <h2 className={styles['mod-dashboard__recent-title']}>
                  {t('moderator.recentActivity')}
                </h2>
                <div className={styles['mod-dashboard__activity-list']}>
                  {pendingSignalements.slice(0, 5).map((signal) => (
                    <div
                      key={signal.id}
                      className={styles['mod-dashboard__activity-item']}
                    >
                      <div className={styles['mod-dashboard__activity-icon']}>
                        <AlertCircle size={20} />
                      </div>
                      <div className={styles['mod-dashboard__activity-content']}>
                        <p className={styles['mod-dashboard__activity-title']}>
                          {signal.description?.substring(0, 50)}...
                        </p>
                        <p className={styles['mod-dashboard__activity-meta']}>
                          {signal.lieu_observation}
                        </p>
                      </div>
                      <button
                        className={styles['mod-dashboard__activity-action']}
                        onClick={() => navigate('/moderator/signalements-validation')}
                      >
                        {t('common.view')}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </ModerationLayout>
  );
};

export default ModerationDashboardPage;