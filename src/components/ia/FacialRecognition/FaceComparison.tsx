import React, { useState } from 'react';

export interface FaceComparisonProps {
  sourceImage?: string;
  targetImage?: string;
  onComparison?: (similarity: number) => void;
  isLoading?: boolean;
}

export const FaceComparison: React.FC<FaceComparisonProps> = ({
  sourceImage,
  targetImage,
  onComparison,
  isLoading = false,
}) => {
  const [similarity, setSimilarity] = useState<number | null>(null);

  const handleCompare = async () => {
    // Simulate face comparison API call
    const simulatedSimilarity = Math.random() * 0.3 + 0.7; // 70-100%
    setSimilarity(simulatedSimilarity);
    if (onComparison) {
      onComparison(simulatedSimilarity);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {sourceImage && (
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Source Image</h4>
            <img
              src={sourceImage}
              alt="Source"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #ddd',
              }}
            />
          </div>
        )}
        {targetImage && (
          <div>
            <h4 style={{ margin: '0 0 0.5rem 0' }}>Target Image</h4>
            <img
              src={targetImage}
              alt="Target"
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '8px',
                border: '2px solid #ddd',
              }}
            />
          </div>
        )}
      </div>

      <button
        onClick={handleCompare}
        disabled={!sourceImage || !targetImage || isLoading}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1rem',
        }}
      >
        {isLoading ? 'Comparing...' : 'Compare Faces'}
      </button>

      {similarity !== null && (
        <div
          style={{
            padding: '1rem',
            background: '#f0fdf4',
            borderRadius: '4px',
            border: '1px solid #bbf7d0',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Similarity Score</p>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#16a34a',
            }}
          >
            {(similarity * 100).toFixed(2)}%
          </div>
        </div>
      )}
    </div>
  );
};
