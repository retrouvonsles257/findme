import React from 'react';
import styles from './PageSkeletons.module.css';
import { AdminTableSkeleton } from './AdminTableSkeleton';

/**
 * Squelette pour la page Analyse IA : cartes stats + filtres + tableau.
 */
export const IAAnalysisSkeleton: React.FC = () => (
  <div className={styles.iaAnalysisRoot}>
    <div className={styles.dashboardStats}>
      <div className={styles.iaAnalysisStatsGrid}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={`ia-stat-${i}`} className={styles.dashboardStatCard}>
            <div className={`${styles.shimmer} ${styles.dashboardStatIcon}`} />
            <div className={styles.dashboardStatContent}>
              <div className={`${styles.shimmer} ${styles.dashboardStatValue}`} />
              <div className={`${styles.shimmer} ${styles.dashboardStatLabel}`} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.iaAnalysisFilters}>
      <div className={`${styles.shimmer} ${styles.listHeaderBtn}`} style={{ width: 100, height: 36 }} />
      <div className={`${styles.shimmer} ${styles.listFilterItem}`} style={{ width: 120, height: 36 }} />
      <div className={`${styles.shimmer} ${styles.listFilterItem}`} style={{ width: 90, height: 36 }} />
    </div>

    <div className={styles.iaAnalysisTableWrap}>
      <AdminTableSkeleton columns={3} rows={10} />
    </div>
  </div>
);
