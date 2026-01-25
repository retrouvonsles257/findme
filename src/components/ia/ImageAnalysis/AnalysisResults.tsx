import React from 'react';

export interface AnalysisResult {
  label: string;
  confidence: number;
  description?: string;
}

export interface AnalysisResultsProps {
  results: AnalysisResult[];
  isLoading?: boolean;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, isLoading = false }) => {
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <p>Analyzing image...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return <p style={{ color: '#666', textAlign: 'center' }}>No results yet</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {results.map((result, index) => (
        <div
          key={index}
          style={{
            padding: '1rem',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            background: '#f9fafb',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 0.25rem 0' }}>{result.label}</h4>
              {result.description && (
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#666' }}>{result.description}</p>
              )}
            </div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: result.confidence >= 0.8 ? '#16a34a' : '#f59e0b',
              }}
            >
              {(result.confidence * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
