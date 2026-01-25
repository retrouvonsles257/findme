import React from 'react';
import type { DossierDisplayData } from '../types';
import styles from './DossierTimeline.module.css';

export interface DossierTimelineProps {
  dossier: DossierDisplayData;
}

export const DossierTimeline: React.FC<DossierTimelineProps> = ({ dossier }) => (
  <div className={styles.timeline}>
    <h3>Chronologie</h3>
    <div className={styles.event}>
      <span className={styles.date}>{dossier.date_disparition}</span>
      <p>Disparition</p>
    </div>
    {dossier.date_resolution && (
      <div className={styles.event}>
        <span className={styles.date}>{dossier.date_resolution}</span>
        <p>Résolution</p>
      </div>
    )}
  </div>
);
