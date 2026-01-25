/**
 * =====================================================
 * RETROUVONSLES - StatsByRegion Component
 * Regional statistics and distribution
 * =====================================================
 */

import React from 'react';
import { formatPercentage } from '../services';
import type { StatsByRegionProps } from '../types';
import styles from './StatsByRegion.module.css';

export const StatsByRegion: React.FC<StatsByRegionProps> = ({
  stats = [],
  isLoading = false,
  onRegionSelect,
}) => {
  if (isLoading) return <div style={{ padding: '20px' }}>Chargement...</div>;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Statistiques par Région</h3>
      
      {stats.length === 0 ? (
        <div className={styles.empty}>Aucune données régionales</div>
      ) : (
        <div className={styles.regionList}>
          {stats.slice(0, 10).map((region) => (
            <div
              key={region.region}
              className={styles.regionItem}
              onClick={() => onRegionSelect?.(region.region)}
            >
              <div className={styles.regionName}>{region.region}</div>
              <div className={styles.regionStats}>
                <span>{region.nombre_cas} cas</span>
                <span>{formatPercentage(region.taux_resolution)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};