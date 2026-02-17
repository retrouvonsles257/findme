/**
 * =====================================================
 * RETROUVONSLES - Moderator Notifications Page
 * Page de notifications pour les modérateurs
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import ModerationLayout from './ModerationLayout';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  Trash2,
  Check,
  CheckCheck,
  Filter,
  Clock,
  User,
  Image,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { AdminListSkeleton } from '../admin/skeletons';
import styles from './NotificationsPage.module.css';

// Helper pour Supabase
const db = () => supabase as any;

// Types
interface Notification {
  id: string;
  titre: string;
  message: string;
  type_notification: string;
  canal: string;
  priorite: string;
  lue: boolean;
  date_creation: string;
  date_lecture?: string;
  donnees_supplementaires?: Record<string, any>;
  url_action?: string;
}

type FilterType = 'all' | 'unread' | 'signalement' | 'photo' | 'ia' | 'identity' | 'system';

export const NotificationsPage: React.FC = () => {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const currentUser = useAppSelector(selectUser);

  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    signalements: 0,
    photos: 0,
    ia: 0,
  });

  // Charger les notifications
  const loadNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await db()
        .from('notification')
        .select('*')
        .eq('id_utilisateur', currentUser.id)
        .order('date_creation', { ascending: false });

      if (!error && data) {
        setNotifications(data);
        
        // Calculer les stats
        const unread = data.filter((n: Notification) => !n.lue).length;
        const signalements = data.filter((n: Notification) => 
          n.type_notification === 'nouveau_signalement' || 
          n.type_notification === 'mise_a_jour_dossier'
        ).length;
        const photos = data.filter((n: Notification) => 
          n.type_notification === 'upload_photo'
        ).length;
        const ia = data.filter((n: Notification) => 
          n.type_notification === 'alerte_ia'
        ).length;

        setStats({
          total: data.length,
          unread,
          signalements,
          photos,
          ia,
        });
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Marquer comme lu
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await db()
        .from('notification')
        .update({ lue: true, date_lecture: new Date().toISOString() })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, lue: true } : n)
        );
        setStats(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  // Marquer tout comme lu
  const markAllAsRead = async () => {
    if (!currentUser?.id) return;
    
    try {
      const { error } = await db()
        .from('notification')
        .update({ lue: true, date_lecture: new Date().toISOString() })
        .eq('id_utilisateur', currentUser.id)
        .eq('lue', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, lue: true })));
        setStats(prev => ({ ...prev, unread: 0 }));
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Supprimer une notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await db()
        .from('notification')
        .delete()
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setStats(prev => ({
          ...prev,
          total: prev.total - 1,
          unread: notifications.find(n => n.id === notificationId && !n.lue) 
            ? prev.unread - 1 
            : prev.unread,
        }));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Supprimer les sélectionnées
  const deleteSelected = async () => {
    if (selectedNotifications.size === 0) return;
    
    try {
      const ids = Array.from(selectedNotifications);
      const { error } = await db()
        .from('notification')
        .delete()
        .in('id', ids);

      if (!error) {
        setNotifications(prev => prev.filter(n => !selectedNotifications.has(n.id)));
        setSelectedNotifications(new Set());
        await loadNotifications();
      }
    } catch (err) {
      console.error('Error deleting selected:', err);
    }
  };

  // Toggle sélection
  const toggleSelection = (id: string) => {
    setSelectedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filtrer les notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.lue;
    if (filter === 'signalement') return n.type_notification === 'nouveau_signalement' || n.type_notification === 'mise_a_jour_dossier';
    if (filter === 'photo') return n.type_notification === 'upload_photo';
    if (filter === 'ia') return n.type_notification === 'alerte_ia';
    if (filter === 'identity') return n.type_notification === 'verification_identite';
    if (filter === 'system') return n.type_notification === 'systeme' || n.type_notification === 'autre';
    return true;
  });

  // Obtenir l'icône selon le type
  const getIcon = (type: string) => {
    switch (type) {
      case 'nouveau_signalement':
      case 'mise_a_jour_dossier':
        return <AlertTriangle size={20} />;
      case 'upload_photo':
        return <Image size={20} />;
      case 'alerte_ia':
        return <Brain size={20} />;
      case 'verification_identite':
        return <User size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  // Obtenir la couleur selon la priorité
  const getPriorityClass = (priorite: string) => {
    switch (priorite) {
      case 'haute':
      case 'urgente':
        return styles.priorityHigh;
      case 'moyenne':
        return styles.priorityMedium;
      default:
        return styles.priorityLow;
    }
  };

  // Navigation selon le type
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    
    // Naviguer vers la page appropriée
    switch (notification.type_notification) {
      case 'nouveau_signalement':
      case 'mise_a_jour_dossier':
        navigate('/moderator/signalements-validation');
        break;
      case 'upload_photo':
        navigate('/moderator/photos-moderation');
        break;
      case 'alerte_ia':
        navigate('/moderator/ia-results');
        break;
      case 'verification_identite':
        navigate('/moderator/identity-verification');
        break;
      default:
        if (notification.url_action) {
          navigate(notification.url_action);
        }
    }
  };

  // Formater la date (i18n)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return t('moderator.time.justNow');
    if (diff < 3600000) return t('moderator.time.minutesAgo').replace('{{count}}', String(Math.floor(diff / 60000)));
    if (diff < 86400000) return t('moderator.time.hoursAgo').replace('{{count}}', String(Math.floor(diff / 3600000)));
    if (diff < 604800000) return t('moderator.time.daysAgo').replace('{{count}}', String(Math.floor(diff / 86400000)));

    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <ModerationLayout
      title={t('common.notifications')}
      activeNav="notifications"
    >
      <div className={styles.page}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.headerTitle}>
              <Bell size={28} />
              {t('common.notifications')}
            </h2>
            <p className={styles.headerSubtitle}>
              {t('moderator.dashboardDescription')}
            </p>
          </div>
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              <button
                className={`${styles.toolbarBtn} ${filter === 'all' ? styles.toolbarBtnActive : ''}`}
                onClick={() => setFilter('all')}
              >
                <Filter size={16} /> {t('moderator.notifications.all')}
              </button>
              <button
                className={`${styles.toolbarBtn} ${filter === 'unread' ? styles.toolbarBtnActive : ''}`}
                onClick={() => setFilter('unread')}
              >
                <Bell size={16} /> {t('moderator.notifications.unreadCount').replace('{{count}}', String(stats.unread))}
              </button>
              <button
                className={`${styles.toolbarBtn} ${filter === 'signalement' ? styles.toolbarBtnActive : ''}`}
                onClick={() => setFilter('signalement')}
              >
                <AlertTriangle size={16} /> {t('moderator.notifications.reports')}
              </button>
              <button
                className={`${styles.toolbarBtn} ${filter === 'ia' ? styles.toolbarBtnActive : ''}`}
                onClick={() => setFilter('ia')}
              >
                <Brain size={16} /> IA
              </button>
              <button
                className={`${styles.toolbarBtn} ${filter === 'photo' ? styles.toolbarBtnActive : ''}`}
                onClick={() => setFilter('photo')}
              >
                <Image size={16} /> {t('moderator.photos')}
              </button>
            </div>
            <div className={styles.bulkActions}>
              <button type="button" className={styles.toolbarBtn} onClick={loadNotifications} title={t('moderator.notifications.refresh')}>
                <RefreshCw size={18} />
              </button>
              <button type="button" className={styles.toolbarBtn} onClick={markAllAsRead} disabled={stats.unread === 0} title={t('moderator.notifications.markAllRead')}>
                <CheckCheck size={18} />
              </button>
              {selectedNotifications.size > 0 && (
                <button type="button" className={`${styles.toolbarBtn} ${styles.toolbarBtnDanger}`} onClick={deleteSelected} title={t('moderator.notifications.deleteSelection')}>
                  <Trash2 size={18} /> ({selectedNotifications.size})
                </button>
              )}
            </div>
          </div>
        </header>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Bell size={24} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.total}</span>
              <span className={styles.statLabel}>{t('moderator.notifications.total')}</span>
            </div>
          </div>
          <div className={`${styles.statCard} ${styles.statUnread}`}>
            <AlertTriangle size={24} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.unread}</span>
              <span className={styles.statLabel}>{t('moderator.notifications.unread')}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <CheckCircle size={24} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.signalements}</span>
              <span className={styles.statLabel}>{t('moderator.notifications.reports')}</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <Brain size={24} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stats.ia}</span>
              <span className={styles.statLabel}>{t('moderator.notifications.iaAlerts')}</span>
            </div>
          </div>
        </div>

        <div className={styles.notificationsList}>
          {loading ? (
            <div className={styles.skeletonWrap}>
              <AdminListSkeleton cardCount={6} showFilters={false} />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className={styles.empty}>
              <Bell size={48} />
              <h3>{t('moderator.notifications.empty')}</h3>
              <p>{filter === 'unread' ? t('moderator.notifications.emptyAllRead') : t('moderator.notifications.emptyNone')}</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`${styles.notificationItem} ${!notification.lue ? styles.notificationUnread : ''} ${getPriorityClass(notification.priorite)}`}
              >
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selectedNotifications.has(notification.id)}
                  onChange={() => toggleSelection(notification.id)}
                />
                <div className={styles.notificationIcon} onClick={() => handleNotificationClick(notification)}>
                  {getIcon(notification.type_notification)}
                </div>
                <div className={styles.notificationContent} onClick={() => handleNotificationClick(notification)}>
                  <div className={styles.notificationHeader}>
                    <h4 className={styles.notificationTitle}>{notification.titre}</h4>
                    <span className={styles.notificationTime}>
                      <Clock size={14} />
                      {formatDate(notification.date_creation)}
                    </span>
                  </div>
                  <p className={styles.notificationMessage}>{notification.message}</p>
                  {notification.priorite === 'haute' || notification.priorite === 'urgente' ? (
                    <span className={styles.urgentBadge}>
                      {notification.priorite === 'urgente' ? t('moderator.notifications.urgent') : t('moderator.notifications.important')}
                    </span>
                  ) : null}
                </div>
                <div className={styles.notificationActions}>
                  {!notification.lue && (
                    <button type="button" className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} title={t('moderator.notifications.markAsRead')}>
                      <Check size={18} />
                    </button>
                  )}
                  <button type="button" className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} title={t('common.delete')}>
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </ModerationLayout>
  );
};

export default NotificationsPage;
