import React, { useState, useEffect } from 'react';
import styles from './NotificationCenter.module.css';
import { NotificationHistory } from './NotificationHistory';
import { NotificationPreferences } from './NotificationPreferences';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationCenterProps {
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onClearAll?: () => void;
}

/**
 * NotificationCenter component - displays and manages notifications
 */
export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications = [],
  onNotificationClick,
  onMarkAsRead,
  onClearAll,
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'preferences'>('history');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <div className={styles.notificationCenter}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Notifications
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </h3>
        {notifications.length > 0 && (
          <button
            className={styles.clearButton}
            onClick={onClearAll}
            title="Clear all notifications"
          >
            Clear
          </button>
        )}
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'history' ? styles.active : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'preferences' ? styles.active : ''}`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'history' && (
          <NotificationHistory
            notifications={notifications}
            onNotificationClick={handleNotificationClick}
            onMarkAsRead={onMarkAsRead}
          />
        )}
        {activeTab === 'preferences' && <NotificationPreferences />}
      </div>
    </div>
  );
};
