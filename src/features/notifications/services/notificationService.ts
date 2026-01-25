/**
 * =====================================================
 * RETROUVONSLES - Notification Service
 * Business logic for notifications
 * =====================================================
 */

import type { INotification } from '../types';

/**
 * Format notification timestamp
 */
export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
};

/**
 * Get notification type color
 */
export const getTypeColor = (type: INotification['type']): string => {
  const colors = {
    info: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };
  return colors[type];
};

/**
 * Get notification priority color
 */
export const getPriorityColor = (priority: INotification['priority']): string => {
  const colors = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
  };
  return colors[priority];
};

/**
 * Group notifications by type
 */
export const groupByType = (notifications: INotification[]): Record<string, INotification[]> => {
  return notifications.reduce(
    (groups, notification) => {
      const type = notification.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(notification);
      return groups;
    },
    {} as Record<string, INotification[]>
  );
};

/**
 * Group notifications by category
 */
export const groupByCategory = (notifications: INotification[]): Record<string, INotification[]> => {
  return notifications.reduce(
    (groups, notification) => {
      const category = notification.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(notification);
      return groups;
    },
    {} as Record<string, INotification[]>
  );
};

/**
 * Filter notifications by status
 */
export const filterByStatus = (
  notifications: INotification[],
  status: 'read' | 'unread'
): INotification[] => {
  return notifications.filter((n) =>
    status === 'read' ? n.read : !n.read
  );
};

/**
 * Sort notifications by timestamp
 */
export const sortByTimestamp = (
  notifications: INotification[],
  order: 'asc' | 'desc' = 'desc'
): INotification[] => {
  return [...notifications].sort((a, b) => {
    const diff = a.timestamp.getTime() - b.timestamp.getTime();
    return order === 'asc' ? diff : -diff;
  });
};

/**
 * Check if notification should trigger sound
 */
export const shouldPlaySound = (
  notification: INotification,
  settings: { soundEnabled: boolean }
): boolean => {
  return settings.soundEnabled && (notification.type === 'error' || notification.priority === 'high');
};

/**
 * Check if in quiet hours
 */
export const isInQuietHours = (settings: {
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}): boolean => {
  if (!settings.quietHoursEnabled || !settings.quietHoursStart || !settings.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const [startHour, startMin] = settings.quietHoursStart.split(':').map(Number);
  const [endHour, endMin] = settings.quietHoursEnd.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);

  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;
  const current = currentHour * 60 + currentMin;

  if (startTime <= endTime) {
    return current >= startTime && current < endTime;
  } else {
    return current >= startTime || current < endTime;
  }
};

/**
 * Calculate unread count
 */
export const calculateUnreadCount = (notifications: INotification[]): number => {
  return notifications.filter((n) => !n.read).length;
};

/**
 * Get recent notifications
 */
export const getRecentNotifications = (
  notifications: INotification[],
  count: number = 5
): INotification[] => {
  return notifications.slice(0, count);
};
