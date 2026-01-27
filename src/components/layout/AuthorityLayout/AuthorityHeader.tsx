/**
 * =====================================================
 * RETROUVONSLES - Authority Header
 * Header minimal avec toggle sidebar et actions rapides
 * Notifications réelles depuis Supabase
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  Plus,
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
  ChevronDown,
} from 'lucide-react';
import { supabase } from '../../../config';
import { useAuth } from '../../../contexts';
import { useI18n } from '../../../hooks';
import { getLanguageName } from '../../../locales';
import styles from './AuthorityHeader.module.css';

// Interface adaptée au modèle de données réel
interface NotificationDB {
  id: number;
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
  const { user } = useAuth();
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  // Fermer les dropdowns quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    if (showNotifications || showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showLanguageMenu]);

  // Normaliser une notification de la DB vers notre format
  const normalizeNotification = (dbNotif: NotificationDB): Notification => ({
    id: String(dbNotif.id),
    type: dbNotif.type_notification,
    titre: dbNotif.titre,
    message: dbNotif.message,
    lu: dbNotif.lue,
    created_at: dbNotif.date_creation,
    lien_action: dbNotif.url_action,
    isFromDB: true,
  });

  // Charger les notifications réelles depuis Supabase
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoadingNotifications(true);
    try {
      // Utiliser les bons noms de colonnes: date_creation, lue, url_action
      const { data, error } = await (supabase as any)
        .from('notification')
        .select('authority.id, type_notification, titre, message, lue, date_creation, url_action')
        .eq('id_utilisateur', user.id)
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
  }, [user?.id]);

  // Fallback: créer des notifications basées sur les signalements validés
  const fetchFallbackNotifications = async () => {
    try {
      // Récupérer les signalements récents validés
      const { data: signalements } = await (supabase as any)
        .from('signalement')
        .select('authority.id, created_at, id_dossier, statut_validation, description')
        .eq('statut_validation', 'valide')
        .order('created_at', { ascending: false })
        .limit(5);

      // Récupérer les alertes récentes
      const { data: alertes } = await (supabase as any)
        .from('alerte')
        .select('authority.id, created_at, titre, statut_alerte')
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

  // Subscription temps réel pour les nouvelles notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter: `id_utilisateur=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = normalizeNotification(payload.new as NotificationDB);
          setNotifications(prev => [newNotif, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/authority/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleNewDossier = () => {
    navigate('/authority/dossiers/new');
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Marquer comme lu si c'est une notification de la DB et non lue
    if (!notif.lu && notif.isFromDB) {
      try {
        await (supabase as any)
          .from('notification')
          .update({ lue: true, date_lecture: new Date().toISOString() })
          .eq('id', parseInt(notif.id));
        
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
    if (!user?.id) return;

    try {
      // Marquer toutes les notifications DB comme lues
      await (supabase as any)
        .from('notification')
        .update({ lue: true, date_lecture: new Date().toISOString() })
        .eq('id_utilisateur', user.id)
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
      {/* Left Section: Menu Toggle */}
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
      </div>

      {/* Center Section: Search */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder={t('authority.header.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </form>

      {/* Right Section: Actions */}
      <div className={styles.rightSection}>
        <button 
          className={styles.actionBtn}
          onClick={handleNewDossier}
          title={t('authority.header.newDossier')}
        >
          <Plus size={20} />
          <span className={styles.actionLabel}>{t('authority.header.new')}</span>
        </button>

        <button 
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

        <div className={styles.notificationWrapper} ref={notificationRef}>
          <button 
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
                  <button className={styles.markAllRead} onClick={markAllAsRead}>
                    {t('authority.header.markAllRead')}
                  </button>
                )}
                <button 
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
