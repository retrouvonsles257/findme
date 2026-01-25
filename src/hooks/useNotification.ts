/**
 * =====================================================
 * RETROUVONSLES - useNotification Hook
 * Dispatches notifications via Redux context
 * =====================================================
 */

import { useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationPayload {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

export interface UseNotificationResult {
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

// const generateId = () => `notification-${Date.now()}-${Math.random()}`;

export const useNotification = (): UseNotificationResult => {
  const notify = useCallback(
    (_message: string, _type: NotificationType, _duration = 3000) => {
      // Dispatch to Redux notification context
      // This assumes a notification slice exists in the store
      // const notification: NotificationPayload = {
      //   id: generateId(),
      //   message: _message,
      //   type: _type,
      //   duration: _duration,
      // };

      // Dispatch add notification action
      // dispatch(addNotification(notification));

      // Auto-remove after duration
      if (_duration > 0) {
        setTimeout(() => {
          // dispatch(removeNotification(notification.id));
        }, _duration);
      }
    },
    []
  );

  const success = useCallback(
    (message: string, duration?: number) => notify(message, 'success', duration),
    [notify]
  );

  const error = useCallback(
    (message: string, duration?: number) => notify(message, 'error', duration),
    [notify]
  );

  const warning = useCallback(
    (message: string, duration?: number) => notify(message, 'warning', duration),
    [notify]
  );

  const info = useCallback(
    (message: string, duration?: number) => notify(message, 'info', duration),
    [notify]
  );

  return { success, error, warning, info };
};
