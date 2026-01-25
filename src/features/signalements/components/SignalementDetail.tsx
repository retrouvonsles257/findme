/**
 * =====================================================
 * RETROUVONSLES - SignalementDetail Component
 * Detailed view of a signalement
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useSignalementDetail } from '../hooks/useSignalementDetail';
import { getEtatLabel, getEtatColor } from '../services/signalementService';
import styles from './SignalementDetail.module.css';

export interface SignalementDetailProps {
  signalementId: string;
}

export const SignalementDetail: React.FC<SignalementDetailProps> = ({ signalementId }) => {
  const { signalement, isLoading, error, fetchSignalement } = useSignalementDetail();

  useEffect(() => {
    if (signalementId) {
      fetchSignalement(signalementId);
    }
  }, [signalementId, fetchSignalement]);

  if (isLoading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!signalement) return <div className={styles.notFound}>Signalement not found</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{signalement.lieu_observation || 'Lieu non spécifié'}</h2>
        <div
          className={styles.etat}
          style={{ backgroundColor: getEtatColor(signalement.etat || signalement.statut_validation) }}
        >
          {getEtatLabel(signalement.etat || signalement.statut_validation)}
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h3>Location</h3>
          <p>{signalement.lieu_observation || signalement.ville_observation || 'Non spécifié'}</p>
          {(signalement.latitude_observation || signalement.latitude) && (
            <p className={styles.coordinates}>
              {(signalement.latitude_observation || signalement.latitude)?.toFixed(4)}, {(signalement.longitude_observation || signalement.longitude)?.toFixed(4)}
            </p>
          )}
        </div>

        <div className={styles.section}>
          <h3>Sighting Details</h3>
          <p>
            <strong>Date:</strong> {new Date(signalement.date_observation).toLocaleDateString()}
          </p>
        </div>

        {(signalement.score_correspondance || signalement.score_pertinence) && (
          <div className={styles.section}>
            <h3>Match Score</h3>
            <div className={styles.scoreBar}>
              <div
                className={styles.scoreFill}
                style={{ width: `${(signalement.score_correspondance || signalement.score_pertinence || 0) * 100}%` }}
              />
            </div>
            <p>{((signalement.score_correspondance || signalement.score_pertinence || 0) * 100).toFixed(1)}%</p>
          </div>
        )}
      </div>

      <div className={styles.description}>
        <h3>Description</h3>
        <p>{signalement.description}</p>
      </div>

      {signalement.notes && (
        <div className={styles.notes}>
          <h3>Notes</h3>
          <p>{signalement.notes}</p>
        </div>
      )}
    </div>
  );
};
