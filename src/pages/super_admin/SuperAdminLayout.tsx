/**
 * =====================================================
 * RETROUVONSLES - Super Admin Layout
 * Aligné sur le layout Citizen (sidebar image + header)
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import {
  LayoutDashboard,
  Globe,
  Building2,
  Users,
  Settings,
  Shield,
  FileText,
  Cpu,
  LogOut,
  Menu,
  X,
  Megaphone,
  DollarSign,
  UserCog,
  AlertTriangle,
  Brain,
  CheckSquare,
  User,
  Search,
  ChevronRight,
  ChevronLeft,
  Bell,
  FolderOpen,
  Database,
} from 'lucide-react';
import styles from './SuperAdminLayout.module.css';

type ActiveNavType =
  | 'dashboard'
  | 'global-stats'
  | 'organisations'
  | 'system-users'
  | 'ia-config'
  | 'security'
  | 'system-logs'
  | 'system-settings'
  | 'campagnes'
  | 'dons'
  | 'roles'
  | 'dossiers-critiques'
  | 'resultats-ia'
  | 'signalement-validation'
  | 'profile'
  | 'dossiers'
  | 'alertes'
  | 'maintenance'
  | 'notifications-system'
  | 'photos'
  | 'commentaires'
  | 'documents'
  | 'liens-filiation';

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
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('superAdminSidebarCollapsed');
    return saved === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
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

  const navItems = [
    {
      id: 'dashboard',
      label: t('common.dashboard'),
      path: '/super-admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'global-stats',
      label: t('super_admin.globalStatsMenu'),
      path: '/super-admin/global-stats',
      icon: Globe,
    },
    {
      id: 'organisations',
      label: t('super_admin.organisations'),
      path: '/super-admin/organisations',
      icon: Building2,
    },
    {
      id: 'system-users',
      label: t('super_admin.systemUsersMenu'),
      path: '/super-admin/system-users',
      icon: Users,
    },
    {
      id: 'ia-config',
      label: t('super_admin.iaConfigMenu'),
      path: '/super-admin/ia-configuration',
      icon: Cpu,
    },
    {
      id: 'security',
      label: t('super_admin.securityMenu'),
      path: '/super-admin/security',
      icon: Shield,
    },
    {
      id: 'system-logs',
      label: t('super_admin.systemLogsMenu'),
      path: '/super-admin/system-logs',
      icon: FileText,
    },
    {
      id: 'system-settings',
      label: t('super_admin.systemSettingsMenu'),
      path: '/super-admin/system-settings',
      icon: Settings,
    },
    {
      id: 'campagnes',
      label: 'Campagnes',
      path: '/super-admin/campagnes',
      icon: Megaphone,
    },
    {
      id: 'dons',
      label: 'Dons',
      path: '/super-admin/dons',
      icon: DollarSign,
    },
    {
      id: 'roles',
      label: 'Rôles',
      path: '/super-admin/roles',
      icon: UserCog,
    },
    {
      id: 'dossiers',
      label: 'Gestion Dossiers',
      path: '/super-admin/dossiers',
      icon: FolderOpen,
    },
    {
      id: 'dossiers-critiques',
      label: 'Dossiers critiques',
      path: '/super-admin/dossiers-critiques',
      icon: AlertTriangle,
    },
    {
      id: 'alertes',
      label: 'Gestion Alertes',
      path: '/super-admin/alertes',
      icon: Bell,
    },
    {
      id: 'resultats-ia',
      label: 'Résultats IA',
      path: '/super-admin/resultats-ia',
      icon: Brain,
    },
    {
      id: 'signalement-validation',
      label: 'Validation Signalements',
      path: '/super-admin/signalement-validation',
      icon: CheckSquare,
    },
    {
      id: 'profile',
      label: 'Mon Profil',
      path: '/super-admin/profile',
      icon: User,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      path: '/super-admin/maintenance',
      icon: Database,
    },
  ];

  const handleLogout = () => {
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
    return user?.prenom || user?.nom_complet || user?.email || 'Super Admin';
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
              <div className={styles.logoIcon}>
                <span>RetrouvonsLes</span>
              </div>
            </div>
          )}

          <button
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
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

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.id as ActiveNavType, item.path);
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
        {/* Header desktop */}
        <header className={styles.topHeader}>
          <form className={styles.topHeaderSearchForm} onSubmit={handleHeaderSearch}>
            <Search size={18} className={styles.topHeaderSearchIcon} />
            <input
              type="text"
              placeholder={t('common.search') || 'Search...'}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className={styles.topHeaderSearchInput}
            />
          </form>

          <div className={styles.topHeaderRight}>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              title={t('common.notifications') || 'Notifications'}
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
          <span className={styles.appName}>RetrouvonsLes</span>
          <div className={styles.mobileHeaderRight}>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              title={t('common.notifications') || 'Notifications'}
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
