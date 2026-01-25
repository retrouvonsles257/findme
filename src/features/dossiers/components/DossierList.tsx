/**
 * Dossier List Component
 */

import React from 'react';
import type { DossierDisplayData } from '../types';
import { getRelativeDate } from '../utils';
import styles from './DossierList.module.css';

export interface DossierListProps {
  dossiers: DossierDisplayData[];
  onSelectDossier?: (dossier: DossierDisplayData) => void;
  isLoading?: boolean;
}

export const DossierList: React.FC<DossierListProps> = ({
  dossiers,
  onSelectDossier,
  isLoading = false,
}) => {
  if (isLoading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (dossiers.length === 0) {
    return <div className={styles.empty}>Aucun dossier trouvé</div>;
  }

  return (
    <div className={styles.list}>
      {dossiers.map((dossier) => (
        <div
          key={dossier.id}
          className={styles.item}
          onClick={() => onSelectDossier?.(dossier)}
        >
          <div className={styles.header}>
            <h3>{dossier.numero_dossier}</h3>
            <span className={`${styles.badge} ${styles[`status-${dossier.statut_dossier}`]}`}>
              {dossier.statut_label}
            </span>
          </div>
          <p className={styles.date}>{getRelativeDate(dossier.date_disparition)}</p>
          <p className={styles.circumstances}>{dossier.circonstances?.substring(0, 100)}...</p>
          <div className={styles.footer}>
            <span className={styles.type}>{dossier.type_label}</span>
            <span className={`${styles.urgency} ${styles[`urgency-${dossier.niveau_urgence}`]}`}>
              {dossier.urgence_label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
