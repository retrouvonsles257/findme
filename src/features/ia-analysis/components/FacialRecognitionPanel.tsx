/**
 * =====================================================
 * RETROUVONSLES - FacialRecognitionPanel Component
 * Component for facial recognition analysis
 * =====================================================
 */

import React, { useState } from 'react';
import { useFacialRecognition } from '../hooks/useFacialRecognition';
import type { FacialRecognitionPanelProps } from '../types';
import styles from './FacialRecognitionPanel.module.css';

export const FacialRecognitionPanel: React.FC<FacialRecognitionPanelProps> = ({
  className = '',
  onAnalysisComplete,
}) => {
  const { results, currentAnalysis, analyzeFacial, isLoading, error } = useFacialRecognition();
  const [imageId, setImageId] = useState('');
  const [personId, setPersonId] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(70);

  const handleAnalyze = async () => {
    if (!imageId.trim()) {
      alert('Please provide an image ID');
      return;
    }

    try {
      const result = await analyzeFacial({
        image_id: imageId,
        person_id: personId || undefined,
        confidence_threshold: confidenceThreshold,
      });

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

      setImageId('');
      setPersonId('');
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Facial Recognition Analysis</h3>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Image ID *</label>
          <input
            type="text"
            placeholder="Enter image ID"
            value={imageId}
            onChange={(e) => setImageId(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Person ID (Optional)</label>
          <input
            type="text"
            placeholder="Enter person ID"
            value={personId}
            onChange={(e) => setPersonId(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Confidence Threshold: {confidenceThreshold}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <button onClick={handleAnalyze} disabled={isLoading} className={styles.btnAnalyze}>
          {isLoading ? 'Analyzing...' : 'Analyze Facial'}
        </button>
      </div>

      {currentAnalysis && (
        <div className={styles.result}>
          <h4>Current Analysis</h4>
          <div className={styles.resultContent}>
            <p>
              <strong>Confidence:</strong> {currentAnalysis.facial_features.confidence_facial.toFixed(2)}%
            </p>
            <p>
              <strong>Face Quality:</strong> {currentAnalysis.facial_features.face_quality.toFixed(2)}%
            </p>
            {currentAnalysis.best_match && (
              <p>
                <strong>Best Match:</strong> {currentAnalysis.best_match.person_id} (
                {currentAnalysis.best_match.similarity.toFixed(2)}%)
              </p>
            )}
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className={styles.history}>
          <h4>Recent Analyses ({results.length})</h4>
          <ul className={styles.resultsList}>
            {results.slice(0, 5).map((result) => (
              <li key={result.id}>
                <span>{new Date(result.analysis_date).toLocaleDateString()}</span>
                <span className={styles.badge}>{result.facial_features.confidence_facial.toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
