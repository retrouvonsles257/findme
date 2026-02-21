import React from 'react';
import styles from './AdminSkeletons.module.css';

/**
 * Squelette pour la page Statistiques (NGO / Admin) : header + 4 StatCards + 2 cartes (répartition urgence + activité mensuelle).
 */
export const StatistiquesSkeleton: React.FC = () => (
  <div className={styles.dashboardRoot}>
    <header className={styles.statsPageHeader}>
      <div className={styles.statsPageTitleSection}>
        <div className={`${styles.shimmer} ${styles.statsPageTitle}`} />
        <div className={`${styles.shimmer} ${styles.statsPageSubtitle}`} />
      </div>
      <div className={`${styles.shimmer} ${styles.statsPageExportBtn}`} />
    </header>

    <div className={styles.dashboardStats}>
      <div className={styles.dashboardStatsGrid}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={`stat-${i}`} className={styles.dashboardStatCard}>
            <div className={`${styles.shimmer} ${styles.dashboardStatIcon}`} />
            <div className={styles.dashboardStatContent}>
              <div className={`${styles.shimmer} ${styles.dashboardStatValue}`} />
              <div className={`${styles.shimmer} ${styles.dashboardStatLabel}`} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className={styles.statsChartsRow}>
      <div className={styles.statsChartCard}>
        <div className={`${styles.shimmer} ${styles.statsChartCardTitle}`} />
        <div className={styles.statsChartCardBody}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`${styles.shimmer} ${styles.statsChartCardLine}`} />
          ))}
        </div>
      </div>
      <div className={styles.statsChartCard}>
        <div className={`${styles.shimmer} ${styles.statsChartCardTitle}`} />
        <div className={styles.statsChartCardBody}>
          <div className={`${styles.shimmer} ${styles.statsChartCardRow}`} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`${styles.shimmer} ${styles.statsChartCardRow}`} />
          ))}
        </div>
      </div>
    </div>
  </div>
);
