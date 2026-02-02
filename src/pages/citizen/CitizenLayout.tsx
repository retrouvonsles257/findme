/**
 * =====================================================
 * RETROUVONSLES - Citizen Layout
 * Layout principal pour les pages citoyens
 * Style inspiré de ChatGPT/Claude avec sidebar rétractable
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { useLogout } from '../../features/auth/hooks';
import { useNotifications } from '../../features/notifications/hooks';
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
  const { unreadCount, fetchNotifications } = useNotifications();
  
  // États
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('citizenSidebarCollapsed');
    return saved === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  // Navigation items
  const navItems = [
    {
      id: 'dashboard',
      label: t('common.dashboard'),
      icon: Home,
      path: '/citizen/dashboard',
    },
    {
      id: 'dossiers',
      label: t('citizen.dossiers'),
      icon: Users,
      path: '/citizen/dossiers',
    },
    {
      id: 'map',
      label: t('citizen.map'),
      icon: Map,
      path: '/citizen/map',
    },
    {
      id: 'alerts',
      label: t('citizen.alerts'),
      icon: Bell,
      path: '/citizen/alerts',
    },
    {
      id: 'signalements',
      label: t('common.reports'),
      icon: FileText,
      path: '/citizen/my-signalements',
    },
    {
      id: 'new-signalement',
      label: t('citizen.newReport'),
      icon: Plus,
      // Selon le modèle: un signalement citoyen est lié à un dossier.
      // On envoie donc vers la liste des dossiers publics pour choisir le dossier concerné.
      path: '/citizen/dossiers?mode=report',
    },
    {
      id: 'donations',
      label: t('citizen.donations') || 'Dons',
      icon: Heart,
      path: '/citizen/donations',
    },
    {
      id: 'settings',
      label: t('citizen.settings'),
      icon: Settings,
      path: '/citizen/settings',
    },
  ];

  const isActive = (itemId: string, itemPath: string) => {
    if (activeNav) return activeNav === itemId;
    return location.pathname === itemPath;
  };

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
              <div className={styles.logoIcon}>
                <span>RetrouvonsLes</span>
              </div>
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

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id, item.path);
            return (
              <button
                key={item.id}
                className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={20} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
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
              className={styles.topHeaderUser}
              onClick={() => navigate('/citizen/profile')}
              title={(currentUser as any)?.nom_complet || (currentUser as any)?.email || 'User'}
            >
              <div className={styles.topHeaderUserAvatarPlaceholder}>
                {photo ? (
                  <img src={photo} alt="" className={styles.userAvatarImg} />
                ) : (
                  getInitials()
                )}
              </div>
              <span className={styles.topHeaderUserName}>
                {(currentUser as any)?.nom_complet || (currentUser as any)?.email || 'User'}
              </span>
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
          <span className={styles.appName}>RetrouvonsLes</span>
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
          {children}
        </main>
      </div>
    </div>
  );
};

export default CitizenLayout;
