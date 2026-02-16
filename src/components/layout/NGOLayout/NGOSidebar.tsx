/**
 * RETROUVONSLES - NGO Sidebar
 * Sidebar aligné sur Authority : nom complet de l'app, nav, profil + dropdown (Profil, Déconnexion)
 */

import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
import styles from './NGOSidebar.module.css';

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
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && isOpen) onToggle();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

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
    navigate('/ngo/profile');
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

  const navItems = [
    { path: '/ngo/dashboard', label: t('common.dashboard'), icon: <LayoutDashboard size={20} /> },
    { path: '/ngo/cases', label: t('ngo.cases'), icon: <FolderOpen size={20} /> },
    { path: '/ngo/campagnes', label: t('ngo.campaigns'), icon: <Megaphone size={20} /> },
    { path: '/ngo/alertes', label: t('ngo.alertes'), icon: <Bell size={20} /> },
    { path: '/ngo/ia', label: 'IA', icon: <Brain size={20} /> },
    { path: '/ngo/statistics', label: t('ngo.statistics'), icon: <BarChart3 size={20} /> },
    { path: '/ngo/resources', label: t('ngo.resources'), icon: <BookOpen size={20} /> },
    { path: '/ngo/partnerships', label: t('ngo.partnerships'), icon: <Handshake size={20} /> },
  ];

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

        <nav className={styles.navigation}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.active : ''}`
              }
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.profileSection} ref={profileMenuRef}>
          <button
            type="button"
            className={styles.profileButton}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <div className={styles.avatar}>
              <User size={20} />
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{userFullName}</span>
              <span className={styles.profileRole}>ONG</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className={styles.profileDropdown}>
              <button type="button" className={styles.sidebarMenuItem} onClick={goToProfile}>
                <Edit size={16} />
                <span>{t('authority.sidebar.editProfile')}</span>
              </button>
              <button type="button" className={styles.sidebarMenuItem} onClick={goToSettings}>
                <Settings size={16} />
                <span>{t('authority.sidebar.settings')}</span>
              </button>
              <button type="button" className={styles.sidebarMenuItem} onClick={goToSecurity}>
                <KeyRound size={16} />
                <span>{t('authority.sidebar.security')}</span>
              </button>
              <div className={styles.sidebarMenuDivider} />
              <button type="button" className={`${styles.sidebarMenuItem} ${styles.sidebarLogoutItem}`} onClick={handleLogout}>
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
