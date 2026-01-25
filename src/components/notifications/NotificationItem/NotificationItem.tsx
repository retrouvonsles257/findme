import React from 'react';
import styles from './NotificationItem.module.css';

export interface NotificationItemProps {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: Date;
  read?: boolean;
  icon?: React.ReactNode;
  avatar?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClick?: () => void;
  onClose?: () => void;
}

/**
 * NotificationItem component - individual notification row
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  id,
  title,
  message,
  type = 'info',
  timestamp,
  read = false,
  icon,
  avatar,
  action,
  onClick,
  onClose,
}) => {
  const typeStyles = {
    info: { borderColor: '#3b82f6', bgColor: '#dbeafe' },
    success: { borderColor: '#10b981', bgColor: '#d1fae5' },
    warning: { borderColor: '#f59e0b', bgColor: '#fef3c7' },
    error: { borderColor: '#ef4444', bgColor: '#fee2e2' },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`${styles.notificationItem} ${read ? styles.read : styles.unread}`}
      onClick={onClick}
    >
      <div
        className={styles.border}
        style={{ borderLeftColor: style.borderColor }}
      />

      {avatar && (
        <img src={avatar} alt={title} className={styles.avatar} />
      )}

      {icon && !avatar && (
        <div className={styles.icon}>{icon}</div>
      )}

      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        <p className={styles.message}>{message}</p>
        {timestamp && (
          <time className={styles.timestamp}>
            {new Date(timestamp).toLocaleString()}
          </time>
        )}
      </div>

      {!read && <div className={styles.unreadBadge} />}

      {action && (
        <button
          className={styles.actionBtn}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick();
          }}
        >
          {action.label}
        </button>
      )}

      {onClose && (
        <button
          className={styles.closeBtn}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          title="Close"
        >
          ×
        </button>
      )}
    </div>
  );
};
