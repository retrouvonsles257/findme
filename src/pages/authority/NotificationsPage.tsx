/**
 * =====================================================
 * RETROUVONSLES - Notifications Page
 * Affiche toutes les notifications de l'utilisateur
 * =====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthorityLayout } from '../../components/layout';
import { useAuth } from '../../contexts';
import { useI18n } from '../../hooks';
import { supabase } from '../../config';
import { AdminCardsGridSkeleton } from '../admin/skeletons';
import {
  Bell,
  FileSearch,
  AlertTriangle,
  FolderOpen,
  Brain,
  CheckCircle,
  Users,
  Trash2,
  Check,
  RefreshCw,
  Loader2,
  Inbox,
} from 'lucide-react';
import styles from './NotificationsPage.module.css';

interface NotificationDB {
  id: number;
  type_notification: string;
  titre: string;
  message: string;
  lue: boolean;
  date_creation: string;
  url_action?: string;
  priorite?: string;
}

interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
  lien_action?: string;
  priorite?: string;
  isFromDB: boolean;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const normalizeNotification = (dbNotif: NotificationDB): Notification => ({
    id: String(dbNotif.id),
    type: dbNotif.type_notification,
    titre: dbNotif.titre,
    message: dbNotif.message,
    lu: dbNotif.lue,
    created_at: dbNotif.date_creation,
    lien_action: dbNotif.url_action,
    priorite: dbNotif.priorite,
    isFromDB: true,
  });

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('notification')
        .select('*')
        .eq('id_utilisateur', user.id)
        .order('date_creation', { ascending: false })
        .limit(50);

      if (error) {
        // Erreur silencieuse - fallback activé
        // Fallback
        await fetchFallbackNotifications();
        return;
      }

      const normalizedNotifs = ((data || []) as NotificationDB[]).map(normalizeNotification);
      setNotifications(normalizedNotifs);
    } catch (err) {
      // Erreur silencieuse
      await fetchFallbackNotifications();
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const fetchFallbackNotifications = async () => {
    try {
      const { data: signalements } = await (supabase as any)
        .from('signalement')
        .select('id, created_at, id_dossier, statut_validation, description')
        .eq('statut_validation', 'valide')
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: alertes } = await (supabase as any)
        .from('alerte')
        .select('id, created_at, titre, statut_alerte')
        .order('created_at', { ascending: false })
        .limit(10);

      const fallbackNotifs: Notification[] = [];

      ((signalements || []) as any[]).forEach((sig: any) => {
        fallbackNotifs.push({
          id: `sig-${sig.id}`,
          type: 'signalement_valide',
          titre: t('authority.notificationsPage.fallback.reportValidatedTitle'),
          message: sig.description?.substring(0, 100) || t('authority.notificationsPage.fallback.reportValidatedMessage'),
          lu: false,
          created_at: sig.created_at,
          lien_action: `/authority/signalements/${sig.id}`,
          isFromDB: false,
        });
      });

      ((alertes || []) as any[]).forEach((alerte: any) => {
        fallbackNotifs.push({
          id: `alerte-${alerte.id}`,
          type: 'nouvelle_alerte',
          titre: alerte.titre || t('authority.notificationsPage.fallback.newAlertTitle'),
          message: `${t('authority.notificationsPage.fallback.statusLabel')}: ${alerte.statut_alerte}`,
          lu: false,
          created_at: alerte.created_at,
          lien_action: `/authority/alertes/${alerte.id}`,
          isFromDB: false,
        });
      });

      fallbackNotifs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(fallbackNotifs);
    } catch (err) {
      // Erreur silencieuse
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notif: Notification) => {
    // Marquer comme lu
    if (!notif.lu && notif.isFromDB) {
      try {
        await (supabase as any)
          .from('notification')
          .update({ lue: true, date_lecture: new Date().toISOString() })
          .eq('id', parseInt(notif.id));
      } catch (err) {
        // Erreur silencieuse
      }
    }

    setNotifications(prev =>
      prev.map(n => n.id === notif.id ? { ...n, lu: true } : n)
    );

    if (notif.lien_action) {
      navigate(notif.lien_action);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await (supabase as any)
        .from('notification')
        .update({ lue: true, date_lecture: new Date().toISOString() })
        .eq('id_utilisateur', user.id)
        .eq('lue', false);

      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    } catch (err) {
      // Erreur silencieuse
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
    }
  };

  const deleteNotification = async (notif: Notification) => {
    if (notif.isFromDB) {
      try {
        await (supabase as any)
          .from('notification')
          .delete()
          .eq('id', parseInt(notif.id));
      } catch (err) {
        // Erreur silencieuse
      }
    }

    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signalement':
      case 'signalement_valide':
        return <FileSearch size={20} />;
      case 'alerte':
      case 'nouvelle_alerte':
        return <AlertTriangle size={20} />;
      case 'dossier':
      case 'mise_a_jour_dossier':
        return <FolderOpen size={20} />;
      case 'correspondance_ia':
        return <Brain size={20} />;
      case 'personne_retrouvee':
        return <CheckCircle size={20} />;
      case 'message_autorite':
        return <Users size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${t('authority.notificationsPage.time.todayAt')} ${date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInHours < 48) {
      return `${t('authority.notificationsPage.time.yesterdayAt')} ${date.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.lu;
    if (filter === 'read') return n.lu;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.lu).length;

  return (
    <AuthorityLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <h1><Bell size={24} /> {t('authority.notificationsPage.title')}</h1>
            {unreadCount > 0 && (
              <span className={styles.unreadBadge}>{unreadCount} {t('authority.notificationsPage.unreadCountSuffix')}</span>
            )}
          </div>
          <div className={styles.headerActions}>
            <button 
              className={styles.refreshBtn}
              onClick={fetchNotifications}
              disabled={isLoading}
              title={t('authority.notificationsPage.refresh')}
            >
              <RefreshCw size={18} className={isLoading ? styles.spinning : ''} />
            </button>
            {unreadCount > 0 && (
              <button className={styles.markAllBtn} onClick={markAllAsRead}>
                <Check size={18} /> {t('authority.notificationsPage.markAllRead')}
              </button>
            )}
          </div>
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            {t('authority.notificationsPage.filters.all')} ({notifications.length})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            {t('authority.notificationsPage.filters.unread')} ({unreadCount})
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'read' ? styles.active : ''}`}
            onClick={() => setFilter('read')}
          >
            {t('authority.notificationsPage.filters.read')} ({notifications.length - unreadCount})
          </button>
        </div>

        {isLoading ? (
          <div className={styles.skeletonWrap}>
            <AdminCardsGridSkeleton cardCount={6} />
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className={styles.notificationsList}>
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`${styles.notificationCard} ${!notif.lu ? styles.unread : ''}`}
              >
                <div 
                  className={styles.notificationMain}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className={styles.iconWrapper}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <div className={styles.notificationHeader}>
                      <h3>{notif.titre}</h3>
                      {!notif.lu && <span className={styles.unreadDot} />}
                    </div>
                    <p className={styles.notificationMessage}>{notif.message}</p>
                    <span className={styles.notificationTime}>{formatDate(notif.created_at)}</span>
                  </div>
                </div>
                <div className={styles.notificationActions}>
                  {!notif.lu && (
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationClick({ ...notif, lien_action: undefined });
                      }}
                      title={t('authority.notificationsPage.actions.markRead')}
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notif);
                    }}
                    title={t('authority.notificationsPage.actions.delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Inbox size={48} />
            <h3>{t('authority.notificationsPage.empty.title')}</h3>
            <p>
              {filter === 'unread' 
                ? t('authority.notificationsPage.empty.unread')
                : filter === 'read'
                ? t('authority.notificationsPage.empty.read')
                : t('authority.notificationsPage.empty.all')}
            </p>
          </div>
        )}
      </div>
    </AuthorityLayout>
  );
};

export default NotificationsPage;
