import React from 'react';

export interface PredictionLegendProps {
  items?: Array<{
    label: string;
    color: string;
  }>;
}

export const PredictionLegend: React.FC<PredictionLegendProps> = ({
  items = [
    { label: 'High Confidence (>80%)', color: '#16a34a' },
    { label: 'Medium Confidence (60-80%)', color: '#f59e0b' },
    { label: 'Low Confidence (<60%)', color: '#dc2626' },
  ],
}) => {
  return (
    <div
      style={{
        padding: '1rem',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minWidth: '250px',
      }}
    >
      <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: '600' }}>Legend</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                background: item.color,
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              }}
            />
            <span style={{ fontSize: '0.875rem', color: '#555' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
