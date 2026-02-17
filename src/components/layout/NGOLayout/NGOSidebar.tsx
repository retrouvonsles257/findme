/**
 * RETROUVONSLES - NGO Sidebar
 * Structure alignée sur Admin : navigation par groupes (Principal, Ressources) + section utilisateur
 * Persistance du scroll (sessionStorage), fermeture automatique sur mobile
 */

import React, { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Megaphone,
  Bell,
  BarChart3,
  BookOpen,
  Handshake,
  Brain,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Heart,
  X,
  Edit,
  Settings,
  KeyRound,
} from 'lucide-react';
import { useI18n } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../store/types';
import { logoutThunk } from '../../../features/auth/store/authThunks';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { AUTH_ROUTES } from '../../../routes/routes.config';
import { supabase } from '../../../config';
import styles from './NGOSidebar.module.css';

type NGONavId = 'dashboard' | 'cases' | 'campagnes' | 'alertes' | 'ia' | 'statistics' | 'resources' | 'partnerships';

interface NGONavItem {
  id: NGONavId;
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}

interface NGONavGroup {
  groupKey: 'principal' | 'resources';
  labelKey: string;
  items: NGONavItem[];
}

const NGO_NAV_GROUPS: NGONavGroup[] = [
  {
    groupKey: 'principal',
    labelKey: 'ngo.nav.principal',
    items: [
      { id: 'dashboard', labelKey: 'common.dashboard', path: '/ngo/dashboard', icon: LayoutDashboard },
      { id: 'cases', labelKey: 'ngo.cases', path: '/ngo/cases', icon: FolderOpen },
      { id: 'campagnes', labelKey: 'ngo.campaigns', path: '/ngo/campagnes', icon: Megaphone },
      { id: 'alertes', labelKey: 'ngo.alertes', path: '/ngo/alertes', icon: Bell },
      { id: 'ia', labelKey: 'ngo.ia', path: '/ngo/ia', icon: Brain },
    ],
  },
  {
    groupKey: 'resources',
    labelKey: 'ngo.nav.resources',
    items: [
      { id: 'statistics', labelKey: 'ngo.statistics', path: '/ngo/statistics', icon: BarChart3 },
      { id: 'resources', labelKey: 'ngo.resources', path: '/ngo/resources', icon: BookOpen },
      { id: 'partnerships', labelKey: 'ngo.partnerships', path: '/ngo/partnerships', icon: Handshake },
    ],
  },
];

export interface NGOSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const NGOSidebar: React.FC<NGOSidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const userFullName = (currentUser as any)?.nom_complet || (currentUser as any)?.email || 'Utilisateur';
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = 'ngoSidebarScrollTop';
  const savedNavScrollRef = useRef(0);

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
    if (currentUser?.id) loadPhotoProfil(currentUser.id);
    else setPhotoProfil(null);
  }, [currentUser?.id, loadPhotoProfil, location.pathname]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && isOpen) onToggle();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Restaurer le scroll du nav après navigation (sessionStorage, comme Admin) */
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

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await dispatch(logoutThunk());
    navigate(AUTH_ROUTES.LOGIN);
  };

  const goToProfile = () => {
    setShowProfileMenu(false);
    navigate('/ngo/profile', { state: { edit: true } });
    if (window.innerWidth <= 768) onToggle();
  };

  const goToSettings = () => {
    setShowProfileMenu(false);
    navigate('/ngo/settings');
    if (window.innerWidth <= 768) onToggle();
  };

  const goToSecurity = () => {
    setShowProfileMenu(false);
    navigate('/ngo/security');
    if (window.innerWidth <= 768) onToggle();
  };

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onToggle} aria-hidden="true" />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.96)), url('/assets/images/niveau_5_responsable_ong.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoSection}>
            <Heart className={styles.logoIcon} size={28} />
            <span className={styles.logoText}>{t('common.appName')}</span>
          </div>
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={onToggle}
            aria-label={isOpen ? t('common.close') : t('common.menu')}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
          <button
            type="button"
            className={styles.mobileClose}
            onClick={onToggle}
            aria-label={t('common.close')}
          >
            <X size={24} />
          </button>
        </div>

        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {NGO_NAV_GROUPS.map((group) => (
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
                            const top = navRef.current.scrollTop;
                            savedNavScrollRef.current = top;
                            try {
                              sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(top));
                            } catch {}
                          }
                          navigate(item.path);
                          if (window.innerWidth <= 768) onToggle();
                        }}
                        aria-current={active ? 'page' : undefined}
                        aria-label={label}
                      >
                        <span className={styles.navItemIcon} aria-hidden>
                          <Icon size={20} />
                        </span>
                        <span>{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={styles.userSection} ref={profileMenuRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <div className={styles.userAvatarPlaceholder}>
              {photoProfil ? (
                <img src={photoProfil} alt="" className={styles.userAvatarImg} />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.userName}>{userFullName}</span>
              <span className={styles.profileRole}>ONG</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className={styles.userMenu}>
              <div className={styles.profileMenuHeader}>
                <div className={styles.menuAvatar}>
                  {photoProfil ? (
                    <img src={photoProfil} alt={userFullName} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className={styles.menuUserInfo}>
                  <span className={styles.menuUserName}>{userFullName}</span>
                  <span className={styles.menuUserEmail}>{currentUser?.email || ''}</span>
                </div>
              </div>
              <div className={styles.userMenuDivider} />
              <button type="button" className={styles.userMenuItem} onClick={goToProfile}>
                <Edit size={16} />
                <span>{t('authority.sidebar.editProfile')}</span>
              </button>
              <button type="button" className={styles.userMenuItem} onClick={goToSettings}>
                <Settings size={16} />
                <span>{t('authority.sidebar.settings')}</span>
              </button>
              <button type="button" className={styles.userMenuItem} onClick={goToSecurity}>
                <KeyRound size={16} />
                <span>{t('authority.sidebar.security')}</span>
              </button>
              <div className={styles.userMenuDivider} />
              <button type="button" className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`} onClick={handleLogout}>
                <LogOut size={16} />
                <span>{t('authority.sidebar.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
