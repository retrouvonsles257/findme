/**
 * =====================================================
 * RETROUVONSLES - Moderator Layout
 * Structure alignée Operator / Citizen : sidebar fixe avec image fond, header top, dropdown avatar
 * Image fond sidebar : /assets/images/niveau_3_moderateur.png
 * =====================================================
 */

import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useLogout } from '../../features/auth/hooks/useLogout';
import { supabase } from '../../config';
import {
  Home,
  CheckCircle,
  Image,
  BarChart3,
  LogOut,
  Menu,
  X,
  Globe,
  Brain,
  UserCheck,
  MapPin,
  Bell,
  History,
  Heart,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './ModerationLayout.module.css';

const db = () => supabase as any;

type ModeratorNavId = 'dashboard' | 'profile' | 'validation' | 'photos' | 'reports' | 'ia' | 'identity' | 'map' | 'notifications' | 'history' | 'donations';

interface ModeratorNavItem {
  id: ModeratorNavId;
  labelKey: string;
  path: string;
  icon: typeof Home;
  badge?: number;
}

interface ModeratorNavGroup {
  groupKey: 'principal' | 'moderation' | 'suivi';
  labelKey: string;
  items: ModeratorNavItem[];
}

interface ModerationLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav: ModeratorNavId;
}

const MODERATOR_NAV_BASE: (Omit<ModeratorNavGroup, 'items'> & { items: (Omit<ModeratorNavItem, 'badge'> & { badgeKey?: boolean })[] })[] = [
  {
    groupKey: 'principal',
    labelKey: 'moderator.nav.principal',
    items: [
      { id: 'dashboard', labelKey: 'common.dashboard', path: '/moderator/dashboard', icon: Home },
    ],
  },
  {
    groupKey: 'moderation',
    labelKey: 'moderator.nav.moderation',
    items: [
      { id: 'validation', labelKey: 'moderator.validation', path: '/moderator/signalements-validation', icon: CheckCircle },
      { id: 'photos', labelKey: 'moderator.photoModeration', path: '/moderator/photos-moderation', icon: Image },
      { id: 'ia', labelKey: 'moderator.iaResults', path: '/moderator/ia-results', icon: Brain },
      { id: 'identity', labelKey: 'moderator.identityVerification', path: '/moderator/identity-verification', icon: UserCheck },
      { id: 'map', labelKey: 'moderator.mapView', path: '/moderator/map-view', icon: MapPin },
      { id: 'notifications', labelKey: 'common.notifications', path: '/moderator/notifications', icon: Bell, badgeKey: true },
    ],
  },
  {
    groupKey: 'suivi',
    labelKey: 'moderator.nav.suivi',
    items: [
      { id: 'history', labelKey: 'moderator.activityHistory', path: '/moderator/activity-history', icon: History },
      { id: 'reports', labelKey: 'moderator.reports', path: '/moderator/reports', icon: BarChart3 },
      { id: 'donations', labelKey: 'moderator.donationsMenu', path: '/moderator/donations', icon: Heart },
    ],
  },
];

const SIDEBAR_BG_IMAGE = '/assets/images/niveau_3_moderateur.png';

export const ModerationLayout: React.FC<ModerationLayoutProps> = ({
  children,
  title,
  activeNav,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const { logout, isLoading: isLoggingOut } = useLogout();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('moderatorSidebarCollapsed');
    return saved === 'true';
  });
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const SIDEBAR_SCROLL_KEY = 'moderatorSidebarScrollTop';
  const savedNavScrollRef = useRef(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!(currentUser as any)?.id) return;
      try {
        const { count, error } = await db()
          .from('notification')
          .select('*', { count: 'exact', head: true })
          .eq('id_utilisateur', (currentUser as any).id)
          .eq('lue', false);
        if (!error) setUnreadNotifications(count || 0);
      } catch {
        // ignore
      }
    };
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [(currentUser as any)?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const el = userMenuRef.current;
      if (!el) return;
      const target = event.target as Node;
      if (!el.contains(target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  useEffect(() => {
    localStorage.setItem('moderatorSidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

  useLayoutEffect(() => {
    const el = navRef.current;
    let fromStorage = savedNavScrollRef.current;
    try {
      const v = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
      if (v != null) fromStorage = parseInt(v, 10);
    } catch {}
    if (el && fromStorage > 0) el.scrollTop = fromStorage;
  }, [location.pathname]);

  const moderatorNavGroups: ModeratorNavGroup[] = MODERATOR_NAV_BASE.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      const { badgeKey, ...rest } = it as ModeratorNavItem & { badgeKey?: boolean };
      return {
        ...rest,
        badge: badgeKey && unreadNotifications > 0 ? unreadNotifications : undefined,
      } as ModeratorNavItem;
    }),
  }));

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
    setUserMenuOpen(false);
  };

  const getInitials = () => {
    const u = currentUser as any;
    if (u?.prenom && u?.nom) return `${u.prenom[0]}${u.nom[0]}`.toUpperCase();
    if (u?.email) return u.email.substring(0, 2).toUpperCase();
    return 'M';
  };

  return (
    <div className={styles.layout}>
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''} ${isCollapsed ? styles.sidebarCollapsed : ''}`}
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.78), rgba(15,23,42,0.85)), url('${SIDEBAR_BG_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className={styles.sidebarHeader}>
          {!isCollapsed && (
            <div className={styles.logoContainer}>
              <div className={styles.logoIcon}>
                <span>{t('moderator.sidebar.appName')}</span>
                <span>{t('moderator.sidebar.roleModerator')}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? t('common.openMenu') : t('common.closeMenu')}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
            aria-label={t('common.closeMenu')}
          >
            <X size={24} />
          </button>
        </div>

        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {moderatorNavGroups.map((group) => (
            <div key={group.groupKey} className={styles.navGroup}>
              <div className={styles.navGroupTitle}>{t(group.labelKey)}</div>
              <ul className={styles.navGroupList}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.id;
                  const label = t(item.labelKey);
                  return (
                    <li key={item.id} className={styles.navGroupListItem}>
                      <button
                        type="button"
                        className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                        onClick={() => {
                          if (navRef.current) {
                            savedNavScrollRef.current = navRef.current.scrollTop;
                            try {
                              sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(navRef.current.scrollTop));
                            } catch {}
                          }
                          navigate(item.path);
                          setMobileOpen(false);
                        }}
                        aria-current={active ? 'page' : undefined}
                        aria-label={label}
                      >
                        <span className={styles.navItemIcon}>
                          <Icon size={20} />
                          {item.badge !== undefined && item.badge > 0 && (
                            <span className={styles.navBadge}>
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
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

        <div className={styles.userSection} ref={userMenuRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title={isCollapsed ? (currentUser as any)?.prenom : undefined}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className={styles.userAvatarPlaceholder}>{getInitials()}</div>
            {!isCollapsed && (
              <span className={styles.userName}>
                {(currentUser as any)?.prenom && (currentUser as any)?.nom
                  ? `${(currentUser as any).prenom} ${(currentUser as any).nom}`
                  : (currentUser as any)?.email || t('moderator.sidebar.roleModerator')}
              </span>
            )}
          </button>
          {userMenuOpen && (
            <div className={`${styles.userMenu} ${isCollapsed ? styles.userMenuCollapsed : ''}`}>
              <button
                type="button"
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/moderator/profile');
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                <User size={18} />
                <span>{t('common.profile')}</span>
              </button>
              <button type="button" className={styles.userMenuItem} onClick={toggleLanguage}>
                <Globe size={18} />
                <span>{language === 'fr' ? t('common.english') : t('common.french')}</span>
              </button>
              <div className={styles.userMenuDivider} />
              <button
                type="button"
                className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
                onClick={() => {
                  handleLogout();
                  setUserMenuOpen(false);
                }}
                disabled={isLoggingOut}
              >
                <LogOut size={18} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className={`${styles.main} ${isCollapsed ? styles.mainExpanded : ''}`}>
        <header className={styles.topHeader}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMobileOpen(true)}
            aria-label={t('common.menu')}
          >
            <Menu size={24} />
          </button>
          <div className={styles.topHeaderRight}>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              onClick={() => navigate('/moderator/donations')}
              title={t('common.support')}
            >
              <Heart size={18} />
              <span>{t('common.support')}</span>
            </button>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              onClick={toggleLanguage}
              title={t('common.language')}
            >
              <Globe size={18} />
              <span className={styles.topHeaderLangCode}>{language === 'fr' ? 'FR' : 'EN'}</span>
            </button>
            <div className={styles.topHeaderUser}>
              <div className={styles.topHeaderUserAvatar}>{getInitials()}</div>
              <span className={styles.topHeaderUserName}>
                {(currentUser as any)?.prenom && (currentUser as any)?.nom
                  ? `${(currentUser as any).prenom} ${(currentUser as any).nom}`
                  : (currentUser as any)?.email || t('moderator.sidebar.roleModerator')}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <h1 className={styles.pageTitle}>{title}</h1>
          <div className={styles.contentInner}>{children}</div>
        </div>
      </div>
    </div>
  );
};

export default ModerationLayout;
