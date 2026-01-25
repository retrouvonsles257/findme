import React, { useState, useRef, useEffect } from 'react';
import styles from './NotificationBell.module.css';
import { NotificationBadge } from './NotificationBadge';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationBellProps {
  notifications?: Notification[];
  unreadCount?: number;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onClearAll?: () => void;
  maxHeight?: string;
}

/**
 * NotificationBell component - bell icon with dropdown menu
 */
export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications = [],
  unreadCount = 0,
  onNotificationClick,
  onMarkAsRead,
  onClearAll,
  maxHeight = '400px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <div className={styles.notificationBell} ref={dropdownRef}>
      <button
        className={styles.bellButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <NotificationBadge count={unreadCount} />
        )}
      </button>

      {isOpen && (
        <div className={styles.dropdown} style={{ maxHeight }}>
          <div className={styles.header}>
            <h3 className={styles.title}>Notifications</h3>
            {notifications.length > 0 && (
              <button
                className={styles.clearButton}
                onClick={() => {
                  onClearAll?.();
                  setIsOpen(false);
                }}
              >
                Clear All
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className={styles.empty}>
              <p>No notifications</p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${
                    !notification.read ? styles.unread : ''
                  } ${styles[`type-${notification.type}`]}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.icon && (
                    <div className={styles.icon}>
                      {notification.icon}
                    </div>
                  )}

                  <div className={styles.content}>
                    <h4 className={styles.notificationTitle}>
                      {notification.title}
                    </h4>
                    <p className={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    <time className={styles.timestamp}>
                      {new Date(notification.timestamp).toLocaleTimeString()}
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
          )}
        </div>
      )}
    </div>
  );
};
