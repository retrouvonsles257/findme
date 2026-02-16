/**
 * =====================================================
 * RETROUVONSLES - Authority Sidebar
 * Sidebar collapsible avec navigation et avatar
 * Style moderne inspiré de ChatGPT/Claude
 * Fermeture automatique sur mobile
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

// navItems sera créé dynamiquement dans le composant pour utiliser i18n

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

  /* Garder la position de défilement du sidebar après navigation (restauration différée après paint) */
  useEffect(() => {
    const el = navRef.current;
    const saved = savedNavScrollRef.current;
    if (el && saved >= 0) {
      const t = setTimeout(() => {
        requestAnimationFrame(() => {
          if (navRef.current) navRef.current.scrollTop = saved;
        });
      }, 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [location.pathname]);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await dispatch(logoutThunk());
    navigate(AUTH_ROUTES.LOGIN);
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const goToProfile = () => {
    navigate('/authority/profile');
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

  const handleNavClick = () => {
    if (navRef.current) {
      savedNavScrollRef.current = navRef.current.scrollTop;
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

  const navItems: NavItem[] = [
    { path: '/authority/dashboard', label: t('authority.menu.dashboard'), icon: <LayoutDashboard size={20} /> },
    { path: '/authority/dossiers', label: t('authority.menu.dossiers'), icon: <FolderOpen size={20} /> },
    { path: '/authority/alertes', label: t('authority.menu.alertes'), icon: <Bell size={20} /> },
    { path: '/authority/signalements', label: t('authority.menu.signalements'), icon: <FileSearch size={20} /> },
    { path: '/authority/photos-moderation', label: t('authority.menu.photosModeration'), icon: <Image size={20} /> },
    { path: '/authority/map-view', label: t('authority.menu.mapView'), icon: <Map size={20} /> },
    { path: '/authority/investigation', label: t('authority.menu.investigation'), icon: <Search size={20} /> },
    { path: '/authority/ia-analysis', label: t('authority.menu.analysis'), icon: <Brain size={20} /> },
    { path: '/authority/coordination', label: t('authority.menu.coordination'), icon: <Users size={20} /> },
    { path: '/authority/donations', label: t('authority.menu.donations'), icon: <Heart size={20} /> },
    { path: '/authority/statistiques', label: t('authority.menu.statistiques'), icon: <BarChart3 size={20} /> },
  ];

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

        {/* Navigation */}
        <nav ref={navRef} className={styles.navigation}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
              onClick={handleNavClick}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className={styles.profileSection} ref={profileMenuRef}>
          <button 
            className={styles.profileButton}
            onClick={handleProfileClick}
          >
            <div className={styles.avatar}>
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userFullName} 
                  className={styles.avatarImage}
                />
              ) : (
                <User size={20} />
              )}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>
                {userFullName}
              </span>
              <span className={styles.profileRole}>
                {getRoleLabel(userRole)}
              </span>
            </div>
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className={styles.profileMenu}>
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
              <div className={styles.menuDivider} />
              <button className={styles.menuItem} onClick={goToProfile}>
                <Edit size={16} />
                <span>{t('authority.sidebar.editProfile')}</span>
              </button>
              <button className={styles.menuItem} onClick={goToSettings}>
                <Settings size={16} />
                <span>{t('authority.sidebar.settings')}</span>
              </button>
              <button className={styles.menuItem} onClick={() => {
                navigate('/authority/security');
                setShowProfileMenu(false);
              }}>
                <KeyRound size={16} />
                <span>{t('authority.sidebar.security')}</span>
              </button>
              <div className={styles.menuDivider} />
              <button className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
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
