/**
 * =====================================================
 * RETROUVONSLES - Notification Selectors
 * Redux selectors for notification state
 * =====================================================
 */

import type { RootState } from '@/store/types';
import type { INotification, NotificationState } from '../types';

// Helper function to safely access notification state
const notificationState = (state: RootState) => (state.notifications as NotificationState) || {};

// ============================================
// BASIC SELECTORS
// ============================================

export const selectAllNotifications = (state: RootState): INotification[] =>
  notificationState(state).notifications || [];

export const selectUnreadNotifications = (state: RootState): INotification[] =>
  notificationState(state).notifications?.filter((n: INotification) => !n.read) || [];

export const selectUnreadCount = (state: RootState): number =>
  notificationState(state).unreadCount || 0;

export const selectNotificationsByType = (state: RootState, type: string): INotification[] =>
  notificationState(state).notifications?.filter((n: INotification) => n.type === type) || [];

export const selectNotificationsByCategory = (
  state: RootState,
  category: string
): INotification[] =>
  notificationState(state).notifications?.filter((n: INotification) => n.category === category) || [];

export const selectNotificationById = (state: RootState, id: string): INotification | undefined =>
  notificationState(state).notifications?.find((n: INotification) => n.id === id);

export const selectSelectedNotification = (state: RootState): INotification | null =>
  notificationState(state).selectedNotification || null;

export const selectIsLoading = (state: RootState): boolean =>
  notificationState(state).isLoading || false;

export const selectError = (state: RootState): string | null =>
  notificationState(state).error || null;

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectHasUnread = (state: RootState): boolean =>
  notificationState(state).unreadCount > 0;

export const selectRecentNotifications = (state: RootState, count: number = 5): INotification[] =>
  notificationState(state).notifications?.slice(0, count) || [];

export const selectHighPriorityNotifications = (state: RootState): INotification[] =>
  notificationState(state).notifications?.filter((n: INotification) => n.priority === 'high') || [];

export const selectUnreadByCategory = (
  state: RootState
): Record<string, number> => {
  const unread = notificationState(state).notifications?.filter((n: INotification) => !n.read) || [];
  return unread.reduce(
    (acc: Record<string, number>, n: INotification) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
};

export const selectNotificationStats = (state: RootState) => {
  const notifications = notificationState(state).notifications || [];
  return {
    total: notifications.length,
    unread: notificationState(state).unreadCount || 0,
    read: notifications.filter((n: INotification) => n.read).length,
    highPriority: notifications.filter((n: INotification) => n.priority === 'high').length,
    byType: {
      info: notifications.filter((n: INotification) => n.type === 'info').length,
      success: notifications.filter((n: INotification) => n.type === 'success').length,
      warning: notifications.filter((n: INotification) => n.type === 'warning').length,
      error: notifications.filter((n: INotification) => n.type === 'error').length,
    },
  };
};
