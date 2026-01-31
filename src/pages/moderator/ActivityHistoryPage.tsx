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

export const ActivityHistoryPage: React.FC = () => {
  const { t } = useI18n();
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

  // Formater la date avec l'heure
  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Exporter l'historique en CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Action', 'Description', 'ID Signalement'];
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

  // Grouper les activités par date
  const groupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.date_action).toLocaleDateString('fr-FR', {
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

  return (
    <ModerationLayout 
      title={t('moderator.activityHistory') || 'Mon Historique'} 
      activeNav="history"
    >
      <div className={styles.container}>
        {/* Statistiques personnelles */}
        <div className={styles.statsSection}>
          <h3 className={styles.sectionTitle}>
            <BarChart3 size={20} />
            Mes Statistiques
          </h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <History size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.totalActions}</span>
                <span className={styles.statLabel}>Actions totales</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <TrendingUp size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.actionsThisWeek}</span>
                <span className={styles.statLabel}>Cette semaine</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Calendar size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.actionsThisMonth}</span>
                <span className={styles.statLabel}>Ce mois</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Clock size={24} />
              </div>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>{stats.averagePerDay}</span>
                <span className={styles.statLabel}>Moyenne/jour</span>
              </div>
            </div>
          </div>

          {/* Répartition des actions */}
          <div className={styles.breakdownGrid}>
            <div className={styles.breakdownCard}>
              <CheckCircle size={20} className={styles.iconSuccess} />
              <span className={styles.breakdownValue}>{stats.signalementValidations}</span>
              <span className={styles.breakdownLabel}>Validations</span>
            </div>
            <div className={styles.breakdownCard}>
              <XCircle size={20} className={styles.iconDanger} />
              <span className={styles.breakdownValue}>{stats.signalementRejections}</span>
              <span className={styles.breakdownLabel}>Rejets</span>
            </div>
            <div className={styles.breakdownCard}>
              <Image size={20} className={styles.iconInfo} />
              <span className={styles.breakdownValue}>{stats.photoModerations}</span>
              <span className={styles.breakdownLabel}>Photos modérées</span>
            </div>
            <div className={styles.breakdownCard}>
              <UserCheck size={20} className={styles.iconPrimary} />
              <span className={styles.breakdownValue}>{stats.identityVerifications}</span>
              <span className={styles.breakdownLabel}>ID vérifiées</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={styles.filtersSection}>
          <div className={styles.filterGroup}>
            <label>Période:</label>
            <div className={styles.dateFilters}>
              {(['7d', '30d', '90d', 'all'] as DateRange[]).map(range => (
                <button
                  key={range}
                  className={`${styles.filterBtn} ${dateRange === range ? styles.filterBtnActive : ''}`}
                  onClick={() => setDateRange(range)}
                >
                  {range === '7d' ? '7 jours' : 
                   range === '30d' ? '30 jours' : 
                   range === '90d' ? '90 jours' : 'Tout'}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label>Type:</label>
            <div className={styles.typeFilters}>
              <button
                className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter('all')}
              >
                <Filter size={16} /> Tous
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'validation_signalement' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter('validation_signalement')}
              >
                <CheckCircle size={16} /> Signalements
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'upload_photo' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter('upload_photo')}
              >
                <Image size={16} /> Photos
              </button>
              <button
                className={`${styles.filterBtn} ${filter === 'attribution_role' ? styles.filterBtnActive : ''}`}
                onClick={() => setFilter('attribution_role')}
              >
                <UserCheck size={16} /> Identités
              </button>
            </div>
          </div>

          <div className={styles.actionsGroup}>
            <button 
              className={styles.actionBtn}
              onClick={loadActivities}
            >
              <RefreshCw size={18} /> Actualiser
            </button>
            <button 
              className={styles.actionBtn}
              onClick={exportToCSV}
              disabled={activities.length === 0}
            >
              <Download size={18} /> Exporter CSV
            </button>
          </div>
        </div>

        {/* Liste des activités */}
        <div className={styles.activitiesList}>
          <h3 className={styles.sectionTitle}>
            <History size={20} />
            Historique des Actions
          </h3>

          {loading ? (
            <div className={styles.loading}>
              <RefreshCw className={styles.spinner} size={32} />
              <p>Chargement de l'historique...</p>
            </div>
          ) : activities.length === 0 ? (
            <div className={styles.empty}>
              <History size={48} />
              <h3>Aucune activité</h3>
              <p>Vous n'avez pas encore d'actions enregistrées pour cette période.</p>
            </div>
          ) : (
            Object.entries(groupedActivities).map(([date, dayActivities]) => (
              <div key={date} className={styles.dayGroup}>
                <h4 className={styles.dayHeader}>
                  <Calendar size={16} />
                  {date}
                  <span className={styles.dayCount}>{dayActivities.length} action(s)</span>
                </h4>
                <div className={styles.dayActivities}>
                  {dayActivities.map(activity => (
                    <div key={activity.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        {getActionIcon(activity.type_action, activity.action_detaillee)}
                      </div>
                      <div className={styles.activityContent}>
                        <div className={styles.activityHeader}>
                          <span className={styles.activityType}>
                            {activity.type_action.replace(/_/g, ' ')}
                          </span>
                          <span className={styles.activityTime}>
                            {new Date(activity.date_action).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className={styles.activityDetail}>{activity.action_detaillee}</p>
                        {activity.description && (
                          <p className={styles.activityDescription}>{activity.description}</p>
                        )}
                        {activity.id_signalement && (
                          <span className={styles.activityRef}>
                            Signalement: {activity.id_signalement.substring(0, 8)}...
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
    </ModerationLayout>
  );
};

export default ActivityHistoryPage;
