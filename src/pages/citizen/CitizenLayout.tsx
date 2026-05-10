/**
 * =====================================================
 * RETROUVONSLES - Citizen Layout
 * Navigation par groupes + persistance scroll (aligné Admin)
 * =====================================================
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useLogout } from '../../features/auth/hooks';
import { useNotifications } from '../../features/notifications/hooks';
import { maybeSyncCitizenGpsToProfileDebounced } from '../../features/users/services/citizenLocationSync';
import {
  CITIZEN_PERM_GEO_ASKED_KEY,
  CITIZEN_PERM_NOTIF_ASKED_KEY,
  CITIZEN_PERM_ONBOARDING_DONE_KEY,
  PUSH_NOTIFICATION_ONBOARDING_DELAY_MS,
} from '../../features/notifications/constants/citizenPushOnboarding';
import { supabase } from '../../config';
import { 
  Menu, 
  X, 
  Home, 
  Map, 
  Bell, 
  Search,
  FileText, 
  Plus, 
  Settings, 
  LogOut, 
  Globe,
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Heart
} from 'lucide-react';
import styles from './CitizenLayout.module.css';

type CitizenNavId = 'dashboard' | 'dossiers' | 'map' | 'alerts' | 'signalements' | 'new-signalement' | 'donations' | 'settings';

interface CitizenNavItem {
  id: CitizenNavId;
  labelKey: string;
  path: string;
  icon: typeof Home;
}

interface CitizenNavGroup {
  groupKey: 'principal' | 'signalements' | 'parametres';
  labelKey: string;
  items: CitizenNavItem[];
}

const CITIZEN_NAV_GROUPS: CitizenNavGroup[] = [
  {
    groupKey: 'principal',
    labelKey: 'citizen.nav.principal',
    items: [
      { id: 'dashboard', labelKey: 'common.dashboard', path: '/citizen/dashboard', icon: Home },
      { id: 'dossiers', labelKey: 'citizen.dossiers', path: '/citizen/dossiers', icon: Users },
      { id: 'map', labelKey: 'citizen.map', path: '/citizen/map', icon: Map },
      { id: 'alerts', labelKey: 'citizen.alerts', path: '/citizen/alerts', icon: Bell },
    ],
  },
  {
    groupKey: 'signalements',
    labelKey: 'citizen.nav.signalements',
    items: [
      { id: 'signalements', labelKey: 'common.reports', path: '/citizen/my-signalements', icon: FileText },
      { id: 'new-signalement', labelKey: 'citizen.newReport', path: '/citizen/dossiers?mode=report', icon: Plus },
      { id: 'donations', labelKey: 'citizen.donations', path: '/citizen/donations', icon: Heart },
    ],
  },
  {
    groupKey: 'parametres',
    labelKey: 'citizen.nav.parametres',
    items: [
      { id: 'settings', labelKey: 'citizen.settings', path: '/citizen/settings', icon: Settings },
    ],
  },
];

interface CitizenLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
}

export const CitizenLayout: React.FC<CitizenLayoutProps> = ({ 
  children, 
  activeNav 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const { logout: performLogout } = useLogout();
  const userId = (currentUser as any)?.id;
  const isGuestSession = Boolean((currentUser as any)?.is_anonymous);
  const { unreadCount, fetchNotifications } = useNotifications();
  const PERM_ONBOARDING_DONE_KEY = CITIZEN_PERM_ONBOARDING_DONE_KEY;
  const PERM_NOTIF_ASKED_KEY = CITIZEN_PERM_NOTIF_ASKED_KEY;
  const PERM_GEO_ASKED_KEY = CITIZEN_PERM_GEO_ASKED_KEY;

  /** Onboarding permissions (une fois): notifications puis localisation — y compris invité anonyme (auth.uid() valide). */
  useEffect(() => {
    if (!userId) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const run = async () => {
      const done = localStorage.getItem(PERM_ONBOARDING_DONE_KEY) === 'true';
      if (done) return;

      // 1) Notifications d'abord (une seule demande si permission "default")
      if ('Notification' in window) {
        const notifAsked = localStorage.getItem(PERM_NOTIF_ASKED_KEY) === 'true';
        if (!notifAsked && Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch {
            // noop
          } finally {
            localStorage.setItem(PERM_NOTIF_ASKED_KEY, 'true');
          }
        }
      } else {
        localStorage.setItem(PERM_NOTIF_ASKED_KEY, 'true');
      }

      if (cancelled) return;

      // 2) Ensuite localisation (une seule demande si état "prompt")
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        const geoAsked = localStorage.getItem(PERM_GEO_ASKED_KEY) === 'true';
        const requestGeo = () =>
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!cancelled) {
                void maybeSyncCitizenGpsToProfileDebounced(
                  userId,
                  pos.coords.latitude,
                  pos.coords.longitude,
                );
              }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
          );

        if (!geoAsked) {
          if (navigator.permissions?.query) {
            try {
              const r = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
              if (r.state === 'granted') {
                requestGeo();
                localStorage.setItem(PERM_GEO_ASKED_KEY, 'true');
              } else if (r.state === 'prompt') {
                requestGeo();
                localStorage.setItem(PERM_GEO_ASKED_KEY, 'true');
              } else {
                localStorage.setItem(PERM_GEO_ASKED_KEY, 'true');
              }
            } catch {
              requestGeo();
              localStorage.setItem(PERM_GEO_ASKED_KEY, 'true');
            }
          } else {
            requestGeo();
            localStorage.setItem(PERM_GEO_ASKED_KEY, 'true');
          }
        }
      } else {
        localStorage.setItem(PERM_GEO_ASKED_KEY, 'true');
      }

      localStorage.setItem(PERM_ONBOARDING_DONE_KEY, 'true');
    };

    const timer = window.setTimeout(() => {
      void run();
    }, PUSH_NOTIFICATION_ONBOARDING_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [userId]);

  // États
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('citizenSidebarCollapsed');
    return saved === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = 'citizenSidebarScrollTop';
  const savedNavScrollRef = useRef(0);
  const [headerSearch, setHeaderSearch] = useState('');
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);

  const loadPhotoProfil = useCallback(async (uid: string) => {
    try {
      const { data } = await (supabase as any)
        .from('utilisateur')
        .select('photo_profil')
        .eq('id', uid)
        .maybeSingle();
      setPhotoProfil(data?.photo_profil || null);
    } catch {
      setPhotoProfil(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      let uid = userId;
      if (!uid && typeof (supabase as any)?.auth?.getUser === 'function') {
        const { data: { user } } = await (supabase as any).auth.getUser();
        uid = user?.id;
      }
      if (uid) loadPhotoProfil(uid);
      else setPhotoProfil(null);
    };
    load();
  }, [userId, loadPhotoProfil, location.pathname]);

  // Sauvegarder l'état du sidebar
  useEffect(() => {
    localStorage.setItem('citizenSidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Charger les notifications pour le header
  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
    }
  }, [userId, fetchNotifications]);

  // Fermer le menu utilisateur au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await performLogout();
    navigate('/auth/login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
    setUserMenuOpen(false);
  };

  const getInitials = () => {
    const user = currentUser as any;
    if (user?.nom_complet) {
      return user.nom_complet.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserPhoto = (): string | null => {
    if (photoProfil) return photoProfil;
    const user = currentUser as any;
    return user?.photo_profil || user?.avatar_url || null;
  };

  const photo = getUserPhoto();

  const handleHeaderSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = headerSearch.trim();
    if (query) {
      navigate(`/citizen/my-signalements?q=${encodeURIComponent(query)}`);
    } else {
      navigate('/citizen/my-signalements');
    }
  };

  const isActive = (itemId: string, itemPath: string) => {
    if (activeNav) return activeNav === itemId;
    return location.pathname === itemPath || (itemPath.includes('?') && location.pathname === itemPath.split('?')[0]);
  };

  useLayoutEffect(() => {
    const el = navRef.current;
    let fromStorage = savedNavScrollRef.current;
    try {
      const v = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
      if (v != null) fromStorage = parseInt(v, 10);
    } catch {}
    if (el && fromStorage > 0) el.scrollTop = fromStorage;
  }, [location.pathname]);

  return (
    <div className={styles.layout}>
      {/* Overlay mobile */}
      {mobileOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.85)), url('/assets/images/niveau_0_citoyen_standard.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Header du sidebar */}
        <div className={styles.sidebarHeader}>
          {!isCollapsed && (
            <div className={styles.logoContainer}>
              <img src="/android/mipmap-hdpi/ic_launcher.png" alt="" className={styles.sidebarLogoImg} />
            </div>
          )}

          {/* Bouton toggle desktop */}
          <button 
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? t('citizen.openSidebar') : t('citizen.closeSidebar')}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {/* Bouton fermer mobile */}
          <button 
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation par groupes (aligné Admin) */}
        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {CITIZEN_NAV_GROUPS.map((group) => (
            <div key={group.groupKey} className={styles.navGroup}>
              <div
                className={styles.navGroupTitle}
                id={isCollapsed ? undefined : `nav-group-${group.groupKey}`}
                aria-hidden={isCollapsed}
              >
                {t(group.labelKey)}
              </div>
              <ul
                className={styles.navGroupList}
                aria-labelledby={isCollapsed ? undefined : `nav-group-${group.groupKey}`}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.id, item.path);
                  const label = t(item.labelKey);
                  return (
                    <li key={item.id} className={styles.navGroupListItem}>
                      <button
                        type="button"
                        className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                        onClick={() => {
                          if (navRef.current) {
                            const top = navRef.current.scrollTop;
                            savedNavScrollRef.current = top;
                            try {
                              sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(top));
                            } catch {}
                          }
                          navigate(item.path);
                          setMobileOpen(false);
                        }}
                        title={isCollapsed ? label : undefined}
                        aria-current={active ? 'page' : undefined}
                        aria-label={label}
                      >
                        <span className={styles.navItemIcon} aria-hidden>
                          <Icon size={20} />
                        </span>
                        {!isCollapsed && <span>{label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section en bas */}
        <div className={styles.userSection} ref={userMenuRef}>
          <button 
            className={styles.userBtn}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title={isCollapsed ? (currentUser as any)?.nom_complet || (currentUser as any)?.email : undefined}
          >
            <div className={styles.userAvatarPlaceholder}>
              {photo ? (
                <img src={photo} alt="" className={styles.userAvatarImg} />
              ) : (
                getInitials()
              )}
            </div>
            {!isCollapsed && (
              <span className={styles.userName}>
                {(currentUser as any)?.nom_complet || (currentUser as any)?.email || 'User'}
              </span>
            )}
          </button>

          {/* Menu dropdown */}
          {userMenuOpen && (
            <div className={`${styles.userMenu} ${isCollapsed ? styles.userMenuCollapsed : ''}`}>
              <button 
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/citizen/profile');
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                <User size={18} />
                <span>{t('common.profile')}</span>
              </button>
              <button 
                className={styles.userMenuItem}
                onClick={toggleLanguage}
              >
                <Globe size={18} />
                <span>{language === 'fr' ? 'English' : 'Français'}</span>
              </button>
              <div className={styles.userMenuDivider} />
              <button 
                className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
                onClick={handleLogout}
              >
                <LogOut size={18} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={`${styles.main} ${isCollapsed ? styles.mainExpanded : ''}`}>
        {/* Header desktop (search + langue + notifications + user) */}
        <header className={styles.topHeader}>
          <span className={`${styles.topHeaderAppName} app-name-bold`}>{t('common.appName')}</span>
          <form className={styles.topHeaderSearchForm} onSubmit={handleHeaderSearch}>
            <Search size={18} className={styles.topHeaderSearchIcon} />
            <input
              type="text"
              placeholder={t('citizen.searchReports')}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className={styles.topHeaderSearchInput}
            />
          </form>

          <div className={styles.topHeaderRight}>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              onClick={toggleLanguage}
              title={language === 'fr' ? 'English' : 'Français'}
            >
              <Globe size={18} />
              <span className={styles.topHeaderLangCode}>{language.toUpperCase()}</span>
            </button>

            <button
              type="button"
              className={styles.topHeaderIconBtn}
              onClick={() => navigate('/citizen/notifications')}
              title={t('common.notifications')}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.topHeaderNotificationBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              className={styles.topHeaderDonateBtn}
              onClick={() => navigate('/citizen/donations')}
              title={t('citizen.donations') || 'Soutenir le projet'}
            >
              <Heart size={18} />
              <span>{t('common.support') || 'Soutenir'}</span>
            </button>
          </div>
        </header>

        {/* Header mobile */}
        <header className={styles.mobileHeader}>
          <button 
            className={styles.menuBtn}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
          <span className={`${styles.appName} app-name-bold`}>{t('common.appName')}</span>
          <div className={styles.mobileHeaderRight}>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              onClick={toggleLanguage}
              title={language === 'fr' ? 'English' : 'Français'}
            >
              <Globe size={18} />
            </button>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              onClick={() => navigate('/citizen/notifications')}
              title={t('common.notifications')}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className={styles.topHeaderNotificationBadge}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Avatar dans le header mobile */}
            <button 
              type="button"
              className={styles.mobileAvatarBtn}
              onClick={() => setMobileOpen(true)}
            >
              <div className={styles.mobileAvatarPlaceholder}>
                {photo ? (
                  <img src={photo} alt="" className={styles.userAvatarImg} />
                ) : (
                  getInitials()
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          {isGuestSession && (
            <div className={styles.guestBanner} role="status">
              <p className={styles.guestBannerText}>
                <strong>{t('citizen.guestBannerTitle')}</strong> — {t('citizen.guestBannerBody')}
              </p>
              <Link className={styles.guestBannerLink} to="/auth/register">
                {t('citizen.guestBannerCta')}
              </Link>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
