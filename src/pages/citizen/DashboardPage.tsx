/**
 * =====================================================
 * RETROUVONSLES - Citizen Dashboard Page
 * Dashboard principal pour les citoyens
 * Intégré avec les APIs Supabase
 * =====================================================
 */

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { NomRole } from '../../@types/enums.types';
import { CitizenLayout } from './CitizenLayout';
import { useSignalements } from '../../features/signalements/hooks';
import { useNotifications } from '../../features/notifications/hooks';
import { Plus, Eye, Bell, BarChart3, CheckCircle, Clock, AlertTriangle, Loader2, MapPin } from 'lucide-react';
import styles from './DashboardPage.module.css';

export const CitizenDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;

  // Hooks pour récupérer les vraies données
  const { 
    signalements, 
    isLoading: signalementLoading, 
    fetchSignalements 
  } = useSignalements();
  
  const { 
    notifications, 
    unreadCount,
    isLoading: notificationLoading, 
    fetchNotifications 
  } = useNotifications();

  const isVerified = (currentUser as any)?.role === NomRole.CITOYEN_VERIFIE;
  const isLoading = signalementLoading || notificationLoading;

  // Charger les données au montage
  useEffect(() => {
    if (userId) {
      fetchSignalements();
      fetchNotifications(userId);
    }
  }, [userId, fetchSignalements, fetchNotifications]);

  // Calculer les statistiques réelles
  const computedStats = useMemo(() => {
    const userSignalements = signalements.filter(
      (s: any) => s.utilisateur_id === userId || s.id_utilisateur === userId
    );
    const total = userSignalements.length;
    const approved = userSignalements.filter((s: any) => 
      s.etat === 'valide' || s.statut_validation === 'valide'
    ).length;
    const pending = userSignalements.filter((s: any) => 
      s.etat === 'en_cours' || s.etat === 'nouveau' || s.statut_validation === 'en_attente'
    ).length;

    return { total, approved, pending, alerts: unreadCount };
  }, [signalements, unreadCount, userId]);

  const reliability = useMemo(() => {
    if (!isVerified || computedStats.total === 0) return null;
    const score = Math.round((computedStats.approved / computedStats.total) * 100);
    return Math.max(0, Math.min(100, score));
  }, [computedStats.approved, computedStats.total, isVerified]);

  const stats = [
    {
      label: t('common.totalReports'),
      value: computedStats.total.toString(),
      change: '',
      subtext: t('citizen.myReports'),
      icon: BarChart3,
    },
    {
      label: t('citizen.approved'),
      value: computedStats.approved.toString(),
      change: '',
      subtext: t('citizen.validated'),
      icon: CheckCircle,
    },
    {
      label: t('citizen.underReview'),
      value: computedStats.pending.toString(),
      change: '',
      subtext: t('citizen.inProgress'),
      icon: Clock,
    },
    {
      label: t('common.alerts'),
      value: computedStats.alerts.toString(),
      change: computedStats.alerts > 0 ? t('citizen.new') : '',
      subtext: '',
      icon: AlertTriangle,
    },
    ...(reliability !== null
      ? [{
          label: t('citizen.reliabilityScore'),
          value: `${reliability}%`,
          change: '',
          subtext: t('citizen.reliabilityScoreSubtitle'),
          icon: CheckCircle,
        }]
      : []),
  ];

  const quickActions = [
    {
      title: t('citizen.newReport'),
      description: isVerified ? t('citizen.unlimitedReports') : t('citizen.reportsModerationNoticeShort'),
      icon: Plus,
      onClick: () => navigate('/citizen/dossiers?mode=report'),
      primary: true,
    },
    {
      title: t('common.reports'),
      description: isVerified ? t('citizen.instantValidation') : t('citizen.reportsModerationNoticeShort'),
      icon: Eye,
      onClick: () => navigate('/citizen/my-signalements'),
      primary: false,
    },
    {
      title: t('common.notifications'),
      description: `${unreadCount} ${t('citizen.unread')}`,
      icon: Bell,
      onClick: () => navigate('/citizen/notifications'),
      primary: false,
    },
    {
      title: t('citizen.alertsMap'),
      description: t('citizen.nearbyAlerts'),
      icon: MapPin,
      onClick: () => navigate('/citizen/map'),
      primary: false,
    },
  ];

  // Activités récentes basées sur les vraies notifications
  const recentActivities = useMemo(() => {
    return notifications.slice(0, 5).map((notif: any) => {
      const timeAgo = getTimeAgo(notif.timestamp || notif.created_at, t);
      return {
        title: notif.title || t('common.notification'),
        description: notif.message || '',
        time: timeAgo,
        type: notif.type || 'info',
      };
    });
  }, [notifications, t]);

  // Fonction helper pour calculer le temps écoulé
  function getTimeAgo(date: Date | string, t: any): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('citizen.justNow');
    if (diffMins < 60) return `${diffMins} ${t('citizen.minutesAgo')}`;
    if (diffHours < 24) return `${diffHours} ${t('citizen.hoursAgo')}`;
    if (diffDays < 7) return `${diffDays} ${t('citizen.daysAgo')}`;
    return past.toLocaleDateString('fr-FR');
  }

  return (
    <CitizenLayout activeNav="dashboard">
      <div className={styles.dashboard}>
        {/* Welcome Section */}
        <section className={styles['dashboard__welcome']}>
          <div className={styles['dashboard__welcome-content']}>
            <h1 className={styles['dashboard__welcome-title']}>
              {isVerified ? t('citizen.dashboardSubtitleVerified') : t('citizen.dashboardSubtitle')}
            </h1>
            {!isVerified && (
              <p className={styles['dashboard__welcome-subtitle']}>
                {t('citizen.verifyAccountBenefit')}
              </p>
            )}
          </div>
          {isVerified && (
            <div className={styles['dashboard__verified-badge']}>
              <span>✓ {t('citizen.verified')}</span>
            </div>
          )}
        </section>

        {/* Stats Cards */}
        <div className={styles['dashboard__stats-grid']}>
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className={styles['dashboard__stat-card']}>
                <div className={styles['dashboard__stat-header']}>
                  <div className={styles['dashboard__stat-icon']}>
                    {isLoading ? <Loader2 size={24} className={styles['dashboard__loading-spin']} /> : <Icon size={24} />}
                  </div>
                  <div className={styles['dashboard__stat-content']}>
                    <h3 className={styles['dashboard__stat-value']}>
                      {isLoading ? '...' : stat.value}
                    </h3>
                    <p className={styles['dashboard__stat-label']}>{stat.label}</p>
                  </div>
                </div>
                <p className={styles['dashboard__stat-change']}>
                  {stat.change} {stat.subtext}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className={styles['dashboard__actions-grid']}>
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                className={`${styles['dashboard__action-card']} ${
                  action.primary ? styles['dashboard__action-card--primary'] : ''
                }`}
                onClick={action.onClick}
              >
                <Icon size={32} className={styles['dashboard__action-icon']} />
                <p className={styles['dashboard__action-label']}>{action.title}</p>
                <p className={styles['dashboard__action-description']}>{action.description}</p>
              </button>
            );
          })}
        </div>

        {/* Recent Activity */}
        <section className={styles['dashboard__activity-section']}>
          <h2 className={styles['dashboard__activity-title']}>{t('citizen.recentActivity')}</h2>
          {isLoading ? (
            <div className={styles['dashboard__loading']}>
              <Loader2 size={32} className={styles['dashboard__loading-spin']} />
              <p>{t('common.loading')}</p>
            </div>
          ) : recentActivities.length > 0 ? (
            <ul className={styles['dashboard__activity-list']}>
              {recentActivities.map((activity, idx) => (
                <li key={idx} className={styles['dashboard__activity-item']}>
                  <CheckCircle className={styles['dashboard__activity-icon']} size={20} />
                  <div className={styles['dashboard__activity-content']}>
                    <h4 className={styles['dashboard__activity-item-title']}>{activity.title}</h4>
                    <p className={styles['dashboard__activity-description']}>{activity.description}</p>
                    <p className={styles['dashboard__activity-time']}>{activity.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles['dashboard__empty']}>
              <Bell size={48} className={styles['dashboard__empty-icon']} />
              <p>{t('citizen.noRecentActivity')}</p>
            </div>
          )}
        </section>

        {/* Prevention / Sensibilisation */}
        <section className={styles['dashboard__activity-section']}>
          <h2 className={styles['dashboard__activity-title']}>{t('citizen.preventionTitle')}</h2>
          <ul className={styles['dashboard__activity-list']}>
            <li className={styles['dashboard__activity-item']}>
              <AlertTriangle className={styles['dashboard__activity-icon']} size={20} />
              <div className={styles['dashboard__activity-content']}>
                <h4 className={styles['dashboard__activity-item-title']}>{t('citizen.preventionTip1Title')}</h4>
                <p className={styles['dashboard__activity-description']}>{t('citizen.preventionTip1')}</p>
              </div>
            </li>
            <li className={styles['dashboard__activity-item']}>
              <AlertTriangle className={styles['dashboard__activity-icon']} size={20} />
              <div className={styles['dashboard__activity-content']}>
                <h4 className={styles['dashboard__activity-item-title']}>{t('citizen.preventionTip2Title')}</h4>
                <p className={styles['dashboard__activity-description']}>{t('citizen.preventionTip2')}</p>
              </div>
            </li>
            <li className={styles['dashboard__activity-item']}>
              <AlertTriangle className={styles['dashboard__activity-icon']} size={20} />
              <div className={styles['dashboard__activity-content']}>
                <h4 className={styles['dashboard__activity-item-title']}>{t('citizen.preventionTip3Title')}</h4>
                <p className={styles['dashboard__activity-description']}>{t('citizen.preventionTip3')}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </CitizenLayout>
  );
};