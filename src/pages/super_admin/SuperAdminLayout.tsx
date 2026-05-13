/**
 * =====================================================
 * RETROUVONSLES - Super Admin Layout
 * Structure alignée sur Admin : navigation par groupes + section utilisateur + persistance scroll
 * =====================================================
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector, useAppDispatch } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { logoutThunk } from '../../features/auth/store/authThunks';
import { supabase } from '../../config';
import { APP_LOGO_SRC } from '../../config/branding';
import {
  LayoutDashboard,
  Globe,
  Building2,
  Users,
  Settings,
  FileText,
  Activity,
  BellRing,
  DatabaseBackup,
  LogOut,
  Menu,
  X,
  UserCog,
  User,
  Search,
  ChevronRight,
  ChevronLeft,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import styles from './SuperAdminLayout.module.css';

type ActiveNavType =
  | 'dashboard'
  | 'organisations'
  | 'system-users'
  | 'security-access'
  | 'system-logs'
  | 'system-settings'
  | 'observability'
  | 'backup-retention'
  | 'system-notifications'
  | 'roles'
  | 'profile';

interface SuperAdminNavItem {
  id: ActiveNavType;
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}

interface SuperAdminNavGroup {
  groupKey: 'overview' | 'organisations' | 'system' | 'profile';
  labelKey: string;
  items: SuperAdminNavItem[];
}

const SUPER_ADMIN_NAV_GROUPS: SuperAdminNavGroup[] = [
  {
    groupKey: 'overview',
    labelKey: 'super_admin.nav.overview',
    items: [
      { id: 'dashboard', labelKey: 'common.dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    groupKey: 'organisations',
    labelKey: 'super_admin.nav.organisations',
    items: [
      { id: 'organisations', labelKey: 'super_admin.organisations', path: '/super-admin/organisations', icon: Building2 },
    ],
  },
  {
    groupKey: 'system',
    labelKey: 'super_admin.nav.system',
    items: [
      { id: 'system-users', labelKey: 'super_admin.systemUsersMenu', path: '/super-admin/system-users', icon: Users },
      { id: 'roles', labelKey: 'super_admin.rolesMenu', path: '/super-admin/roles', icon: UserCog },
      { id: 'security-access', labelKey: 'super_admin.securityAccessMenu', path: '/super-admin/security-access', icon: ShieldCheck },
      { id: 'system-logs', labelKey: 'super_admin.systemLogsMenu', path: '/super-admin/system-logs', icon: FileText },
      { id: 'system-settings', labelKey: 'super_admin.systemSettingsMenu', path: '/super-admin/system-settings', icon: Settings },
      { id: 'observability', labelKey: 'super_admin.observabilityMenu', path: '/super-admin/observability', icon: Activity },
      { id: 'backup-retention', labelKey: 'super_admin.backupRetentionMenu', path: '/super-admin/backup-retention', icon: DatabaseBackup },
      { id: 'system-notifications', labelKey: 'super_admin.systemNotificationsMenu', path: '/super-admin/system-notifications', icon: BellRing },
    ],
  },
  {
    groupKey: 'profile',
    labelKey: 'super_admin.nav.profile',
    items: [
      { id: 'profile', labelKey: 'super_admin.profileMenu', path: '/super-admin/profile', icon: User },
    ],
  },
];

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav?: ActiveNavType;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  title,
  activeNav,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('superAdminSidebarCollapsed');
    return saved === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = 'superAdminSidebarScrollTop';
  const savedNavScrollRef = useRef(0);
  const [headerSearch, setHeaderSearch] = useState('');
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);

  const loadPhotoProfil = useCallback(async (userId: string) => {
    try {
      const { data } = await (supabase as any)
        .from('utilisateur')
        .select('photo_profil')
        .eq('id', userId)
        .maybeSingle();
      setPhotoProfil(data?.photo_profil || null);
    } catch {
      setPhotoProfil(null);
    }
  }, []);

  useEffect(() => {
    const uid = (currentUser as any)?.id;
    if (uid) loadPhotoProfil(uid);
    else setPhotoProfil(null);
  }, [currentUser, loadPhotoProfil, location.pathname]);

  useEffect(() => {
    localStorage.setItem('superAdminSidebarCollapsed', String(isCollapsed));
  }, [isCollapsed]);

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
    await dispatch(logoutThunk());
    navigate('/auth/login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
    setUserMenuOpen(false);
  };

  const getInitials = () => {
    const user = currentUser as any;
    const name = user?.prenom || user?.nom_complet || user?.email;
    if (!name) return 'SA';
    const parts = String(name).split(' ').filter(Boolean);
    if (parts.length === 0) return 'SA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getUserLabel = () => {
    const user = currentUser as any;
    return user?.prenom || user?.nom_complet || user?.email || t('super_admin.layoutSuperAdminFallback');
  };

  const handleHeaderSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = headerSearch.trim();
    if (query) {
      navigate(`/super-admin/system-users?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/super-admin/system-users');
    }
  };

  const isActive = (itemId: ActiveNavType, itemPath: string) => {
    if (activeNav) return activeNav === itemId;
    return location.pathname.startsWith(itemPath);
  };

  /* Restaurer le scroll du sidebar après navigation (sessionStorage, comme Admin) */
  useLayoutEffect(() => {
    const el = navRef.current;
    const fromStorage = (() => {
      try {
        const v = sessionStorage.getItem(SIDEBAR_SCROLL_KEY);
        return v != null ? parseInt(v, 10) : savedNavScrollRef.current;
      } catch {
        return savedNavScrollRef.current;
      }
    })();
    const saved = fromStorage > 0 ? fromStorage : savedNavScrollRef.current;
    if (el && saved > 0) {
      el.scrollTop = saved;
    }
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
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''} ${
          isCollapsed ? styles.sidebarCollapsed : ''
        }`}
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.96)), url('/assets/images/niveau_7_super_admin.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className={styles.sidebarHeader}>
          {!isCollapsed && (
            <div className={styles.logoContainer}>
              <img src={APP_LOGO_SRC} alt="" className={`app-brand-logo ${styles.sidebarLogoImg}`} />
            </div>
          )}

          <button
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? t('super_admin.layoutOpenMenu') : t('super_admin.layoutReduceMenu')}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          <button
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation par groupes (aligné Admin) */}
        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {SUPER_ADMIN_NAV_GROUPS.map((group) => (
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

        {/* User section */}
        <div className={styles.userSection} ref={userMenuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title={isCollapsed ? getUserLabel() : undefined}
          >
            <div className={styles.userAvatarPlaceholder}>
              {photoProfil ? (
                <img src={photoProfil} alt="" className={styles.userAvatarImg} />
              ) : (
                getInitials()
              )}
            </div>
            {!isCollapsed && <span className={styles.userName}>{getUserLabel()}</span>}
          </button>

          {userMenuOpen && (
            <div className={styles.userMenu}>
              <button
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/super-admin/profile');
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
                <span>{language === 'fr' ? t('super_admin.layoutLanguageEn') : t('super_admin.layoutLanguageFr')}</span>
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
        {/* Header desktop */}
        <header className={styles.topHeader}>
          <span className={`${styles.topHeaderAppName} app-name-bold`}>{t('super_admin.layoutAppName')}</span>
          <form className={styles.topHeaderSearchForm} onSubmit={handleHeaderSearch}>
            <Search size={18} className={styles.topHeaderSearchIcon} />
            <input
              type="text"
              placeholder={t('common.search') || t('super_admin.layoutSearchPlaceholder')}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className={styles.topHeaderSearchInput}
            />
          </form>

          <div className={styles.topHeaderRight}>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              title={t('common.notifications') || t('super_admin.layoutNotifications')}
              onClick={() => navigate('/super-admin/system-logs')}
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              onClick={toggleLanguage}
              title={t('common.language')}
            >
              <Globe size={18} />
              <span>{language.toUpperCase()}</span>
            </button>
            <button
              type="button"
              className={styles.topHeaderUser}
              onClick={() => navigate('/super-admin/profile')}
              title={getUserLabel()}
            >
              <div className={styles.topHeaderUserAvatarPlaceholder}>
                {photoProfil ? (
                  <img src={photoProfil} alt="" className={styles.userAvatarImg} />
                ) : (
                  getInitials()
                )}
              </div>
              <span className={styles.topHeaderUserName}>{getUserLabel()}</span>
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
          <span className={`${styles.appName} app-name-bold`}>{t('super_admin.layoutAppName')}</span>
          <div className={styles.mobileHeaderRight}>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              title={t('common.notifications') || t('super_admin.layoutNotifications')}
              onClick={() => navigate('/super-admin/system-logs')}
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              onClick={toggleLanguage}
              title={t('common.language')}
            >
              <Globe size={18} />
            </button>
            <button
              type="button"
              className={styles.mobileAvatarBtn}
              onClick={() => setMobileOpen(true)}
            >
              <div className={styles.mobileAvatarPlaceholder}>
                {photoProfil ? (
                  <img src={photoProfil} alt="" className={styles.userAvatarImg} />
                ) : (
                  getInitials()
                )}
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
