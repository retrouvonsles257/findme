/**
 * =====================================================
 * RETROUVONSLES - Moderator Activity History Page
 * Historique personnel des actions du modérateur
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import ModerationLayout from './ModerationLayout';
import {
  History,
  CheckCircle,
  XCircle,
  Image,
  UserCheck,
  AlertTriangle,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Clock,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { AdminListSkeleton } from '../admin/skeletons';
import styles from './ActivityHistoryPage.module.css';

// Helper pour Supabase
const db = () => supabase as any;

// Types
interface ActivityLog {
  id: string;
  type_action: string;
  action_detaillee: string;
  description?: string;
  date_action: string;
  id_signalement?: string;
  id_dossier?: string;
  signalement?: {
    id: string;
    description?: string;
  };
}

interface PersonalStats {
  totalActions: number;
  actionsThisWeek: number;
  actionsThisMonth: number;
  signalementValidations: number;
  signalementRejections: number;
  photoModerations: number;
  identityVerifications: number;
  averagePerDay: number;
}

type FilterType = 'all' | 'validation_signalement' | 'upload_photo' | 'attribution_role' | 'autre';
type DateRange = '7d' | '30d' | '90d' | 'all';

export interface ActivityHistoryPageProps {
  noLayout?: boolean;
}

export const ActivityHistoryPage: React.FC<ActivityHistoryPageProps> = ({ noLayout = false }) => {
  const { t, language } = useI18n();
  const currentUser = useAppSelector(selectUser);

  // State
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [stats, setStats] = useState<PersonalStats>({
    totalActions: 0,
    actionsThisWeek: 0,
    actionsThisMonth: 0,
    signalementValidations: 0,
    signalementRejections: 0,
    photoModerations: 0,
    identityVerifications: 0,
    averagePerDay: 0,
  });

  // Calculer les statistiques personnelles
  const calculateStats = useCallback((data: ActivityLog[]) => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const thisWeek = data.filter(a => new Date(a.date_action) >= oneWeekAgo);
    const thisMonth = data.filter(a => new Date(a.date_action) >= oneMonthAgo);

    const validations = data.filter(a => 
      a.type_action === 'validation_signalement' && 
      (a.action_detaillee?.toLowerCase().includes('approuv') || 
       a.action_detaillee?.toLowerCase().includes('valid'))
    );
    const rejections = data.filter(a => 
      a.type_action === 'validation_signalement' && 
      (a.action_detaillee?.toLowerCase().includes('rejet') ||
       a.action_detaillee?.toLowerCase().includes('refus'))
    );
    const photos = data.filter(a => a.type_action === 'upload_photo');
    const identities = data.filter(a => a.type_action === 'attribution_role');

    // Calculer la moyenne par jour sur les 30 derniers jours
    const daysInRange = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
    const averagePerDay = Math.round((data.length / daysInRange) * 10) / 10;

    setStats({
      totalActions: data.length,
      actionsThisWeek: thisWeek.length,
      actionsThisMonth: thisMonth.length,
      signalementValidations: validations.length,
      signalementRejections: rejections.length,
      photoModerations: photos.length,
      identityVerifications: identities.length,
      averagePerDay,
    });
  }, [dateRange]);

  // Charger l'historique d'activités
  const loadActivities = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      let query = db()
        .from('journal_activite')
        .select(`
          id,
          type_action,
          action_detaillee,
          description,
          date_action,
          id_signalement,
          id_dossier
        `)
        .eq('id_utilisateur', currentUser.id)
        .order('date_action', { ascending: false });

      // Appliquer le filtre de date
      if (dateRange !== 'all') {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
        const fromDate = new Date();
        fromDate.setDate(fromDate.getDate() - days);
        query = query.gte('date_action', fromDate.toISOString());
      }

      // Appliquer le filtre de type
      if (filter !== 'all') {
        query = query.eq('type_action', filter);
      }

      const { data, error } = await query.limit(500);

      if (!error && data) {
        setActivities(data);
        calculateStats(data);
      }
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, filter, dateRange, calculateStats]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Obtenir l'icône selon le type d'action
  const getActionIcon = (typeAction: string, actionDetaillee?: string) => {
    if (typeAction === 'validation_signalement') {
      if (actionDetaillee?.toLowerCase().includes('approuv') || 
          actionDetaillee?.toLowerCase().includes('valid')) {
        return <CheckCircle size={18} className={styles.iconSuccess} />;
      }
      if (actionDetaillee?.toLowerCase().includes('rejet')) {
        return <XCircle size={18} className={styles.iconDanger} />;
      }
      return <AlertTriangle size={18} className={styles.iconWarning} />;
    }
    if (typeAction === 'upload_photo') {
      return <Image size={18} className={styles.iconInfo} />;
    }
    if (typeAction === 'attribution_role') {
      return <UserCheck size={18} className={styles.iconPrimary} />;
    }
    return <History size={18} className={styles.iconDefault} />;
  };

  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Exporter l'historique en CSV (i18n headers)
  const exportToCSV = () => {
    const headers = [t('moderator.csvDate'), t('moderator.csvType'), t('moderator.csvAction'), t('moderator.csvDescription'), t('moderator.csvReportId')];
    const rows = activities.map(a => [
      formatDateTime(a.date_action),
      a.type_action,
      a.action_detaillee || '',
      a.description || '',
      a.id_signalement || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique-moderation-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.date_action).toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, ActivityLog[]>);

  const content = (
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.headerTitle}>
              <History size={28} />
              {t('moderator.activityHistory')}
            </h2>
            <p className={styles.headerSubtitle}>{t('moderator.dashboardDescription')}</p>
          </div>
          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              <span className={styles.toolbarLabel}>{t('moderator.period')}:</span>
              <div className={styles.dateFilters}>
                {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    className={`${styles.toolbarBtn} ${dateRange === range ? styles.toolbarBtnActive : ''}`}
                    onClick={() => setDateRange(range)}
                  >
                    {range === '7d' ? t('moderator.days7') : range === '30d' ? t('moderator.30days') : range === '90d' ? t('moderator.days90') : t('moderator.allTime')}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.toolbarLabel}>{t('moderator.type')}:</span>
              <div className={styles.typeFilters}>
                <button type="button" className={`${styles.toolbarBtn} ${filter === 'all' ? styles.toolbarBtnActive : ''}`} onClick={() => setFilter('all')}>
                  <Filter size={16} /> {t('moderator.allTypes')}
                </button>
                <button type="button" className={`${styles.toolbarBtn} ${filter === 'validation_signalement' ? styles.toolbarBtnActive : ''}`} onClick={() => setFilter('validation_signalement')}>
                  <CheckCircle size={16} /> {t('moderator.reportsFilter')}
                </button>
                <button type="button" className={`${styles.toolbarBtn} ${filter === 'upload_photo' ? styles.toolbarBtnActive : ''}`} onClick={() => setFilter('upload_photo')}>
                  <Image size={16} /> {t('moderator.photos')}
                </button>
                <button type="button" className={`${styles.toolbarBtn} ${filter === 'attribution_role' ? styles.toolbarBtnActive : ''}`} onClick={() => setFilter('attribution_role')}>
                  <UserCheck size={16} /> {t('moderator.identities')}
                </button>
              </div>
            </div>
            <div className={styles.bulkActions}>
              <button type="button" className={styles.toolbarBtn} onClick={loadActivities}>
                <RefreshCw size={18} /> {t('moderator.refresh')}
              </button>
              <button type="button" className={styles.toolbarBtn} onClick={exportToCSV} disabled={activities.length === 0}>
                <Download size={18} /> {t('moderator.exportCsv')}
              </button>
            </div>
          </div>
        </header>

        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>
            <BarChart3 size={20} />
            {t('moderator.myStats')}
          </h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><History size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.totalActions}</span>
                <span className={styles.statLabel}>{t('moderator.totalActions')}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><TrendingUp size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.actionsThisWeek}</span>
                <span className={styles.statLabel}>{t('moderator.thisWeekLabel')}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><Calendar size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.actionsThisMonth}</span>
                <span className={styles.statLabel}>{t('moderator.thisMonthLabel')}</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}><Clock size={24} /></div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.averagePerDay}</span>
                <span className={styles.statLabel}>{t('moderator.averagePerDay')}</span>
              </div>
            </div>
          </div>
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownCard}>
              <CheckCircle size={20} className={styles.iconSuccess} />
              <span className={styles.breakdownValue}>{stats.signalementValidations}</span>
              <span className={styles.breakdownLabel}>{t('moderator.validations')}</span>
            </div>
            <div className={styles.breakdownCard}>
              <XCircle size={20} className={styles.iconDanger} />
              <span className={styles.breakdownValue}>{stats.signalementRejections}</span>
              <span className={styles.breakdownLabel}>{t('moderator.rejections')}</span>
            </div>
            <div className={styles.breakdownCard}>
              <Image size={20} className={styles.iconInfo} />
              <span className={styles.breakdownValue}>{stats.photoModerations}</span>
              <span className={styles.breakdownLabel}>{t('moderator.photosModerated')}</span>
            </div>
            <div className={styles.breakdownCard}>
              <UserCheck size={20} className={styles.iconPrimary} />
              <span className={styles.breakdownValue}>{stats.identityVerifications}</span>
              <span className={styles.breakdownLabel}>{t('moderator.idVerified')}</span>
            </div>
          </div>
        </div>

        <div className={styles.activitiesList}>
          <h3 className={styles.sectionTitle}>
            <History size={20} />
            {t('moderator.historyOfActions')}
          </h3>
          {loading ? (
            <div className={styles.skeletonWrap}>
              <AdminListSkeleton cardCount={6} showFilters={false} />
            </div>
          ) : activities.length === 0 ? (
            <div className={styles.empty}>
              <History size={48} />
              <h3>{t('moderator.noActivity')}</h3>
              <p>{t('moderator.noActivityMessage')}</p>
            </div>
          ) : (
            Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date} className={styles.dayGroup}>
                <h4 className={styles.dayHeader}>
                  <Calendar size={16} />
                  {date}
                  <span className={styles.dayCount}>{t('moderator.actionsCount').replace('{{count}}', String(dayActivities.length))}</span>
                </h4>
                <div className={styles.dayActivities}>
                  {dayActivities.map((activity) => (
                    <div key={activity.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>{getActionIcon(activity.type_action, activity.action_detaillee)}</div>
                      <div className={styles.activityContent}>
                        <div className={styles.activityHeader}>
                          <span className={styles.activityType}>{activity.type_action.replace(/_/g, ' ')}</span>
                          <span className={styles.activityTime}>
                            {new Date(activity.date_action).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className={styles.activityDetail}>{activity.action_detaillee}</p>
                        {activity.description && <p className={styles.activityDescription}>{activity.description}</p>}
                        {activity.id_signalement && (
                          <span className={styles.activityRef}>
                            {t('moderator.reportRef')}: {activity.id_signalement.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
  );

  if (noLayout) return content;

  return (
    <ModerationLayout title={t('moderator.activityHistory')} activeNav="history">
      {content}
    </ModerationLayout>
  );
};

export default ActivityHistoryPage;
