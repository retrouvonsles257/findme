import React from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  progress: number;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  striped?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  variant = 'primary',
  size = 'md',
  showLabel = true,
  striped = false,
  animated = false,
  className = '',
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div
      className={`${styles.progressBarContainer} ${styles[size]} ${className}`}
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid="progress-bar"
    >
      <div
        className={`${styles.progressBar} ${styles[variant]} ${striped ? styles.striped : ''} ${animated ? styles.animated : ''}`}
        style={{ width: `${normalizedProgress}%` }}
      >
        {showLabel && <span className={styles.progressLabel}>{normalizedProgress}%</span>}
      </div>
    </div>
  );
};
