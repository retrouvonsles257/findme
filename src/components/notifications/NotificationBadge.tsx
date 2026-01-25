import React from 'react';

/**
 * NotificationBadge component - shows unread count
 */
export interface NotificationBadgeProps {
  count: number;
  variant?: 'dot' | 'number';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  variant = 'number',
}) => {
  if (count === 0) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: variant === 'dot' ? '8px' : '20px',
        height: variant === 'dot' ? '8px' : '20px',
        background: 'linear-gradient(135deg, #ef4444, #f97316)',
        color: 'white',
        borderRadius: '50%',
        fontSize: variant === 'dot' ? '0px' : '12px',
        fontWeight: 700,
      }}
    >
      {variant === 'number' && (count > 99 ? '99+' : count)}
    </span>
  );
};
