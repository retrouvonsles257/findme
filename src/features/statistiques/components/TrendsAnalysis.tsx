/**
 * =====================================================
 * RETROUVONSLES - TrendsAnalysis Component
 * Analysis of trends over time
 * =====================================================
 */

import React from 'react';
import { formatPercentage } from '../services';
import type { TrendsAnalysisProps } from '../types';
import styles from './TrendsAnalysis.module.css';

export const TrendsAnalysis: React.FC<TrendsAnalysisProps> = ({
  data = [],
  isLoading = false,
}) => {
  if (isLoading) return <div style={{ padding: '20px' }}>Chargement...</div>;

  const recent = data.slice(-7).reverse();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Tendances (7 derniers jours)</h3>
      
      {recent.length === 0 ? (
        <div style={{ padding: '20px', color: '#999' }}>Aucune données</div>
      ) : (
        <div className={styles.trendList}>
          {recent.map((trend) => (
            <div key={trend.date} className={styles.trendItem}>
              <div className={styles.date}>{trend.date}</div>
              <div className={styles.stats}>
                <span>{trend.cas_nouveaux} nouveaux</span>
                <span>{formatPercentage(trend.taux_resolution_periode)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};