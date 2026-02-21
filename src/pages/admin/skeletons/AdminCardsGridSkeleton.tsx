import React from 'react';
import styles from './AdminSkeletons.module.css';

export interface AdminCardsGridSkeletonProps {
  /** Nombre de cartes skeleton dans la grille (défaut: 6) */
  cardCount?: number;
}

/**
 * Squelette grille de cartes uniquement (sans en-tête ni filtres).
 * À utiliser sur les pages qui ont déjà leur propre header/stats/filtres
 * et affichent une grille de cartes (ex: Alertes, Signalements).
 * Évite la fausse attente d'une "liste" alors que le contenu est des cards.
 */
export const AdminCardsGridSkeleton: React.FC<AdminCardsGridSkeletonProps> = ({
  cardCount = 6,
}) => (
  <div className={styles.listGrid} style={{ width: '100%', minWidth: 0 }}>
    {Array.from({ length: cardCount }, (_, i) => (
      <div key={`cards-grid-skeleton-${i}`} className={styles.listCard}>
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
);
