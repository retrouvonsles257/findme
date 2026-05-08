import React from 'react';
import styles from './PageSkeletons.module.css';

export interface AdminListSkeletonProps {
  /** Nombre de cartes skeleton dans la grille (défaut: 6) */
  cardCount?: number;
  /** Afficher la zone filtres (défaut: true) */
  showFilters?: boolean;
}

export const AdminListSkeleton: React.FC<AdminListSkeletonProps> = ({
  cardCount = 6,
  showFilters = true,
}) => (
  <div className={styles.listRoot}>
    <div className={styles.listHeader}>
      <div className={styles.listHeaderContent}>
        <div className={`${styles.shimmer} ${styles.line} ${styles.lineWide}`} />
        <div className={`${styles.shimmer} ${styles.line} ${styles.lineShort}`} />
      </div>
      <div className={`${styles.shimmer} ${styles.listHeaderBtn}`} />
    </div>

    {showFilters && (
      <div className={styles.listFilters}>
        <div className={`${styles.shimmer} ${styles.listFilterItem}`} />
        <div className={`${styles.shimmer} ${styles.listFilterItem}`} />
        <div className={`${styles.shimmer} ${styles.listFilterItem}`} />
      </div>
    )}

    <div className={styles.listContentCard}>
      <div className={styles.listContentHeader}>
        <div className={`${styles.shimmer} ${styles.listContentTitle}`} />
      </div>
      <div className={styles.listGrid}>
        {Array.from({ length: cardCount }, (_, i) => (
          <div key={`list-skeleton-card-${i}`} className={styles.listCard}>
            <div className={styles.listCardHeader}>
              <div className={`${styles.shimmer} ${styles.listCardTitle}`} />
              <div className={`${styles.shimmer} ${styles.listCardBadge}`} />
            </div>
            <div className={styles.listCardBody}>
              <div className={`${styles.shimmer} ${styles.listCardLine}`} />
              <div className={`${styles.shimmer} ${styles.listCardLine} ${styles.listCardLineShort}`} />
            </div>
            <div className={styles.listCardFooter}>
              <div className={`${styles.shimmer} ${styles.listCardBtn}`} />
              <div className={`${styles.shimmer} ${styles.listCardBtn}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
