import React from 'react';
import { Folder, Clock, CheckCircle, UserCheck } from 'lucide-react';
import type { AdminDashboardStats } from '../../../features/admin-organisation/services';

interface DashboardStatsGridProps {
  styles: Record<string, string>;
  stats: AdminDashboardStats;
  t: (key: string) => string;
}

const defaultStats: AdminDashboardStats = {
  totalDossiers: 0,
  dossiersActifs: 0,
  dossiersResolus: 0,
  personnesRetrouvees: 0,
  rapportsRecents: 0,
  utilisateurs: 0,
  newDossiersThisMonth: 0,
  resolvedThisMonth: 0,
};

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({
  styles,
  stats = defaultStats,
  t,
}) => (
  <div className={styles.dashboard__statsGrid}>
    <div className={styles.dashboard__statCard}>
      <div className={styles.dashboard__statHeader}>
        <div className={styles.dashboard__statIcon}>
          <Folder size={24} />
        </div>
        <div className={styles.dashboard__statContent}>
          <p className={styles.dashboard__statValue}>{stats.totalDossiers}</p>
          <p className={styles.dashboard__statLabel}>{t('admin.totalDossiers')}</p>
          {typeof stats.newDossiersThisMonth === 'number' && stats.newDossiersThisMonth > 0 && (
            <p className={styles.dashboard__statChange}>
              +{stats.newDossiersThisMonth} {t('admin.trendThisMonth')}
            </p>
          )}
        </div>
      </div>
    </div>
    <div className={styles.dashboard__statCard}>
      <div className={styles.dashboard__statHeader}>
        <div className={`${styles.dashboard__statIcon} ${styles.dashboard__statIconWarning}`}>
          <Clock size={24} />
        </div>
        <div className={styles.dashboard__statContent}>
          <p className={styles.dashboard__statValue}>{stats.dossiersActifs}</p>
          <p className={styles.dashboard__statLabel}>{t('admin.activeDossiers')}</p>
          <p className={styles.dashboard__statChange}>{t('admin.trendInProgress')}</p>
        </div>
      </div>
    </div>
    <div className={styles.dashboard__statCard}>
      <div className={styles.dashboard__statHeader}>
        <div className={`${styles.dashboard__statIcon} ${styles.dashboard__statIconSuccess}`}>
          <CheckCircle size={24} />
        </div>
        <div className={styles.dashboard__statContent}>
          <p className={styles.dashboard__statValue}>{stats.dossiersResolus}</p>
          <p className={styles.dashboard__statLabel}>{t('admin.resolvedDossiers')}</p>
          {typeof stats.resolvedThisMonth === 'number' && stats.resolvedThisMonth > 0 && (
            <p className={styles.dashboard__statChange}>
              +{stats.resolvedThisMonth} {t('admin.trendThisMonth')}
            </p>
          )}
        </div>
      </div>
    </div>
    <div className={styles.dashboard__statCard}>
      <div className={styles.dashboard__statHeader}>
        <div className={`${styles.dashboard__statIcon} ${styles.dashboard__statIconPurple}`}>
          <UserCheck size={24} />
        </div>
        <div className={styles.dashboard__statContent}>
          <p className={styles.dashboard__statValue}>{stats.personnesRetrouvees}</p>
          <p className={styles.dashboard__statLabel}>{t('admin.foundPersons')}</p>
          <p className={styles.dashboard__statChange}>{t('admin.trendFound')}</p>
        </div>
      </div>
    </div>
  </div>
);
