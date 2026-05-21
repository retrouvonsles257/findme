/**
 * =====================================================
 * RETROUVONSLES - Authority Header
 * Header minimal avec toggle sidebar et actions rapides
 * Notifications réelles depuis Supabase
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  RefreshCw,
  FileSearch,
  AlertTriangle,
  CheckCircle,
  Users,
  Brain,
  FolderOpen,
  X,
  Loader2,
  Globe,
  MessageSquare,
  List,
  Grid,
  Maximize2,
} from 'lucide-react';
import { supabase } from '../../../config';
import { useI18n } from '../../../hooks';
import { useAppSelector } from '../../../store/types';
import { selectUser } from '../../../features/auth/store/authSelectors';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { getLanguageName } from '../../../locales';
import { useCoordinationMessages } from '../../../features/coordination';
import { resolveNotificationActionPath } from '../../../utils/resolveNotificationActionPath';
import { useAuth } from '../../../contexts';
import styles from './AuthorityHeader.module.css';

// Interface adaptée au modèle de données réel
interface NotificationDB {
  id: string | number;
  type_notification: string;
  titre: string;
  message: string;
  lue: boolean;
  date_creation: string;
  url_action?: string;
}

// Interface normalisée pour le composant
interface Notification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lu: boolean;
  created_at: string;
  lien_action?: string;
  isFromDB?: boolean;
}

export interface AuthorityHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const AuthorityHeader: React.FC<AuthorityHeaderProps> = ({
  onToggleSidebar,
  sidebarOpen,
}) => {
  const navigate = useNavigate();
  const authReduxUser = useAppSelector(selectUser) as { id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser);
  const { user: authUser } = useAuth();
  /** Même source que CitizenLayout / useCitizenPushSync (auth Redux), avec repli profil users + AuthContext. */
  const notificationUserId =
    authReduxUser?.id ?? (currentUser as { id?: string } | null)?.id ?? authUser?.id ?? undefined;
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [messageView, setMessageView] = useState<'list' | 'compact' | 'expanded'>('list');
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Hook pour les messages de coordination (badge = non lus, marquer comme lu à l'ouverture)
  const {
    messages,
    loading: messagesLoading,
    unreadCount: unreadMessagesCount,
    markAsRead: markMessagesAsRead,
  } = useCoordinationMessages();
  const previewMessageLimit = messageView === 'expanded' ? 10 : messageView === 'compact' ? 5 : 8;
  const previewMessages = useMemo(
    () => messages.slice(-previewMessageLimit).reverse(),
    [messages, previewMessageLimit]
  );

  // Marquer comme lus les messages des autres à l’ouverture du panneau, y compris après chargement asynchrone.
  const markedMessageIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!showMessages) return;
    const userId = authUser?.id ?? (currentUser as { id?: string } | null)?.id;
    if (!userId || messagesLoading) return;
    const fromOthers = previewMessages
      .filter((m) => m.author_id !== userId && !markedMessageIdsRef.current.has(m.id))
      .map((m) => m.id);
    if (fromOthers.length > 0) {
      fromOthers.forEach((id) => markedMessageIdsRef.current.add(id));
      void markMessagesAsRead(fromOthers);
    }
  }, [showMessages, messagesLoading, previewMessages, authUser?.id, currentUser, markMessagesAsRead]);

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (messagesRef.current && !messagesRef.current.contains(event.target as Node)) {
        setShowMessages(false);
      }
    };

    if (showNotifications || showLanguageMenu || showMessages) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showLanguageMenu, showMessages]);

  // Normaliser une notification de la DB vers notre format
  const normalizeNotification = (dbNotif: NotificationDB): Notification => ({
    id: String(dbNotif.id),
    type: dbNotif.type_notification,
    titre: dbNotif.titre,
    message: dbNotif.message,
    lu: dbNotif.lue,
    created_at: dbNotif.date_creation,
    lien_action: dbNotif.url_action || resolveNotificationActionPath(dbNotif, 'authority'),
    isFromDB: true,
  });

  // Charger les notifications réelles depuis Supabase
  const fetchNotifications = useCallback(async () => {
    if (!notificationUserId) return;

    setLoadingNotifications(true);
    try {
      // Utiliser les bons noms de colonnes: date_creation, lue, url_action
      const { data, error } = await (supabase as any)
        .from('notification')
        .select('id, type_notification, titre, message, lue, date_creation, url_action, id_dossier, id_alerte, donnees_supplementaires')
        .eq('id_utilisateur', notificationUserId)
        .order('date_creation', { ascending: false })
        .limit(10);

      if (error) {
        // Erreur silencieuse - fallback activé
        // Si erreur RLS ou table, on utilise des données simulées
        await fetchFallbackNotifications();
        return;
      }

      const normalizedNotifs = ((data || []) as NotificationDB[]).map(normalizeNotification);
      setNotifications(normalizedNotifs);
      setUnreadCount(normalizedNotifs.filter((n) => !n.lu).length);
    } catch (err) {
      // Erreur silencieuse
      await fetchFallbackNotifications();
    } finally {
      setLoadingNotifications(false);
    }
  }, [notificationUserId]);

  // Fallback: créer des notifications basées sur les signalements validés
  const fetchFallbackNotifications = async () => {
    try {
      // Récupérer les signalements récents validés
      const { data: signalements } = await (supabase as any)
        .from('signalement')
        .select('id, created_at, id_dossier, statut_validation, description')
        .eq('statut_validation', 'valide')
        .order('created_at', { ascending: false })
        .limit(5);

      // Récupérer les alertes récentes
      const { data: alertes } = await (supabase as any)
        .from('alerte')
        .select('id, created_at, titre, statut_alerte')
        .order('created_at', { ascending: false })
        .limit(3);

      const fallbackNotifs: Notification[] = [];

      // Ajouter les signalements comme notifications
      ((signalements || []) as any[]).forEach((sig: any) => {
        fallbackNotifs.push({
          id: `sig-${sig.id}`,
          type: 'signalement',
          titre: 'Signalement validé',
          message: sig.description?.substring(0, 50) || 'Nouveau signalement approuvé',
          lu: false,
          created_at: sig.created_at,
          lien_action: `/authority/signalements/${sig.id}`,
          isFromDB: false,
        });
      });

      // Ajouter les alertes comme notifications
      ((alertes || []) as any[]).forEach((alerte: any) => {
        fallbackNotifs.push({
          id: `alerte-${alerte.id}`,
          type: 'alerte',
          titre: alerte.titre || 'Nouvelle alerte',
          message: `Statut: ${alerte.statut_alerte}`,
          lu: false,
          created_at: alerte.created_at,
          lien_action: `/authority/alertes/${alerte.id}`,
          isFromDB: false,
        });
      });

      // Trier par date
      fallbackNotifs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(fallbackNotifs.slice(0, 10));
      setUnreadCount(fallbackNotifs.filter(n => !n.lu).length);
    } catch (err) {
      // Erreur silencieuse
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime INSERT (aligné citoyen : même filtre id_utilisateur + rechargement liste fiable)
  useEffect(() => {
    if (!notificationUserId) return;

    const channelName = `authority-header-notif:${notificationUserId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter: `id_utilisateur=eq.${notificationUserId}`,
        },
        () => {
          void fetchNotifications();
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('[AuthorityHeader] Realtime notifications:', status, channelName);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [notificationUserId, fetchNotifications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      navigate(`/authority/search?q=${encodeURIComponent(q)}`);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Marquer comme lu si c'est une notification de la DB et non lue
    if (!notif.lu && notif.isFromDB) {
      try {
        await (supabase as any)
          .from('notification')
          .update({ lue: true, date_lecture: new Date().toISOString() })
          .eq('id', /^\d+$/.test(String(notif.id)) ? parseInt(String(notif.id), 10) : notif.id);

        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, lu: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        // Erreur silencieuse
      }
    }

    // Pour les notifications fallback, juste les marquer localement
    if (!notif.lu && !notif.isFromDB) {
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, lu: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Naviguer vers le lien
    if (notif.lien_action) {
      navigate(notif.lien_action);
    }
    setShowNotifications(false);
  };

  const markAllAsRead = async () => {
    if (!notificationUserId) return;

    try {
      // Marquer toutes les notifications DB comme lues
      await (supabase as any)
        .from('notification')
        .update({ lue: true, date_lecture: new Date().toISOString() })
        .eq('id_utilisateur', notificationUserId)
        .eq('lue', false);

      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch (err) {
      // Erreur silencieuse
      // Marquer quand même localement
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signalement':
      case 'signalement_valide':
        return <FileSearch size={16} />;
      case 'alerte':
      case 'nouvelle_alerte':
        return <AlertTriangle size={16} />;
      case 'dossier':
      case 'mise_a_jour_dossier':
        return <FolderOpen size={16} />;
      case 'ia':
      case 'correspondance_ia':
        return <Brain size={16} />;
      case 'validation':
      case 'personne_retrouvee':
        return <CheckCircle size={16} />;
      case 'coordination':
      case 'message_autorite':
        return <Users size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleViewAllNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowNotifications(false);
    navigate('/authority/notifications');
  };

  return (
    <header className={styles.header}>
      {/* Left Section: Menu Toggle + App Name */}
      <div className={styles.leftSection}>
        {!sidebarOpen && (
          <button
            className={styles.menuToggle}
            onClick={onToggleSidebar}
            aria-label={t('authority.header.openMenu')}
          >
            <Menu size={22} />
          </button>
        )}
        <span className={`${styles.headerAppName} app-name-bold`}>{t('authority.sidebar.appName')}</span>
      </div>

      {/* Center Section: Search */}
      <form className={styles.searchForm} onSubmit={handleSearch} action="#" method="get">
        <Search size={18} className={styles.searchIcon} aria-hidden />
        <input
          type="search"
          name="authoritySearch"
          autoComplete="off"
          placeholder={t('authority.header.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchSubmitBtn} aria-label={t('authority.search.submit')}>
          <Search size={18} />
        </button>
      </form>

      {/* Right Section: Actions */}
      <div className={styles.rightSection}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => {
            fetchNotifications();
          }}
          title={t('authority.header.refresh')}
        >
          <RefreshCw size={20} />
        </button>

        {/* Language Selector */}
        <div className={styles.languageWrapper} ref={languageMenuRef}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            title={t('authority.header.changeLanguage')}
          >
            <Globe size={20} />
            <span className={styles.languageCode}>{language.toUpperCase()}</span>
          </button>
          {showLanguageMenu && (
            <div className={styles.languageDropdown}>
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  className={`${styles.languageItem} ${language === lang ? styles.active : ''}`}
                  onClick={async () => {
                    await changeLanguage(lang);
                    setShowLanguageMenu(false);
                  }}
                >
                  <Globe size={16} />
                  <span>{getLanguageName(lang)}</span>
                  {language === lang && <CheckCircle size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mini Messagerie */}
        <div className={styles.messagesWrapper} ref={messagesRef}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowMessages(!showMessages)}
            title={t('authority.header.coordinationMessages')}
          >
            <MessageSquare size={20} />
            {unreadMessagesCount > 0 && (
              <span className={styles.messagesBadge}>
                {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
              </span>
            )}
          </button>

          {showMessages && (
            <div className={styles.messagesDropdown}>
              <div className={styles.messagesHeader}>
                <span>{t('authority.header.coordinationMessages')}</span>
                <div className={styles.viewOptions}>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${messageView === 'list' ? styles.active : ''}`}
                    onClick={() => setMessageView('list')}
                    title={t('authority.header.messagesView.list')}
                  >
                    <List size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${messageView === 'compact' ? styles.active : ''}`}
                    onClick={() => setMessageView('compact')}
                    title={t('authority.header.messagesView.compact')}
                  >
                    <Grid size={14} />
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${messageView === 'expanded' ? styles.active : ''}`}
                    onClick={() => setMessageView('expanded')}
                    title={t('authority.header.messagesView.expanded')}
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowMessages(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {messagesLoading ? (
                <div className={styles.loadingMessages}>
                  <Loader2 size={24} className={styles.spinner} />
                  <span>{t('authority.header.loading')}</span>
                </div>
              ) : messages.length > 0 ? (
                <div className={`${styles.messagesList} ${styles[`view${messageView.charAt(0).toUpperCase() + messageView.slice(1)}`]}`}>
                  {previewMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={styles.messageItem}
                      onClick={() => {
                        navigate('/authority/coordination');
                        setShowMessages(false);
                      }}
                    >
                      <div className={styles.messageIcon}>
                        <Users size={16} />
                      </div>
                      <div className={styles.messageContent}>
                        <p className={styles.messageAuthor}>{msg.author}</p>
                        <p className={styles.messageText}>{msg.text.substring(0, messageView === 'compact' ? 30 : 60)}...</p>
                        <span className={styles.messageTime}>
                          {new Date(msg.timestamp).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyMessages}>
                  <MessageSquare size={32} className={styles.emptyIcon} />
                  <p>{t('authority.header.noMessages')}</p>
                </div>
              )}

              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={() => {
                  navigate('/authority/coordination');
                  setShowMessages(false);
                }}
              >
                {t('authority.header.viewAllMessages')}
              </button>
            </div>
          )}
        </div>

        <div className={styles.notificationWrapper} ref={notificationRef}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowNotifications(!showNotifications)}
            title={t('authority.header.notifications')}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadge}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.notificationDropdown}>
              <div className={styles.notificationHeader}>
                <span>{t('authority.header.notifications')}</span>
                {unreadCount > 0 && (
                  <button type="button" className={styles.markAllRead} onClick={markAllAsRead}>
                    {t('authority.header.markAllRead')}
                  </button>
                )}
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={() => setShowNotifications(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {loadingNotifications ? (
                <div className={styles.loadingNotifications}>
                  <Loader2 size={24} className={styles.spinner} />
                  <span>{t('authority.header.loading')}</span>
                </div>
              ) : notifications.length > 0 ? (
                <div className={styles.notificationList}>
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      className={`${styles.notificationItem} ${!notif.lu ? styles.unread : ''}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className={styles.notificationIcon}>
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationTitle}>{notif.titre}</p>
                        <p className={styles.notificationMessage}>{notif.message}</p>
                        <span className={styles.notificationTime}>
                          {formatTimeAgo(notif.created_at)}
                        </span>
                      </div>
                      {!notif.lu && <span className={styles.unreadDot} />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyNotifications}>
                  <Bell size={32} className={styles.emptyIcon} />
                  <p>{t('authority.header.noNotifications')}</p>
                </div>
              )}

              <button
                type="button"
                className={styles.viewAllBtn}
                onClick={handleViewAllNotifications}
              >
                {t('authority.header.viewAllNotifications')}
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default AuthorityHeader;
