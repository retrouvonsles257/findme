/**
 * =====================================================
 * RETROUVONSLES - SimilaritiesDetection Component
 * Component for similarities detection
 * =====================================================
 */

import React, { useState } from 'react';
import { useIAAnalysis } from '../hooks/useIAAnalysis';
import type { SimilaritiesDetectionProps } from '../types';
import styles from './LocationPrediction.module.css';

export const SimilaritiesDetection: React.FC<SimilaritiesDetectionProps> = ({
  imageId,
  className = '',
}) => {
  const { similaritiesResults, isLoading, error } = useIAAnalysis();
  const [inputImageId, setInputImageId] = useState(imageId || '');
  const [threshold, setThreshold] = useState(70);
  const [maxResults, setMaxResults] = useState(10);

  const handleDetect = async () => {
    if (!inputImageId.trim()) {
      alert('Please provide an image ID');
      return;
    }

    try {
      console.log('Detecting similarities for image:', inputImageId);
      // dispatch logic would go here
      setInputImageId('');
    } catch (err) {
      console.error('Detection failed:', err);
    }
  };

  return (
    <div className={className}>
      <div className={styles.header}>
        <h3>Similarities Detection</h3>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Image ID *</label>
          <input
            type="text"
            placeholder="Enter image ID"
            value={inputImageId}
            onChange={(e) => setInputImageId(e.target.value)}
            disabled={isLoading || !!imageId}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Similarity Threshold: {threshold}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Max Results: {maxResults}</label>
          <input
            type="range"
            min="1"
            max="50"
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <button onClick={handleDetect} disabled={isLoading} className={styles.btnDetect}>
          {isLoading ? 'Detecting...' : 'Detect Similarities'}
        </button>
      </div>

      {similaritiesResults.length > 0 && (
        <div className={styles.results}>
          <h4>Detection Results ({similaritiesResults.length})</h4>
          <ul className={styles.list}>
            {similaritiesResults.slice(0, 5).map((result) => (
              <li key={result.id}>
                <span className={styles.count}>{result.matches.length} matches</span>
                <span className={styles.date}>{new Date(result.analysis_date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
