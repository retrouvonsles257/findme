import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { StatCard } from '../../components/cards/StatCard';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { StatutDossier } from '../../@types/enums.types';
import { NGOLayout } from './NGOLayout';
import styles from './DashboardPage.module.css';

interface NGOStats {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  totalCampaigns: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export const NGODashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id as string | undefined;
  
  const [stats, setStats] = useState<NGOStats>({
    totalCases: 0,
    activeCases: 0,
    resolvedCases: 0,
    totalCampaigns: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        totalCasesRes,
        activeCasesRes,
        resolvedCasesRes,
        campaignsRes,
        logsRes,
      ] = await Promise.all([
        // Dossiers (modèle officiel)
        (supabase.from('dossier_disparition').select('id', { count: 'exact', head: true }) as any),
        (supabase.from('dossier_disparition').select('id', { count: 'exact', head: true }).eq('statut_dossier', StatutDossier.EN_COURS) as any),
        (supabase
          .from('dossier_disparition')
          .select('id', { count: 'exact', head: true })
          .in('statut_dossier', [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE]) as any),
        // Campagnes (modèle officiel)
        (supabase.from('campagne_sensibilisation').select('id', { count: 'exact', head: true }) as any),
        // Activité récente (modèle officiel)
        userId
          ? ((supabase as any)
              .from('journal_activite')
              .select('id, type_action, description, date_action')
              .eq('id_utilisateur', userId)
              .order('date_action', { ascending: false })
              .limit(5) as any)
          : Promise.resolve({ data: [] }),
      ]);

      setStats({
        totalCases: totalCasesRes.count || 0,
        activeCases: activeCasesRes.count || 0,
        resolvedCases: resolvedCasesRes.count || 0,
        totalCampaigns: campaignsRes.count || 0,
      });

      const activities: RecentActivity[] = (logsRes.data || []).map((log: any) => ({
        id: String(log.id),
        type: log.type_action,
        title: log.type_action,
        description: log.description || '',
        timestamp: new Date(log.date_action).toLocaleString('fr-FR'),
        icon: '📋',
      }));

      setRecentActivities(activities);
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [t, userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const quickActions = [
    {
      title: t('ngo.viewAllCases'),
      description: t('ngo.manageCases'),
      icon: '📁',
      action: () => navigate('/ngo/cases'),
      color: '#667eea',
    },
    {
      title: t('ngo.viewCampaigns'),
      description: t('ngo.manageCampaigns'),
      icon: '📢',
      action: () => navigate('/ngo/campagnes'),
      color: '#764ba2',
    },
    {
      title: t('ngo.viewResources'),
      description: t('ngo.manageResources'),
      icon: '📚',
      action: () => navigate('/ngo/resources'),
      color: '#f59e0b',
    },
    {
      title: t('ngo.viewPartnerships'),
      description: t('ngo.managePartnerships'),
      icon: '🤝',
      action: () => navigate('/ngo/partnerships'),
      color: '#10b981',
    },
  ];

  if (loading) {
    return (
      <NGOLayout title={t('ngo.dashboardTitle')}>
        <div className={styles['ngo-dashboard__loading-container']}>
          <div className={styles['ngo-dashboard__spinner']}></div>
          <p>{t('common.loading')}</p>
        </div>
      </NGOLayout>
    );
  }

  return (
    <NGOLayout title={t('ngo.dashboardTitle')}>
      <p className={styles['ngo-dashboard__subtitle']}>{t('ngo.dashboardSubtitle')}</p>

      {error && (
        <div className={styles['ngo-dashboard__error-message']}>
          ⚠️ {error}
        </div>
      )}

        <div className={styles['ngo-dashboard__stats-grid']}>
          <StatCard
            title={t('ngo.totalCases')}
            value={stats.totalCases}
            icon="📁"
            trend={{ value: 5, isPositive: true }}
            color="#667eea"
          />
          <StatCard
            title={t('ngo.activeCases')}
            value={stats.activeCases}
            icon="⚡"
            trend={{ value: 3, isPositive: true }}
            color="#764ba2"
          />
          <StatCard
            title={t('ngo.resolvedCases')}
            value={stats.resolvedCases}
            icon="✓"
            trend={{ value: 2, isPositive: true }}
            color="#10b981"
          />
          <StatCard
            title={t('ngo.totalCampaigns')}
            value={stats.totalCampaigns}
            icon="📢"
            trend={{ value: 1, isPositive: true }}
            color="#f59e0b"
          />
        </div>

        <section className={styles['ngo-dashboard__quick-actions-section']}>
          <h2>{t('common.quickActions')}</h2>
          <div className={styles['ngo-dashboard__quick-actions-grid']}>
            {quickActions.map((action, idx) => (
              <Card key={idx}>
                <CardBody>
                  <div className={styles['ngo-dashboard__action-card']} style={{ borderLeftColor: action.color }}>
                    <div className={styles['ngo-dashboard__action-icon']}>{action.icon}</div>
                    <div className={styles['ngo-dashboard__action-content']}>
                      <h3>{action.title}</h3>
                      <p>{action.description}</p>
                      <button 
                        className={styles['ngo-dashboard__action-button']}
                        onClick={action.action}
                      >
                        {t('common.goTo')} →
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className={styles['ngo-dashboard__activities-section']}>
          <h2>{t('ngo.recentActivities')}</h2>
          <div className={styles['ngo-dashboard__activities-list']}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className={styles['ngo-dashboard__activity-item']}>
                  <span className={styles['ngo-dashboard__activity-icon']}>{activity.icon}</span>
                  <div className={styles['ngo-dashboard__activity-content']}>
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                  </div>
                  <span className={styles['ngo-dashboard__activity-time']}>{activity.timestamp}</span>
                </div>
              ))
            ) : (
              <p className={styles['ngo-dashboard__empty-state']}>{t('ngo.noActivities')}</p>
            )}
          </div>
        </section>
      </NGOLayout>
  );
};
