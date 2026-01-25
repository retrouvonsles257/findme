import React from 'react';

export interface ConfidenceScoreProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ConfidenceScore: React.FC<ConfidenceScoreProps> = ({
  score,
  label = 'Confidence',
  size = 'md',
}) => {
  const getColor = (score: number) => {
    if (score >= 0.8) return '#16a34a';
    if (score >= 0.6) return '#f59e0b';
    return '#dc2626';
  };

  const getSize = () => {
    switch (size) {
      case 'sm':
        return { fontSize: '1rem', padding: '0.5rem' };
      case 'lg':
        return { fontSize: '2rem', padding: '1.5rem' };
      default:
        return { fontSize: '1.5rem', padding: '1rem' };
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {label && <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>{label}</p>}
      <div
        style={{
          ...getSize(),
          fontWeight: 'bold',
          color: getColor(score),
          background: `${getColor(score)}20`,
          borderRadius: '8px',
          display: 'inline-block',
          minWidth: '100px',
        }}
      >
        {(score * 100).toFixed(1)}%
      </div>
    </div>
  );
};
