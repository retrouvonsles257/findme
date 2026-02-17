/**
 * =====================================================
 * RETROUVONSLES - Moderator Dashboard Page
 * Dashboard principal pour les modérateurs
 * =====================================================
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useSignalements } from '../../features/signalements/hooks/useSignalements';
import { supabase } from '../../config';
import { ModerationLayout } from './ModerationLayout';
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Award,
  Image,
  UserCheck,
  History,
} from 'lucide-react';
import styles from './DashboardPage.module.css';

// Helper pour Supabase
const db = () => supabase as any;

// Interface pour les stats personnelles
interface PersonalStats {
  totalActions: number;
  actionsToday: number;
  actionsThisWeek: number;
  validations: number;
  rejections: number;
  photosModerees: number;
  identitesVerifiees: number;
}

export const ModerationDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const { signalements, stats, isLoading, fetchSignalements: loadSignalements, fetchStats: loadStats } = useSignalements();
  
  // État pour les statistiques globales supplémentaires
  const [globalStats, setGlobalStats] = useState({
    photosEnAttente: 0,
    identitesEnAttente: 0,
    iaResultsEnAttente: 0,
  });
  
  // État pour les statistiques personnelles
  const [personalStats, setPersonalStats] = useState<PersonalStats>({
    totalActions: 0,
    actionsToday: 0,
    actionsThisWeek: 0,
    validations: 0,
    rejections: 0,
    photosModerees: 0,
    identitesVerifiees: 0,
  });
  const [loadingPersonalStats, setLoadingPersonalStats] = useState(true);

  // Charger les signalements et stats au montage
  useEffect(() => {
    loadSignalements();
    loadStats();
  }, [loadSignalements, loadStats]);

  // Charger les statistiques globales supplémentaires
  const loadGlobalStats = useCallback(async () => {
    try {
      // Photos en attente de modération
      const { count: photosCount } = await db()
        .from('photo')
        .select('*', { count: 'exact', head: true })
        .eq('approuvee', false);

      // Utilisateurs en attente de vérification d'identité
      const { count: identitesCount } = await db()
        .from('utilisateur')
        .select('*', { count: 'exact', head: true })
        .eq('statut_compte', 'en_attente_verification');

      // Résultats IA en attente
      const { count: iaCount } = await db()
        .from('resultat_ia')
        .select('*', { count: 'exact', head: true })
        .eq('statut_validation', 'en_attente');

      setGlobalStats({
        photosEnAttente: photosCount || 0,
        identitesEnAttente: identitesCount || 0,
        iaResultsEnAttente: iaCount || 0,
      });
    } catch (err) {
      console.error('Error loading global stats:', err);
    }
  }, []);

  useEffect(() => {
    loadGlobalStats();
  }, [loadGlobalStats]);

  // Charger les statistiques personnelles
  const loadPersonalStats = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await db()
        .from('journal_activite')
        .select('type_action, action_detaillee, date_action')
        .eq('id_utilisateur', currentUser.id)
        .gte('date_action', weekStart.toISOString());

      if (!error && data) {
        const today = data.filter((a: any) => new Date(a.date_action) >= todayStart);
        
        const validations = data.filter((a: any) => 
          a.type_action === 'validation_signalement' && 
          (a.action_detaillee?.toLowerCase().includes('approuv') || 
           a.action_detaillee?.toLowerCase().includes('valid'))
        );
        
        const rejections = data.filter((a: any) => 
          a.type_action === 'validation_signalement' && 
          (a.action_detaillee?.toLowerCase().includes('rejet') ||
           a.action_detaillee?.toLowerCase().includes('refus'))
        );
        
        const photos = data.filter((a: any) => a.type_action === 'upload_photo');
        const identities = data.filter((a: any) => a.type_action === 'attribution_role');

        setPersonalStats({
          totalActions: data.length,
          actionsToday: today.length,
          actionsThisWeek: data.length,
          validations: validations.length,
          rejections: rejections.length,
          photosModerees: photos.length,
          identitesVerifiees: identities.length,
        });
      }
    } catch (err) {
      console.error('Error loading personal stats:', err);
    } finally {
      setLoadingPersonalStats(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadPersonalStats();
  }, [loadPersonalStats]);

  // Filtrer les signalements en attente de validation
  const pendingSignalements = signalements.filter(
    (s) => s.statut_validation === 'en_attente' || s.statut_validation === 'en_verification'
  );

  // Calcul des stats des 7 derniers jours
  const recentCount = stats?.derniers7jours || 0;

  const statsData = [
    {
      label: t('moderator.totalSignalements'),
      value: stats?.total || 0,
      change: recentCount > 0 ? `+${recentCount}` : '—',
      subtext: recentCount > 0 ? t('moderator.last7Days') : '',
      icon: BarChart3,
    },
    {
      label: t('moderator.pending'),
      value: (stats?.parEtat?.nouveau || 0) + (stats?.parEtat?.en_cours || 0),
      change: pendingSignalements.length > 0 ? `${pendingSignalements.length}` : '—',
      subtext: t('moderator.toReview'),
      icon: Clock,
    },
    {
      label: t('moderator.approved'),
      value: stats?.parEtat?.valide || 0,
      change: '—',
      subtext: '',
      icon: CheckCircle,
    },
    {
      label: t('moderator.rejected'),
      value: stats?.parEtat?.rejete || 0,
      change: '—',
      subtext: '',
      icon: XCircle,
    },
    {
      label: t('moderator.photosToModerate'),
      value: globalStats.photosEnAttente,
      change: globalStats.photosEnAttente > 0 ? `${globalStats.photosEnAttente}` : '—',
      subtext: globalStats.photosEnAttente > 0 ? t('moderator.pending') : '',
      icon: Image,
    },
    {
      label: t('moderator.idVerifications'),
      value: globalStats.identitesEnAttente,
      change: globalStats.identitesEnAttente > 0 ? `${globalStats.identitesEnAttente}` : '—',
      subtext: globalStats.identitesEnAttente > 0 ? t('moderator.pending') : '',
      icon: UserCheck,
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
            {t('common.loading')}
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

            {/* Personal Stats Section */}
            <section className={styles['mod-dashboard__personal-stats']}>
              <div className={styles['mod-dashboard__section-header']}>
                <h2 className={styles['mod-dashboard__section-title']}>
                  <Award size={20} />
                  {t('moderator.personalStats')}
                </h2>
                <button
                  type="button"
                  className={styles['mod-dashboard__view-all']}
                  onClick={() => navigate('/moderator/activity-history')}
                >
                  <History size={16} />
                  {t('moderator.viewHistory')}
                </button>
              </div>

              {loadingPersonalStats ? (
                <div className={styles['mod-dashboard__loading-small']}>
                  {t('common.loading')}
                </div>
              ) : (
                <div className={styles['mod-dashboard__personal-grid']}>
                  <div className={styles['mod-dashboard__personal-card']}>
                    <div className={styles['mod-dashboard__personal-icon']} data-type="today">
                      <TrendingUp size={20} />
                    </div>
                    <div className={styles['mod-dashboard__personal-info']}>
                      <span className={styles['mod-dashboard__personal-value']}>
                        {personalStats.actionsToday}
                      </span>
                      <span className={styles['mod-dashboard__personal-label']}>
                        {t('moderator.actionsToday')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles['mod-dashboard__personal-card']}>
                    <div className={styles['mod-dashboard__personal-icon']} data-type="week">
                      <BarChart3 size={20} />
                    </div>
                    <div className={styles['mod-dashboard__personal-info']}>
                      <span className={styles['mod-dashboard__personal-value']}>
                        {personalStats.actionsThisWeek}
                      </span>
                      <span className={styles['mod-dashboard__personal-label']}>
                        {t('moderator.actionsThisWeek')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles['mod-dashboard__personal-card']}>
                    <div className={styles['mod-dashboard__personal-icon']} data-type="success">
                      <CheckCircle size={20} />
                    </div>
                    <div className={styles['mod-dashboard__personal-info']}>
                      <span className={styles['mod-dashboard__personal-value']}>
                        {personalStats.validations}
                      </span>
                      <span className={styles['mod-dashboard__personal-label']}>
                        {t('moderator.myValidations')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles['mod-dashboard__personal-card']}>
                    <div className={styles['mod-dashboard__personal-icon']} data-type="danger">
                      <XCircle size={20} />
                    </div>
                    <div className={styles['mod-dashboard__personal-info']}>
                      <span className={styles['mod-dashboard__personal-value']}>
                        {personalStats.rejections}
                      </span>
                      <span className={styles['mod-dashboard__personal-label']}>
                        {t('moderator.myRejections')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles['mod-dashboard__personal-card']}>
                    <div className={styles['mod-dashboard__personal-icon']} data-type="info">
                      <Image size={20} />
                    </div>
                    <div className={styles['mod-dashboard__personal-info']}>
                      <span className={styles['mod-dashboard__personal-value']}>
                        {personalStats.photosModerees}
                      </span>
                      <span className={styles['mod-dashboard__personal-label']}>
                        {t('moderator.photosModerated')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles['mod-dashboard__personal-card']}>
                    <div className={styles['mod-dashboard__personal-icon']} data-type="primary">
                      <UserCheck size={20} />
                    </div>
                    <div className={styles['mod-dashboard__personal-info']}>
                      <span className={styles['mod-dashboard__personal-value']}>
                        {personalStats.identitesVerifiees}
                      </span>
                      <span className={styles['mod-dashboard__personal-label']}>
                        {t('moderator.identitiesVerified')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>

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