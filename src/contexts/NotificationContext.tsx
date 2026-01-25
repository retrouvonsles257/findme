/**
 * =====================================================
 * RETROUVONSLES - Notification Context
 * Gestion centralisée des notifications
 * =====================================================
 */

import React, { createContext } from 'react';
import { RetrouvonsLesNotification, NotificationCategory } from '../@types/notification.types';

/**
 * Interface pour les options de notification
 */
export interface NotificationOptions {
  id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category?: NotificationCategory;
  duration?: number; // en ms, null pour persistant
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Interface pour l'état des notifications
 */
export interface NotificationContextType {
  // État
  notifications: RetrouvonsLesNotification[];
  unreadCount: number;
  loading: boolean;
  error: Error | null;

  // Actions
  addNotification: (options: NotificationOptions) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;

  // Récupération
  getNotifications: () => Promise<void>;
  getUnreadNotifications: () => RetrouvonsLesNotification[];

  // Configuration
  setNotificationSettings: (settings: Record<string, any>) => void;
}

/**
 * Crée le contexte de notification
 */
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte de notification
 */
export const useNotification = (): NotificationContextType => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
