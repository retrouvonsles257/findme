/**
 * =====================================================
 * RETROUVONSLES - ImageComparisonPanel Component
 * Component for image comparison analysis
 * =====================================================
 */

import React, { useState } from 'react';
import { useIAAnalysis } from '../hooks/useIAAnalysis';
import type { ImageComparisonPanelProps } from '../types';
import styles from './ImageComparisonPanel.module.css';

export const ImageComparisonPanel: React.FC<ImageComparisonPanelProps> = ({
  className = '',
}) => {
  const { comparisonResults, isLoading, error } = useIAAnalysis();
  const [image1Id, setImage1Id] = useState('');
  const [image2Id, setImage2Id] = useState('');

  const handleCompare = async () => {
    if (!image1Id.trim() || !image2Id.trim()) {
      alert('Please provide both image IDs');
      return;
    }

    if (image1Id === image2Id) {
      alert('Please provide different image IDs');
      return;
    }

    try {
      // Dispatch would happen here in real implementation

      setImage1Id('');
      setImage2Id('');
    } catch (err) {
      console.error('Comparison failed:', err);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Image Comparison</h3>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Image 1 ID *</label>
            <input
              type="text"
              placeholder="First image ID"
              value={image1Id}
              onChange={(e) => setImage1Id(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Image 2 ID *</label>
            <input
              type="text"
              placeholder="Second image ID"
              value={image2Id}
              onChange={(e) => setImage2Id(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <button onClick={handleCompare} disabled={isLoading} className={styles.btnCompare}>
          {isLoading ? 'Comparing...' : 'Compare Images'}
        </button>
      </div>

      {comparisonResults.length > 0 && (
        <div className={styles.results}>
          <h4>Comparison Results ({comparisonResults.length})</h4>
          <ul className={styles.resultsList}>
            {comparisonResults.slice(0, 5).map((result) => (
              <li key={result.id} className={(result.donnees_interpretees as any)?.is_match ? styles.match : ''}>
                <span className={styles.score}>{result.score_confiance.toFixed(0)}%</span>
                <span className={styles.status}>
                  {(result.donnees_interpretees as any)?.is_match ? '✓ Same Person' : '✗ Different Person'}
                </span>
                <span className={styles.date}>{new Date(result.date_analyse).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
