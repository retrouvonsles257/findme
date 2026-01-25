/**
 * =====================================================
 * RETROUVONSLES - Citizen Notifications Page
 * Notifications et alertes du citoyen
 * Intégré avec Supabase API
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useNotifications } from '../../features/notifications/hooks';
import { CitizenLayout } from './CitizenLayout';
import { 
  CheckCircle, MessageCircle, Clock, Check, Trash2, Bell, 
  Loader2, AlertTriangle, Info, CheckCheck, Settings
} from 'lucide-react';
import styles from './NotificationsPage.module.css';

export const CitizenNotificationsPage: React.FC = () => {
  const { t } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const userId = (currentUser as any)?.id;

  const [filterStatus, setFilterStatus] = useState('all');

  // Hook pour les notifications
  const { 
    notifications, 
    unreadCount,
    isLoading, 
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  } = useNotifications();

  // Charger les notifications au montage
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId, fetchNotifications]);

  // Marquer comme lu
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Erreur marquage comme lu:', err);
    }
  }, [markAsRead]);

  // Tout marquer comme lu
  const handleMarkAllAsRead = useCallback(async () => {
    if (userId) {
      try {
        await markAllAsRead(userId);
      } catch (err) {
        console.error('Erreur marquage tout comme lu:', err);
      }
    }
  }, [markAllAsRead, userId]);

  // Supprimer une notification
  const handleDelete = useCallback(async (notificationId: string) => {
    try {
      await removeNotification(notificationId);
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  }, [removeNotification]);

  // Tout supprimer
  const handleClearAll = useCallback(async () => {
    if (userId && window.confirm(t('citizen.confirmClearAll'))) {
      try {
        await clearAll(userId);
      } catch (err) {
        console.error('Erreur suppression tout:', err);
      }
    }
  }, [clearAll, userId, t]);

  // Filtrer les notifications
  const filteredNotifications = filterStatus === 'unread'
    ? notifications.filter((n: any) => !n.read)
    : notifications;

  // Mapper le type vers une icône
  const getIcon = (type: string, category?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} className={styles['notifications__icon--approval']} />;
      case 'warning':
        return <AlertTriangle size={24} className={styles['notifications__icon--warning']} />;
      case 'error':
        return <AlertTriangle size={24} className={styles['notifications__icon--error']} />;
      case 'info':
      default:
        switch (category) {
          case 'signalement':
            return <MessageCircle size={24} className={styles['notifications__icon--comment']} />;
          case 'alerte':
            return <AlertTriangle size={24} className={styles['notifications__icon--warning']} />;
          default:
            return <Bell size={24} className={styles['notifications__icon']} />;
        }
    }
  };

  // Formater la date relative
  const formatTimeAgo = (timestamp: Date | string): string => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('citizen.justNow');
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <CitizenLayout activeNav="notifications">
      <div className={styles.notifications}>
        {/* Header avec actions globales */}
        <div className={styles['notifications__header']}>
          <div className={styles['notifications__filter-bar']}>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles['notifications__filter-select']}
            >
              <option value="all">{t('citizen.allNotifications')} ({notifications.length})</option>
              <option value="unread">{t('citizen.unread')} ({unreadCount})</option>
            </select>
          </div>
          
          <div className={styles['notifications__actions-global']}>
            {unreadCount > 0 && (
              <button
                className={styles['notifications__mark-all-button']}
                onClick={handleMarkAllAsRead}
                title={t('citizen.markAllAsRead')}
              >
                <CheckCheck size={18} />
                <span>{t('citizen.markAllAsRead')}</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                className={styles['notifications__clear-all-button']}
                onClick={handleClearAll}
                title={t('citizen.clearAll')}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles['notifications__error']}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className={styles['notifications__loading']}>
            <Loader2 size={32} className={styles['notifications__loading-spin']} />
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          /* Notifications List */
          <div className={styles['notifications__list']}>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`${styles['notifications__card']} ${
                    !notification.read ? styles['notifications__card--unread'] : ''
                  }`}
                >
                  <div className={styles['notifications__icon-wrapper']}>
                    {getIcon(notification.type, notification.category)}
                  </div>
                  <div className={styles['notifications__content']}>
                    <h4 className={styles['notifications__title']}>{notification.title}</h4>
                    <p className={styles['notifications__message']}>{notification.message}</p>
                    <time className={styles['notifications__time']}>
                      {formatTimeAgo(notification.timestamp || notification.created_at)}
                    </time>
                  </div>
                  <div className={styles['notifications__actions']}>
                    {!notification.read && (
                      <button
                        className={styles['notifications__action-button']}
                        onClick={() => handleMarkAsRead(notification.id)}
                        title={t('citizen.markAsRead')}
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      className={`${styles['notifications__action-button']} ${styles['notifications__action-button--delete']}`}
                      onClick={() => handleDelete(notification.id)}
                      title={t('citizen.delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles['notifications__empty']}>
                <Bell size={48} className={styles['notifications__empty-icon']} />
                <p className={styles['notifications__empty-text']}>
                  {filterStatus === 'unread' 
                    ? t('citizen.noUnreadNotifications')
                    : t('citizen.noNotifications')
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </CitizenLayout>
  );
};