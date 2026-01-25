import React from 'react';
import styles from './NotificationBell.module.css';

export interface NotificationBadgeProps {
  count: number;
  variant?: 'dot' | 'number';
}

/**
 * NotificationBadge component - shows unread count
 */
export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  variant = 'number',
}) => {
  if (count === 0) return null;

  return (
    <span className={`${styles.badge} ${styles[`variant-${variant}`]}`}>
      {variant === 'number' && (count > 99 ? '99+' : count)}
    </span>
  );
};
