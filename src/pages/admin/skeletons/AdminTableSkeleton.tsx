import React from 'react';
import styles from './AdminSkeletons.module.css';

export interface AdminTableSkeletonProps {
  /** Nombre de colonnes (défaut: 5) */
  columns?: number;
  /** Nombre de lignes (défaut: 8) */
  rows?: number;
}

export const AdminTableSkeleton: React.FC<AdminTableSkeletonProps> = ({
  columns = 5,
  rows = 8,
}) => (
  <div className={styles.tableRoot}>
    <div
      className={styles.tableHeader}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {Array.from({ length: columns }, (_, i) => (
        <div
          key={`table-skeleton-header-${i}`}
          className={`${styles.shimmer} ${styles.tableHeaderCell}`}
        />
      ))}
    </div>
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div
        key={`table-skeleton-row-${rowIndex}`}
        className={styles.tableRow}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }, (_, colIndex) => (
          <div
            key={`table-skeleton-cell-${rowIndex}-${colIndex}`}
            className={`${styles.shimmer} ${styles.tableCell}`}
          />
        ))}
      </div>
    ))}
  </div>
);
