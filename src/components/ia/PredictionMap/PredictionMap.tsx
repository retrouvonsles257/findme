import React, { useState } from 'react';
import { PredictionLayer } from './PredictionLayer';
import { PredictionLegend } from './PredictionLegend';
import styles from './PredictionMap.module.css';

export interface Prediction {
  id: string;
  latitude: number;
  longitude: number;
  confidence: number;
  label: string;
}

export interface PredictionMapProps {
  predictions: Prediction[];
  onPredictionSelect?: (prediction: Prediction) => void;
}

export const PredictionMap: React.FC<PredictionMapProps> = ({
  predictions,
  onPredictionSelect,
}) => {
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);

  const handlePredictionClick = (id: string) => {
    const prediction = predictions.find((p) => p.id === id);
    if (prediction) {
      setSelectedPrediction(prediction);
      if (onPredictionSelect) {
        onPredictionSelect(prediction);
      }
    }
  };

  return (
    <div className={styles.container}>
      <h2>Prediction Map</h2>

      <div className={styles.mapContainer}>
        <div className={styles.map}>
          <PredictionLayer predictions={predictions} onPredictionClick={handlePredictionClick} />
        </div>

        <div className={styles.sidebar}>
          <PredictionLegend />

          {selectedPrediction && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0' }}>{selectedPrediction.label}</h4>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                <strong>Confidence:</strong> {(selectedPrediction.confidence * 100).toFixed(2)}%
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                <strong>Latitude:</strong> {selectedPrediction.latitude.toFixed(4)}
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.875rem' }}>
                <strong>Longitude:</strong> {selectedPrediction.longitude.toFixed(4)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
