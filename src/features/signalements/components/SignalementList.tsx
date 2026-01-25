/**
 * =====================================================
 * RETROUVONSLES - SignalementList Component
 * List of signalements with filters
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useSignalements } from '../hooks/useSignalements';
import { getEtatLabel, getEtatColor } from '../services/signalementService';
import styles from './SignalementList.module.css';

export interface SignalementListProps {
  onSelectSignalement?: (id: string) => void;
}

export const SignalementList: React.FC<SignalementListProps> = ({ onSelectSignalement }) => {
  const { signalements, isLoading, error, fetchSignalements } = useSignalements();
  const [filterEtat, setFilterEtat] = useState('');

  useEffect(() => {
    fetchSignalements();
  }, [fetchSignalements]);

  const filtered = filterEtat
    ? signalements.filter((s) => s.etat === filterEtat)
    : signalements;

  if (isLoading) return <div className={styles.loading}>Loading signalements...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Signalements</h2>
        <select
          value={filterEtat}
          onChange={(e) => setFilterEtat(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="nouveau">New</option>
          <option value="en_cours">In Progress</option>
          <option value="valide">Validated</option>
          <option value="rejete">Rejected</option>
          <option value="ferme">Closed</option>
        </select>
      </div>

      <div className={styles.listContainer}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>No signalements found</div>
        ) : (
          <div className={styles.list}>
            {filtered.map((signalement) => (
              <div
                key={signalement.id}
                className={styles.listItem}
                onClick={() => onSelectSignalement?.(signalement.id)}
              >
                <div className={styles.content}>
                  <h3>{signalement.lieu_observation}</h3>
                  <p className={styles.description}>{signalement.description.substring(0, 100)}...</p>
                  <div className={styles.metadata}>
                    <span className={styles.date}>
                      {new Date(signalement.date_observation).toLocaleDateString()}
                    </span>
                    {signalement.score_correspondance && (
                      <span className={styles.score}>
                        Score: {(signalement.score_correspondance * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className={styles.etat}
                  style={{ backgroundColor: getEtatColor(signalement.etat || signalement.statut_validation || 'en_attente') }}
                >
                  {getEtatLabel(signalement.etat || signalement.statut_validation || 'en_attente')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
