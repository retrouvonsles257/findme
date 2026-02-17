/**
 * =====================================================
 * RETROUVONSLES - Operator Layout
 * Structure alignée Citizen / Super Admin : sidebar fixe avec image fond, header top, contenu
 * Image fond sidebar : /assets/images/niveau_2_operateur_saisie.png
 * =====================================================
 */

import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { useLogout } from '../../features/auth/hooks';
import {
  Menu,
  X,
  LogOut,
  Globe,
  User,
  LayoutDashboard,
  FolderPlus,
  FolderOpen,
  UserPlus,
  Users,
  HeartHandshake,
  AlertCircle,
  Image,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import styles from './OperatorLayout.module.css';

type OperatorNavId =
  | 'dashboard'
  | 'create-dossier'
  | 'create-person'
  | 'personnes'
  | 'my-dossiers'
  | 'donations'
  | 'signalements-en-attente'
  | 'photos-en-attente';

interface OperatorNavItem {
  id: OperatorNavId;
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}

interface OperatorNavGroup {
  groupKey: 'principal' | 'suivi';
  labelKey: string;
  items: OperatorNavItem[];
}

const OPERATOR_NAV_GROUPS: OperatorNavGroup[] = [
  {
    groupKey: 'principal',
    labelKey: 'operator.nav.principal',
    items: [
      { id: 'dashboard', labelKey: 'common.dashboard', path: '/operator/dashboard', icon: LayoutDashboard },
      { id: 'create-dossier', labelKey: 'operator.createDossier', path: '/operator/create-dossier', icon: FolderPlus },
      { id: 'create-person', labelKey: 'operator.createPerson', path: '/operator/create-person', icon: UserPlus },
      { id: 'personnes', labelKey: 'operator.personnesMenu', path: '/operator/personnes', icon: Users },
      { id: 'my-dossiers', labelKey: 'operator.myDossiers', path: '/operator/my-dossiers', icon: FolderOpen },
    ],
  },
  {
    groupKey: 'suivi',
    labelKey: 'operator.nav.suivi',
    items: [
      { id: 'donations', labelKey: 'operator.donsMenu', path: '/operator/donations', icon: HeartHandshake },
      { id: 'signalements-en-attente', labelKey: 'operator.signalementsEnAttenteMenu', path: '/operator/signalements-en-attente', icon: AlertCircle },
      { id: 'photos-en-attente', labelKey: 'operator.photosEnAttenteMenu', path: '/operator/photos-en-attente', icon: Image },
    ],
  },
];

const SIDEBAR_BG_IMAGE = '/assets/images/niveau_2_operateur_saisie.png';

interface OperatorLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const OperatorLayout: React.FC<OperatorLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const { logout } = useLogout();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('operatorSidebarCollapsed');
    return saved === 'true';
  });
  const navRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const SIDEBAR_SCROLL_KEY = 'operatorSidebarScrollTop';
  const savedNavScrollRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const el = userMenuRef.current;
      if (!el) return;
      const target = event.target as Node;
      if (!el.contains(target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
    setUserMenuOpen(false);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const isActive = (path: string) =>
    location.pathname.startsWith(path) || location.pathname === path;

  useEffect(() => {
    localStorage.setItem('operatorSidebarCollapsed', String(isCollapsed));
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

  return (
    <div className={styles.layout}>
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
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
                <span>RetrouvonsLes</span>
                <span>Opérateur</span>
              </div>
            </div>
          )}
          <button
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? (t('common.openMenu') || 'Ouvrir le menu') : (t('common.closeMenu') || 'Réduire le menu')}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
            aria-label={t('common.closeMenu')}
          >
            <X size={24} />
          </button>
        </div>

        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {OPERATOR_NAV_GROUPS.map((group) => (
            <div key={group.groupKey} className={styles.navGroup}>
              <div className={styles.navGroupTitle}>{t(group.labelKey)}</div>
              <ul className={styles.navGroupList}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
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
                              sessionStorage.setItem(
                                SIDEBAR_SCROLL_KEY,
                                String(navRef.current.scrollTop)
                              );
                            } catch {}
                          }
                          navigate(item.path);
                          setMobileOpen(false);
                        }}
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

        <div className={styles.userSection} ref={userMenuRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            title={isCollapsed ? currentUser?.nom_complet || 'Opérateur' : undefined}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className={styles.userAvatarPlaceholder}>
              {getInitials(currentUser?.nom_complet)}
            </div>
            {!isCollapsed && (
              <span className={styles.userName}>
                {currentUser?.nom_complet || 'Opérateur'}
              </span>
            )}
          </button>
          {userMenuOpen && (
            <div className={`${styles.userMenu} ${isCollapsed ? styles.userMenuCollapsed : ''}`}>
              <button
                type="button"
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/operator/dashboard');
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                <User size={18} />
                <span>{t('common.profile')}</span>
              </button>
              <button
                type="button"
                className={styles.userMenuItem}
                onClick={toggleLanguage}
              >
                <Globe size={18} />
                <span>{language === 'fr' ? 'English' : 'Français'}</span>
              </button>
              <div className={styles.userMenuDivider} />
              <button
                type="button"
                className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
                onClick={() => {
                  handleLogout();
                  setUserMenuOpen(false);
                }}
              >
                <LogOut size={18} />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div
        className={`${styles.main} ${isCollapsed ? styles.mainExpanded : ''}`}
      >
        <header className={styles.topHeader}>
          <button
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
              onClick={toggleLanguage}
              title={t('common.language')}
            >
              <Globe size={18} />
              <span className={styles.topHeaderLangCode}>
                {language === 'fr' ? 'FR' : 'EN'}
              </span>
            </button>
            <div className={styles.topHeaderUser}>
              <div className={styles.topHeaderUserAvatarPlaceholder}>
                {getInitials(currentUser?.nom_complet)}
              </div>
              <span className={styles.topHeaderUserName}>
                {currentUser?.nom_complet || 'Opérateur'}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
};
