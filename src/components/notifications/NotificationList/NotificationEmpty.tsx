import React from 'react';
import styles from './NotificationList.module.css';

export interface NotificationEmptyProps {
  message?: string;
  icon?: React.ReactNode;
}

/**
 * NotificationEmpty component - empty state for notification list
 */
export const NotificationEmpty: React.FC<NotificationEmptyProps> = ({
  message = 'No notifications',
  icon = '🔔',
}) => {
  return (
    <div className={styles.notificationList}>
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>{icon}</div>
        <p className={styles.emptyMessage}>{message}</p>
        <p className={styles.emptyHint}>You're all caught up!</p>
      </div>
    </div>
  );
};
