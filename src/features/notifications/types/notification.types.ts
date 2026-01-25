/**
 * =====================================================
 * RETROUVONSLES - Notification Types
 * Type definitions for notification feature
 * =====================================================
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export type NotificationCategory =
  | 'missing-person'
  | 'sighting'
  | 'alert'
  | 'organization'
  | 'system'
  | 'message';

export interface INotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high';
  user_id: string;
  timestamp: Date;
  read: boolean;
  readAt?: Date;
  data?: Record<string, any>;
  action?: {
    label: string;
    url?: string;
    onClick?: () => void;
  };
}

export interface NotificationFilter {
  types?: NotificationType[];
  categories?: NotificationCategory[];
  read?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  category: NotificationCategory;
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
}

export interface NotificationChannel {
  type: 'in-app' | 'push' | 'email' | 'sms';
  enabled: boolean;
}

export interface NotificationSchedule {
  frequency: 'instant' | 'daily' | 'weekly';
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface NotificationCreatePayload {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high';
  user_id: string;
  data?: Record<string, any>;
  action?: {
    label: string;
    url?: string;
  };
}

export interface NotificationState {
  notifications: INotification[];
  unreadCount: number;
  selectedNotification: INotification | null;
  isLoading: boolean;
  error: string | null;
  filter: NotificationFilter;
}
