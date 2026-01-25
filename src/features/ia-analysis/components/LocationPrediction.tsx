/**
 * =====================================================
 * RETROUVONSLES - LocationPrediction Component
 * Component for location prediction display
 * =====================================================
 */

import React, { useState } from 'react';
import { useLocationPrediction } from '../hooks/useLocationPrediction';
import type { LocationPredictionProps } from '../types';
import styles from './LocationPrediction.module.css';

export const LocationPrediction: React.FC<LocationPredictionProps> = ({
  personId,
  className = '',
  onPredictionComplete,
}) => {
  const { predictions, currentPrediction, predictLocation, isLoading, error } = useLocationPrediction();
  const [inputPersonId, setInputPersonId] = useState(personId || '');
  const [predictionDays, setPredictionDays] = useState(30);

  const handlePredict = async () => {
    if (!inputPersonId.trim()) {
      alert('Please provide a person ID');
      return;
    }

    try {
      const result = await predictLocation({
        person_id: inputPersonId,
        include_historical: true,
        prediction_range_days: predictionDays,
      });

      if (onPredictionComplete) {
        onPredictionComplete(result);
      }

      setInputPersonId('');
    } catch (err) {
      console.error('Prediction failed:', err);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3>Location Prediction</h3>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.formGroup}>
          <label>Person ID *</label>
          <input
            type="text"
            placeholder="Enter person ID"
            value={inputPersonId}
            onChange={(e) => setInputPersonId(e.target.value)}
            disabled={isLoading || !!personId}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Prediction Range: {predictionDays} days</label>
          <input
            type="range"
            min="7"
            max="90"
            value={predictionDays}
            onChange={(e) => setPredictionDays(Number(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <button onClick={handlePredict} disabled={isLoading} className={styles.btnPredict}>
          {isLoading ? 'Predicting...' : 'Predict Location'}
        </button>
      </div>

      {currentPrediction && (
        <div className={styles.prediction}>
          <h4>Current Prediction</h4>
          <div className={styles.content}>
            <div className={styles.lastKnown}>
              <p>
                <strong>Last Known Location:</strong> {currentPrediction.last_known_location.address}
              </p>
              <p className={styles.date}>
                {new Date(currentPrediction.last_known_location.date).toLocaleString()}
              </p>
            </div>

            <div className={styles.pattern}>
              <p>
                <strong>Movement Pattern:</strong> {currentPrediction.movement_pattern.type}
              </p>
              <p className={styles.confidence}>
                Confidence: {currentPrediction.movement_pattern.confidence.toFixed(0)}%
              </p>
            </div>

            {currentPrediction.predicted_locations.length > 0 && (
              <div className={styles.predictions}>
                <p>
                  <strong>Predicted Locations ({currentPrediction.predicted_locations.length})</strong>
                </p>
                <ul>
                  {currentPrediction.predicted_locations.slice(0, 3).map((loc, idx) => (
                    <li key={idx}>
                      <span>{loc.probability.toFixed(0)}%</span> - {loc.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {predictions.length > 0 && (
        <div className={styles.history}>
          <h4>Prediction History ({predictions.length})</h4>
          <ul className={styles.list}>
            {predictions.slice(0, 5).map((pred) => (
              <li key={pred.id}>
                <span>{new Date(pred.prediction_date).toLocaleDateString()}</span>
                <span className={styles.pattern}>{pred.movement_pattern.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
