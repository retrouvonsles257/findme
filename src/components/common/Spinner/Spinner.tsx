import React from 'react';
import styles from './Spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${className}`}>
      <div
        className={`${styles.spinner} ${styles[size]} ${styles[variant]}`}
        role="status"
        aria-label={label}
        data-testid="spinner"
      >
        <span className={styles.spinnerTrack} />
        <span className={styles.spinnerCircle} />
      </div>
      {label && <p className={styles.spinnerLabel}>{label}</p>}
    </div>
  );
};
