/**
 * =====================================================
 * RETROUVONSLES - Authority Sidebar
 * Structure alignée sur Admin : navigation par groupes (Opérationnel, Suivi) + section utilisateur
 * Persistance du scroll (sessionStorage), fermeture automatique sur mobile
 * =====================================================
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  Bell,
  FileSearch,
  Search,
  Brain,
  Users,
  Image,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  User,
  Shield,
  X,
  Edit,
  KeyRound,
  Map,
  Heart,
} from 'lucide-react';
import { useI18n } from '../../../hooks';
import { supabase } from '../../../config';
import { AUTH_ROUTES } from '../../../routes/routes.config';
import { useAppDispatch, useAppSelector } from '../../../store/types';
import { logoutThunk } from '../../../features/auth/store/authThunks';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { selectUserRole } from '../../../features/auth/store/authSelectors';
import styles from './AuthoritySidebar.module.css';

type AuthorityNavId =
  | 'dashboard'
  | 'dossiers'
  | 'alertes'
  | 'signalements'
  | 'photos-moderation'
  | 'map-view'
  | 'investigation'
  | 'ia-analysis'
  | 'coordination'
  | 'donations'
  | 'statistiques';

interface AuthorityNavItem {
  id: AuthorityNavId;
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}

interface AuthorityNavGroup {
  groupKey: 'operational' | 'followUp';
  labelKey: string;
  items: AuthorityNavItem[];
}

const AUTHORITY_NAV_GROUPS: AuthorityNavGroup[] = [
  {
    groupKey: 'operational',
    labelKey: 'authority.nav.operational',
    items: [
      { id: 'dashboard', labelKey: 'authority.menu.dashboard', path: '/authority/dashboard', icon: LayoutDashboard },
      { id: 'dossiers', labelKey: 'authority.menu.dossiers', path: '/authority/dossiers', icon: FolderOpen },
      { id: 'alertes', labelKey: 'authority.menu.alertes', path: '/authority/alertes', icon: Bell },
      { id: 'signalements', labelKey: 'authority.menu.signalements', path: '/authority/signalements', icon: FileSearch },
      { id: 'photos-moderation', labelKey: 'authority.menu.photosModeration', path: '/authority/photos-moderation', icon: Image },
      { id: 'map-view', labelKey: 'authority.menu.mapView', path: '/authority/map-view', icon: Map },
      { id: 'investigation', labelKey: 'authority.menu.investigation', path: '/authority/investigation', icon: Search },
      { id: 'ia-analysis', labelKey: 'authority.menu.analysis', path: '/authority/ia-analysis', icon: Brain },
      { id: 'coordination', labelKey: 'authority.menu.coordination', path: '/authority/coordination', icon: Users },
    ],
  },
  {
    groupKey: 'followUp',
    labelKey: 'authority.nav.followUp',
    items: [
      { id: 'donations', labelKey: 'authority.menu.donations', path: '/authority/donations', icon: Heart },
      { id: 'statistiques', labelKey: 'authority.menu.statistiques', path: '/authority/statistiques', icon: BarChart3 },
    ],
  },
];

export interface AuthoritySidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const AuthoritySidebar: React.FC<AuthoritySidebarProps> = ({ isOpen, onToggle }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const userRole = useAppSelector(selectUserRole);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = 'authoritySidebarScrollTop';
  const savedNavScrollRef = useRef(0);
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
    if (currentUser?.id) loadPhotoProfil(currentUser.id);
    else setPhotoProfil(null);
  }, [currentUser?.id, loadPhotoProfil, location.pathname]);

  // Une seule source : Redux (profil table utilisateur), pas user_metadata Supabase
  const userFullName = (currentUser as any)?.nom_complet || (currentUser as any)?.email || 'Utilisateur';
  const userAvatar = photoProfil || (currentUser as any)?.photo_profil || (currentUser as any)?.avatar_url;

  // Fermer le menu profil quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  // Fermer le sidebar sur mobile quand on change de page
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && isOpen) {
      onToggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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

  const isActive = (itemPath: string) => location.pathname.startsWith(itemPath);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await dispatch(logoutThunk());
    navigate(AUTH_ROUTES.LOGIN);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const goToProfile = () => {
    navigate('/authority/profile', { state: { edit: true } });
    setShowProfileMenu(false);
    // Fermer sidebar sur mobile
    if (window.innerWidth <= 768) {
      onToggle();
    }
  };

  const goToSettings = () => {
    navigate('/authority/settings');
    setShowProfileMenu(false);
    // Fermer sidebar sur mobile
    if (window.innerWidth <= 768) {
      onToggle();
    }
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'officier_police': return t('authority.roles.officier_police');
      case 'agent_gendarmerie': return t('authority.roles.agent_gendarmerie');
      case 'operateur_saisie': return t('authority.roles.operateur_saisie');
      case 'admin_organisation': return t('authority.roles.admin_organisation');
      default: return t('authority.roles.default');
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.96)), url('/assets/images/niveau_4_officier_police.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Header with Logo and Toggle */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoSection}>
            <Shield className={styles.logoIcon} size={28} />
            <span className={styles.logoText}>{t('authority.sidebar.appName')}</span>
          </div>
          <button 
            className={styles.toggleBtn}
            onClick={onToggle}
            aria-label={isOpen ? t('authority.sidebar.closeMenu') : t('authority.sidebar.openMenu')}
          >
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Navigation par groupes (aligné Admin) */}
        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {AUTHORITY_NAV_GROUPS.map((group) => (
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

        {/* Section utilisateur (aligné Admin) */}
        <div className={styles.userSection} ref={profileMenuRef}>
          <button
            type="button"
            className={styles.userBtn}
            onClick={handleProfileClick}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <div className={styles.userAvatarPlaceholder}>
              {userAvatar ? (
                <img src={userAvatar} alt="" className={styles.userAvatarImg} />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.userName}>{userFullName}</span>
              <span className={styles.profileRole}>{getRoleLabel(userRole)}</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className={styles.userMenu}>
              <div className={styles.profileMenuHeader}>
                <div className={styles.menuAvatar}>
                  {userAvatar ? (
                    <img src={userAvatar} alt={userFullName} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className={styles.menuUserInfo}>
                  <span className={styles.menuUserName}>{userFullName}</span>
                  <span className={styles.menuUserEmail}>{currentUser?.email}</span>
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
              <button
                type="button"
                className={styles.userMenuItem}
                onClick={() => {
                  navigate('/authority/security');
                  setShowProfileMenu(false);
                  if (window.innerWidth <= 768) onToggle();
                }}
              >
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

        {/* Mobile Close Button */}
        <button className={styles.mobileClose} onClick={onToggle}>
          <X size={24} />
        </button>
      </aside>
    </>
  );
};

export default AuthoritySidebar;
