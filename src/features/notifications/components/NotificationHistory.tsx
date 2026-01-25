import React from 'react';
import styles from './NotificationCenter.module.css';
import { Notification } from './NotificationCenter';

export interface NotificationHistoryProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
}

/**
 * NotificationHistory component - displays notification history
 */
export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  notifications,
  onNotificationClick,
}) => {
  if (notifications.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className={styles.history}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${styles.notificationItem} ${
            !notification.read ? styles.unread : ''
          } ${styles[`type-${notification.type}`]}`}
          onClick={() => onNotificationClick?.(notification)}
        >
          <div className={styles.notificationIcon}>
            {notification.type === 'success' && '✓'}
            {notification.type === 'error' && '✕'}
            {notification.type === 'warning' && '!'}
            {notification.type === 'info' && 'ℹ'}
          </div>

          <div className={styles.notificationBody}>
            <h5 className={styles.notificationTitle}>
              {notification.title}
            </h5>
            <p className={styles.notificationMessage}>
              {notification.message}
            </p>
            <time className={styles.notificationTime}>
              {notification.timestamp.toLocaleString()}
            </time>
          </div>

          {!notification.read && (
            <div className={styles.unreadDot} />
          )}

          {notification.action && (
            <button
              className={styles.actionButton}
              onClick={(e) => {
                e.stopPropagation();
                notification.action!.onClick();
              }}
            >
              {notification.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
