import React, { ReactNode } from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps {
  icon: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  ariaLabel: string;
  title?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ariaLabel,
  title,
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${loading ? styles.loading : ''} ${className}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      title={title}
      type="button"
      data-testid="icon-button"
    >
      <span className={styles.icon}>{loading ? '⏳' : icon}</span>
    </button>
  );
};
