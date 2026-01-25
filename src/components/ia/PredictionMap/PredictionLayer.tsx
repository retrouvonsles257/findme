import React from 'react';

export interface PredictionLayerProps {
  predictions: Array<{
    id: string;
    latitude: number;
    longitude: number;
    confidence: number;
    label: string;
  }>;
  onPredictionClick?: (id: string) => void;
}

export const PredictionLayer: React.FC<PredictionLayerProps> = ({
  predictions,
  onPredictionClick,
}) => {
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {predictions.map((pred) => (
        <div
          key={pred.id}
          onClick={() => onPredictionClick?.(pred.id)}
          style={{
            position: 'absolute',
            left: `${(pred.longitude / 180) * 100 + 50}%`,
            top: `${(pred.latitude / 90) * 100 + 50}%`,
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '40px',
            background: pred.confidence >= 0.8 ? '#16a34a' : '#f59e0b',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
          }}
          title={`${pred.label} (${(pred.confidence * 100).toFixed(1)}%)`}
        >
          {(pred.confidence * 100).toFixed(0)}%
        </div>
      ))}
    </div>
  );
};
