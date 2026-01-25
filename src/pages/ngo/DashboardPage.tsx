import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../../components/common/Card';
import { StatCard } from '../../components/cards/StatCard';
import { useI18n } from '../../hooks';
import { supabase } from '../../config/supabase.config';
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

      const [casesRes, campaignsRes, logsRes] = await Promise.all([
        (supabase.from('dossiers').select('*') as any),
        (supabase.from('campagnes').select('id', { count: 'exact', head: true }) as any),
        (supabase.from('audit_logs').select('*').eq('entity_type', 'ngo').limit(5) as any),
      ]);

      const casesData = casesRes.data || [];
      const activeCases = casesData.filter((c: any) => c.statut === 'active').length;
      const resolvedCases = casesData.filter((c: any) => c.statut === 'resolved').length;

      setStats({
        totalCases: casesData.length,
        activeCases,
        resolvedCases,
        totalCampaigns: campaignsRes.count || 0,
      });

      const activities: RecentActivity[] = (logsRes.data || []).map((log: any) => ({
        id: log.id,
        type: log.action_type,
        title: log.action_type,
        description: log.description || '',
        timestamp: new Date(log.timestamp).toLocaleString('fr-FR'),
        icon: '📋',
      }));

      setRecentActivities(activities);
    } catch (err) {
      console.error('Erreur:', err);
      setError(t('common.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  }, [t]);

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
      action: () => navigate('/ngo/campaigns'),
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
