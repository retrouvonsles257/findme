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
import { useAuth } from '../../../contexts';
import { useI18n } from '../../../hooks';
import { supabase } from '../../../config';
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
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
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
    if (user?.id) loadPhotoProfil(user.id);
    else setPhotoProfil(null);
  }, [user?.id, loadPhotoProfil, location.pathname]);

  // Extraire les infos du user_metadata de Supabase
  const userMetadata = user?.user_metadata as Record<string, any> | undefined;
  const userName = userMetadata?.prenom || userMetadata?.nom || user?.email?.split('authority.@')[0] || 'Utilisateur';
  const userFullName = userMetadata?.prenom && userMetadata?.nom 
    ? `${userMetadata.prenom} ${userMetadata.nom}` 
    : userName;
  const userAvatar = photoProfil || userMetadata?.photo_profil_url || userMetadata?.avatar_url;

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

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await signOut();
    navigate('/login');
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
    // Le useEffect sur location.pathname gère la fermeture automatique
    // Cette fonction est là pour des actions supplémentaires si nécessaire
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

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
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
        <nav className={styles.navigation}>
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
                  alt={userName} 
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
                    <img src={userAvatar} alt={userName} />
                  ) : (
                    <User size={24} />
                  )}
                </div>
                <div className={styles.menuUserInfo}>
                  <span className={styles.menuUserName}>{userFullName}</span>
                  <span className={styles.menuUserEmail}>{user?.email}</span>
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
