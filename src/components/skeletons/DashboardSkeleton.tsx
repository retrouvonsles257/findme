import React from 'react';
import styles from './PageSkeletons.module.css';

export interface DashboardSkeletonProps {
  /** Nombre de cartes stats (défaut: 4) */
  statCount?: number;
  /** Nombre de cartes d'actions rapides (défaut: 4) */
  actionCount?: number;
  /** Nombre de lignes dans la section "activités récentes" (défaut: 5) */
  listRows?: number;
}

/**
 * Squelette type tableau de bord : grille de stats + grille d'actions + liste d'activités.
 */
export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({
  statCount = 4,
  actionCount = 4,
  listRows = 5,
}) => (
  <div className={styles.dashboardRoot}>
    <div className={styles.dashboardHeader}>
      <div className={`${styles.shimmer} ${styles.dashboardHeaderTitle}`} />
      <div className={`${styles.shimmer} ${styles.dashboardHeaderSubtitle}`} />
    </div>

    <section className={styles.dashboardStats}>
      <div className={styles.dashboardStatsGrid}>
        {Array.from({ length: statCount }, (_, i) => (
          <div key={`stat-${i}`} className={styles.dashboardStatCard}>
            <div className={`${styles.shimmer} ${styles.dashboardStatIcon}`} />
            <div className={styles.dashboardStatContent}>
              <div className={`${styles.shimmer} ${styles.dashboardStatValue}`} />
              <div className={`${styles.shimmer} ${styles.dashboardStatLabel}`} />
            </div>
          </div>
        ))}
      </div>
    </section>

    {actionCount > 0 && (
    <section className={styles.dashboardSection}>
      <div className={`${styles.shimmer} ${styles.dashboardSectionTitle}`} />
      <div className={styles.dashboardActionsGrid}>
        {Array.from({ length: actionCount }, (_, i) => (
          <div key={`action-${i}`} className={styles.dashboardActionCard}>
            <div className={`${styles.shimmer} ${styles.dashboardActionIcon}`} />
            <div className={`${styles.shimmer} ${styles.dashboardActionLabel}`} />
          </div>
        ))}
      </div>
    </section>
    )}

    <section className={styles.dashboardSection}>
      <div className={`${styles.shimmer} ${styles.dashboardSectionTitle}`} />
      <div className={styles.dashboardList}>
        {Array.from({ length: listRows }, (_, i) => (
          <div key={`list-${i}`} className={styles.dashboardListItem}>
            <div className={`${styles.shimmer} ${styles.dashboardListIcon}`} />
            <div className={styles.dashboardListContent}>
              <div className={`${styles.shimmer} ${styles.dashboardListTitle}`} />
              <div className={`${styles.shimmer} ${styles.dashboardListDesc}`} />
            </div>
            <div className={`${styles.shimmer} ${styles.dashboardListDate}`} />
          </div>
        ))}
      </div>
    </section>
  </div>
);
