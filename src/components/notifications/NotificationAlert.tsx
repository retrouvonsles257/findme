import React from 'react';

/**
 * NotificationAlert component - inline alert message
 */
export interface NotificationAlertProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  closeable?: boolean;
  onClose?: () => void;
}

export const NotificationAlert: React.FC<NotificationAlertProps> = ({
  type = 'info',
  title,
  message,
  closeable = true,
  onClose,
}) => {
  const bgColors = {
    success: '#d1fae5',
    error: '#fee2e2',
    warning: '#fef3c7',
    info: '#dbeafe',
  };

  const textColors = {
    success: '#047857',
    error: '#991b1b',
    warning: '#92400e',
    info: '#1e40af',
  };

  const borderColors = {
    success: '#6ee7b7',
    error: '#fca5a5',
    warning: '#fcd34d',
    info: '#93c5fd',
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '6px',
        borderLeft: `4px solid ${borderColors[type]}`,
        background: bgColors[type],
        color: textColors[type],
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <div>
        {title && (
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {title}
          </div>
        )}
        <div style={{ fontSize: '14px' }}>{message}</div>
      </div>
      {closeable && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: '20px',
            padding: 0,
            flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
};
