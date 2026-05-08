import React from 'react';
import styles from './PageSkeletons.module.css';

export interface AdminTableSkeletonProps {
  /** Nombre de colonnes (défaut: 5) */
  columns?: number;
  /** Nombre de lignes (défaut: 8) */
  rows?: number;
}

const COL_CLASSES: Record<number, string> = {
  2: styles.tableCols2,
  3: styles.tableCols3,
  4: styles.tableCols4,
  5: styles.tableCols5,
  6: styles.tableCols6,
  7: styles.tableCols7,
  8: styles.tableCols8,
};

export const AdminTableSkeleton: React.FC<AdminTableSkeletonProps> = ({
  columns: cols = 5,
  rows = 8,
}) => {
  const columns = Math.min(Math.max(2, cols), 8);
  const colClass = COL_CLASSES[columns] ?? styles.tableCols5;
  return (
    <div className={`${styles.tableRoot} ${colClass}`}>
      <div className={styles.tableHeader}>
        {Array.from({ length: columns }, (_, i) => (
          <div
            key={`table-skeleton-header-${i}`}
            className={`${styles.shimmer} ${styles.tableHeaderCell}`}
          />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`table-skeleton-row-${rowIndex}`} className={styles.tableRow}>
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
};
