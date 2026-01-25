import React from 'react';
import { ConfidenceScore } from './ConfidenceScore';
import styles from './IAResultCard.module.css';

export interface IAResultCardProps {
  title: string;
  description?: string;
  confidenceScore: number;
  resultDetails?: {
    label: string;
    value: string | number;
  }[];
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'success' | 'warning' | 'error' | 'info';
}

export const IAResultCard: React.FC<IAResultCardProps> = ({
  title,
  description,
  confidenceScore,
  resultDetails = [],
  action,
  variant = 'info',
}) => {
  const variantStyles = {
    success: { background: '#f0fdf4', borderColor: '#86efac' },
    warning: { background: '#fefce8', borderColor: '#fde047' },
    error: { background: '#fef2f2', borderColor: '#fca5a5' },
    info: { background: '#f0f9ff', borderColor: '#bfdbfe' },
  };

  return (
    <div
      className={styles.card}
      style={{
        ...variantStyles[variant],
        border: `1px solid ${variantStyles[variant].borderColor}`,
      }}
    >
      <div className={styles.header}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {description && <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.875rem' }}>{description}</p>}
      </div>

      <div className={styles.score}>
        <ConfidenceScore score={confidenceScore} label="Confidence Score" size="md" />
      </div>

      {resultDetails.length > 0 && (
        <div className={styles.details}>
          {resultDetails.map((detail, index) => (
            <div key={index} className={styles.detailItem}>
              <span style={{ fontWeight: '600' }}>{detail.label}:</span>
              <span>{detail.value}</span>
            </div>
          ))}
        </div>
      )}

      {action && (
        <button onClick={action.onClick} className={styles.actionButton}>
          {action.label}
        </button>
      )}
    </div>
  );
};
