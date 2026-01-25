/**
 * =====================================================
 * RETROUVONSLES - Notification Provider
 * Fournisseur centralisé de notifications
 * =====================================================
 */

import React, { ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { NotificationContext, NotificationContextType, NotificationOptions } from './NotificationContext';
import { RetrouvonsLesNotification } from '../@types/notification.types';

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
  defaultDuration?: number; // en ms
}

/**
 * Provider de notifications
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 10,
  defaultDuration = 5000,
}) => {
  const [notifications, setNotifications] = useState<RetrouvonsLesNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [settings, setSettings] = useState<Record<string, any>>({
    soundEnabled: true,
    vibrationEnabled: true,
    autoClose: true,
  });
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const idCounterRef = useRef(0);

  // Ajouter une notification
  const addNotification = useCallback(
    (options: NotificationOptions): string => {
      const id = options.id || `notif-${++idCounterRef.current}-${Date.now()}`;

      const notification: RetrouvonsLesNotification = {
        id,
        title: options.title,
        message: options.message,
        type: options.type,
        category: options.category || 'system',
        timestamp: new Date(),
        isRead: false,
        priority: options.priority || 'normal',
        fcmMessageId: undefined,
      };

      setNotifications(prev => {
        const updated = [notification, ...prev];
        // Garder seulement les dernières notifications
        return updated.slice(0, maxNotifications);
      });

      // Jouer un son si activé
      if (settings.soundEnabled && options.type === 'error') {
        playSound();
      }

      // Vibration si activé et supporté
      if (settings.vibrationEnabled && navigator.vibrate) {
        navigator.vibrate(options.type === 'error' ? [200, 100, 200] : 100);
      }

      // Auto-fermeture
      const duration = options.duration !== undefined ? options.duration : defaultDuration;
      if (duration !== null && settings.autoClose) {
        const timeout = setTimeout(() => {
          removeNotification(id);
        }, duration);
        timeoutsRef.current.set(id, timeout);
      }

      return id;
    },
    [maxNotifications, defaultDuration, settings]
  );

  // Supprimer une notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Nettoyer le timeout
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // Marquer comme lue
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  // Marquer tout comme lu
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, isRead: true }))
    );
  }, []);

  // Effacer tout
  const clearAll = useCallback(() => {
    // Nettoyer tous les timeouts
    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    setNotifications([]);
  }, []);

  // Récupérer les notifications
  const getNotifications = useCallback(async () => {
    try {
      setLoading(true);
      // TODO: Implémenter l'appel API pour récupérer les notifications
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch notifications');
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer les notifications non lues
  const getUnreadNotifications = useCallback((): RetrouvonsLesNotification[] => {
    return notifications.filter(n => !n.isRead);
  }, [notifications]);

  // Paramétrer les notifications
  const setNotificationSettings = useCallback((newSettings: Record<string, any>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  // Fonction pour jouer un son
  const playSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (err) {
      console.debug('Could not play notification sound:', err);
    }
  }, []);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    loading,
    error,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    getNotifications,
    getUnreadNotifications,
    setNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
