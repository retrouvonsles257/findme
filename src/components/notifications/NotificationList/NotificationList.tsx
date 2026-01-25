import React from 'react';
import styles from './NotificationList.module.css';
import { NotificationEmpty } from './NotificationEmpty';
import { NotificationItemProps } from '../NotificationItem';

export interface NotificationListProps {
  items: NotificationItemProps[];
  isLoading?: boolean;
  emptyMessage?: string;
  onItemClick?: (item: NotificationItemProps) => void;
  onItemClose?: (id: string) => void;
}

/**
 * NotificationList component - list of notifications
 */
export const NotificationList: React.FC<NotificationListProps> = ({
  items,
  isLoading = false,
  emptyMessage = 'No notifications',
  onItemClick,
  onItemClose,
}) => {
  if (isLoading) {
    return (
      <div className={styles.notificationList}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return <NotificationEmpty message={emptyMessage} />;
  }

  return (
    <div className={styles.notificationList}>
      {items.map((item) => (
        <div
          key={item.id}
          className={`${styles.item} ${item.read ? styles.read : styles.unread}`}
          onClick={() => onItemClick?.(item)}
        >
          <div className={styles.itemBorder} />

          {item.avatar && (
            <img src={item.avatar} alt={item.title} className={styles.avatar} />
          )}

          {item.icon && !item.avatar && (
            <div className={styles.icon}>{item.icon}</div>
          )}

          <div className={styles.content}>
            <h4 className={styles.title}>{item.title}</h4>
            <p className={styles.message}>{item.message}</p>
            {item.timestamp && (
              <time className={styles.timestamp}>
                {new Date(item.timestamp).toLocaleString()}
              </time>
            )}
          </div>

          {!item.read && <div className={styles.unreadBadge} />}

          {item.action && (
            <button
              className={styles.actionBtn}
              onClick={(e) => {
                e.stopPropagation();
                item.action!.onClick();
              }}
            >
              {item.action.label}
            </button>
          )}

          {onItemClose && (
            <button
              className={styles.closeBtn}
              onClick={(e) => {
                e.stopPropagation();
                onItemClose(item.id);
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
