/**
 * =====================================================
 * RETROUVONSLES - useNotifications Hook
 * Hook for notification operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../../store/types';
import {
  fetchNotifications,
  createNewNotification,
  toggleNotificationRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearAllNotifications,
} from '../store/notificationSlice';
import {
  selectAllNotifications,
  selectUnreadCount,
  selectIsLoading,
  selectError,
} from '../store/notificationSelectors';
import type { INotification } from '../types';

export interface UseNotificationsResult {
  notifications: INotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  fetchNotifications: (userId: string) => Promise<any>;
  createNotification: (data: Omit<INotification, 'id' | 'timestamp'>) => Promise<any>;
  markAsRead: (notificationId: string) => Promise<any>;
  markAllAsRead: (userId: string) => Promise<any>;
  removeNotification: (notificationId: string) => Promise<any>;
  clearAll: (userId: string) => Promise<any>;
}

/**
 * useNotifications hook
 */
export const useNotifications = (): UseNotificationsResult => {
  const dispatch = useDispatch<AppDispatch>();
  const notifications = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const handleFetchNotifications = useCallback(
    (userId: string) => {
      return (dispatch(fetchNotifications(userId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleCreateNotification = useCallback(
    (data: Omit<INotification, 'id' | 'timestamp'>) => {
      return (dispatch(createNewNotification(data)) as any).unwrap();
    },
    [dispatch]
  );

  const handleMarkAsRead = useCallback(
    (notificationId: string) => {
      return (dispatch(toggleNotificationRead(notificationId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleMarkAllAsRead = useCallback(
    (userId: string) => {
      return (dispatch(markAllNotificationsAsRead(userId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleRemoveNotification = useCallback(
    (notificationId: string) => {
      return (dispatch(removeNotification(notificationId)) as any).unwrap();
    },
    [dispatch]
  );

  const handleClearAll = useCallback(
    (userId: string) => {
      return (dispatch(clearAllNotifications(userId)) as any).unwrap();
    },
    [dispatch]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications: handleFetchNotifications,
    createNotification: handleCreateNotification,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    removeNotification: handleRemoveNotification,
    clearAll: handleClearAll,
  };
};
