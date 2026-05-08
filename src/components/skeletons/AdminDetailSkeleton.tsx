import React from 'react';
import styles from './PageSkeletons.module.css';

export interface AdminDetailSkeletonProps {
  /** Nombre de blocs d’informations (défaut: 4) */
  blockCount?: number;
  /** Nombre de lignes par bloc (défaut: 4) */
  linesPerBlock?: number;
}

export const AdminDetailSkeleton: React.FC<AdminDetailSkeletonProps> = ({
  blockCount = 4,
  linesPerBlock = 4,
}) => (
  <div className={styles.detailRoot}>
    <div className={`${styles.shimmer} ${styles.detailTitle}`} />

    {Array.from({ length: blockCount }, (_, blockIndex) => (
      <div key={`detail-skeleton-block-${blockIndex}`} className={styles.detailBlock}>
        {Array.from({ length: linesPerBlock }, (_, lineIndex) => {
          const isLast = lineIndex === linesPerBlock - 1;
          const isSecond = lineIndex === 1;
          return (
            <div
              key={`detail-skeleton-line-${blockIndex}-${lineIndex}`}
              className={`${styles.shimmer} ${styles.detailBlockLine} ${
                isLast ? styles.detailBlockLineShort : isSecond ? styles.detailBlockLineMid : ''
              }`}
            />
          );
        })}
      </div>
    ))}
  </div>
);
