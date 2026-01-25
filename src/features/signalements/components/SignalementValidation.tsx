/**
 * =====================================================
 * RETROUVONSLES - SignalementValidation Component
 * Validate/review signalements
 * =====================================================
 */

import React, { useState } from 'react';
import { useSignalementValidation } from '../hooks/useSignalementValidation';
import styles from './SignalementValidation.module.css';

export interface SignalementValidationProps {
  signalementId: string;
  verificateurId: string;
  onSuccess?: () => void;
}

export const SignalementValidation: React.FC<SignalementValidationProps> = ({
  signalementId,
  verificateurId,
  onSuccess,
}) => {
  const { isLoading, error, success, validateSignalement, reset } = useSignalementValidation();
  const [decision, setDecision] = useState<'approuve' | 'rejete' | 'besoin_clarification'>('approuve');
  const [raison, setRaison] = useState('');
  const [score, setScore] = useState(0.5);
  const [avis, setAvis] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();

    try {
      await validateSignalement(signalementId, verificateurId, {
        decision,
        raison,
        score_confiance: score,
        avis,
      });
      onSuccess?.();
      setRaison('');
      setScore(0.5);
      setAvis('');
    } catch (err) {
      console.error('Error validating signalement:', err);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Validate Signalement</h2>

      {success && <div className={styles.success}>Validation submitted successfully!</div>}
      {error && <div className={styles.error}>Error: {error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="decision">Decision</label>
          <select
            id="decision"
            value={decision}
            onChange={(e) => setDecision(e.target.value as any)}
            required
          >
            <option value="approuve">Approved</option>
            <option value="rejete">Rejected</option>
            <option value="besoin_clarification">Needs Clarification</option>
          </select>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="raison">Reason</label>
          <textarea
            id="raison"
            value={raison}
            onChange={(e) => setRaison(e.target.value)}
            required
            rows={3}
            placeholder="Explain your decision..."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="score">Confidence Score: {(score * 100).toFixed(0)}%</label>
          <input
            id="score"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={score}
            onChange={(e) => setScore(parseFloat(e.target.value))}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="avis">Additional Opinion (optional)</label>
          <textarea
            id="avis"
            value={avis}
            onChange={(e) => setAvis(e.target.value)}
            rows={3}
            placeholder="Any additional comments..."
          />
        </div>

        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Validation'}
        </button>
      </form>
    </div>
  );
};
