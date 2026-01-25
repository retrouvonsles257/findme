import React, { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export interface ToastProps {
  id: string;
  message: string;
  title?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  closeable?: boolean;
}

/**
 * Toast component - standalone notification
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  message,
  title,
  type = 'info',
  duration = 4000,
  icon,
  action,
  onClose,
  closeable = true,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const typeConfig = {
    success: {
      bgColor: '#d1fae5',
      borderColor: '#6ee7b7',
      iconColor: '#047857',
      icon: '✓',
    },
    error: {
      bgColor: '#fee2e2',
      borderColor: '#fca5a5',
      iconColor: '#991b1b',
      icon: '✕',
    },
    warning: {
      bgColor: '#fef3c7',
      borderColor: '#fcd34d',
      iconColor: '#92400e',
      icon: '!',
    },
    info: {
      bgColor: '#dbeafe',
      borderColor: '#93c5fd',
      iconColor: '#1e40af',
      icon: 'ℹ',
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`${styles.toast} ${styles[`type-${type}`]} ${
        isExiting ? styles.exiting : ''
      }`}
      style={{
        '--bg-color': config.bgColor,
        '--border-color': config.borderColor,
        '--icon-color': config.iconColor,
      } as React.CSSProperties}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.iconWrapper}>
        {icon ? (
          <div className={styles.customIcon}>{icon}</div>
        ) : (
          <span className={styles.defaultIcon}>{config.icon}</span>
        )}
      </div>

      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <p className={styles.message}>{message}</p>
      </div>

      {action && (
        <button
          className={styles.actionBtn}
          onClick={() => {
            action.onClick();
            handleClose();
          }}
        >
          {action.label}
        </button>
      )}

      {closeable && (
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
};
