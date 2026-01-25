/**
 * =====================================================
 * RETROUVONSLES - PersonneHistory Component
 * Display person history and timeline
 * =====================================================
 */

import React from 'react';
import type { Personne } from '../types';
import styles from './PersonneHistory.module.css';

export interface PersonneHistoryProps {
  personne: Personne;
}

/**
 * PersonneHistory component
 */
export const PersonneHistory: React.FC<PersonneHistoryProps> = ({ personne }) => {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString();
  };

  return (
    <div className={styles.container}>
      <h2>History</h2>

      <div className={styles.timeline}>
        {personne.created_at && (
          <div className={styles.timelineItem}>
            <div className={styles.timelineMarker}>
              <div className={styles.dot} />
            </div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineTitle}>Created</h3>
              <p className={styles.timelineDate}>{formatDate(personne.created_at)}</p>
              {personne.cree_par && (
                <p className={styles.timelineDetail}>
                  <span className={styles.label}>Created by:</span> {personne.cree_par}
                </p>
              )}
            </div>
          </div>
        )}

        {personne.updated_at && personne.updated_at !== personne.created_at && (
          <div className={styles.timelineItem}>
            <div className={styles.timelineMarker}>
              <div className={styles.dot} />
            </div>
            <div className={styles.timelineContent}>
              <h3 className={styles.timelineTitle}>Last Updated</h3>
              <p className={styles.timelineDate}>{formatDate(personne.updated_at)}</p>
            </div>
          </div>
        )}

        {!personne.created_at && !personne.updated_at && (
          <div className={styles.empty}>No history available</div>
        )}
      </div>
    </div>
  );
};
