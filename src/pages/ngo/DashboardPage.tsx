import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Zap,
  CheckCircle,
  Megaphone,
  BookOpen,
  Handshake,
  ClipboardList,
  AlertTriangle,
  LayoutDashboard,
} from 'lucide-react';
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
  icon: React.ReactNode;
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
        icon: <ClipboardList size={20} />,
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
      icon: FolderOpen,
      action: () => navigate('/ngo/cases'),
      color: '#667eea',
    },
    {
      title: t('ngo.viewCampaigns'),
      description: t('ngo.manageCampaigns'),
      icon: Megaphone,
      action: () => navigate('/ngo/campagnes'),
      color: '#764ba2',
    },
    {
      title: t('ngo.viewResources'),
      description: t('ngo.manageResources'),
      icon: BookOpen,
      action: () => navigate('/ngo/resources'),
      color: '#f59e0b',
    },
    {
      title: t('ngo.viewPartnerships'),
      description: t('ngo.managePartnerships'),
      icon: Handshake,
      action: () => navigate('/ngo/partnerships'),
      color: '#10b981',
    },
  ];

  if (loading) {
    return (
      <NGOLayout>
        <div className={styles.ngoDashboardLoading}>
          <div className={styles.ngoDashboardSpinner} />
          <p>{t('common.loading')}</p>
        </div>
      </NGOLayout>
    );
  }

  return (
    <NGOLayout>
      <div className={styles.ngoDashboard}>
        <header className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <h1 className={styles.pageTitle}>
                <LayoutDashboard size={24} />
                {t('ngo.dashboardTitle')}
              </h1>
              <p className={styles.pageSubtitle}>{t('ngo.dashboardSubtitle')}</p>
            </div>
          </div>
        </header>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <AlertTriangle size={20} className={styles.errorBannerIcon} aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatCard
              title={t('ngo.totalCases')}
              value={stats.totalCases}
              icon={<FolderOpen size={24} />}
              trend={{ value: 5, isPositive: true }}
              color="#1d4ed8"
            />
            <StatCard
              title={t('ngo.activeCases')}
              value={stats.activeCases}
              icon={<Zap size={24} />}
              trend={{ value: 3, isPositive: true }}
              color="#1d4ed8"
            />
            <StatCard
              title={t('ngo.resolvedCases')}
              value={stats.resolvedCases}
              icon={<CheckCircle size={24} />}
              trend={{ value: 2, isPositive: true }}
              color="#22c55e"
            />
            <StatCard
              title={t('ngo.totalCampaigns')}
              value={stats.totalCampaigns}
              icon={<Megaphone size={24} />}
              trend={{ value: 1, isPositive: true }}
              color="#1d4ed8"
            />
          </div>
        </section>

        <section className={styles.quickActionsSection}>
          <h2 className={styles.sectionTitle}>{t('common.quickActions')}</h2>
          <div className={styles.actionsGrid}>
            {quickActions.map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  className={styles.actionCard}
                  onClick={action.action}
                >
                  <div className={styles.actionIcon}>
                    <ActionIcon size={22} />
                  </div>
                  <span className={styles.actionLabel}>{action.title}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.recentSection}>
          <h2 className={styles.sectionTitle}>{t('ngo.recentActivities')}</h2>
          <div className={styles.itemsList}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className={styles.listItem}>
                  <span className={styles.listItemIcon}>{activity.icon}</span>
                  <div className={styles.itemMain}>
                    <p className={styles.itemTitle}>{activity.title}</p>
                    <p className={styles.itemDesc}>{activity.description || '—'}</p>
                  </div>
                  <span className={styles.itemDate}>{activity.timestamp}</span>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>{t('ngo.noActivities')}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </NGOLayout>
  );
};
