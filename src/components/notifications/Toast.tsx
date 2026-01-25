import React from 'react';
import styles from '../layout/Layout.module.css';

/**
 * Toast notification component - simple in-app notification
 */
export interface ToastProps {
  id: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 4000,
  onClose,
}) => {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration, onClose]);

  const typeStyles = {
    success: { background: '#10b981', color: 'white' },
    error: { background: '#ef4444', color: 'white' },
    warning: { background: '#f59e0b', color: 'white' },
    info: { background: '#3b82f6', color: 'white' },
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '6px',
        fontSize: '14px',
        ...typeStyles[type],
      }}
    >
      {message}
    </div>
  );
};
