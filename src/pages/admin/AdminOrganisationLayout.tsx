/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Layout
 * Aligné sur le layout Super Admin (sidebar image + header)
 * =====================================================
 */

import React, { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { supabase } from '../../config';
import {
  LayoutDashboard,
  Folder,
  FileText,
  Users,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  User,
  Search,
  ChevronRight,
  ChevronLeft,
  Bell,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import styles from './AdminOrganisationLayout.module.css';

type ActiveNavType =
  | 'dashboard'
  | 'dossiers'
  | 'rapports'
  | 'utilisateurs'
  | 'statistiques'
  | 'roles'
  | 'audit-logs'
  | 'parametres'
  | 'profile'
  | 'api-keys';

interface AdminOrganisationLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav?: ActiveNavType;
}

export const AdminOrganisationLayout: React.FC<AdminOrganisationLayoutProps> = ({
  children,
  title,
  activeNav,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminOrgSidebarCollapsed');
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
    localStorage.setItem('adminOrgSidebarCollapsed', String(isCollapsed));
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
    { id: 'dashboard' as const, label: t('common.dashboard'), path: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'dossiers' as const, label: t('admin.dossiers'), path: '/admin/dossiers', icon: Folder },
    { id: 'rapports' as const, label: t('admin.rapports'), path: '/admin/rapports', icon: FileText },
    { id: 'utilisateurs' as const, label: t('admin.utilisateurs'), path: '/admin/utilisateurs', icon: Users },
    { id: 'statistiques' as const, label: t('admin.statistiques'), path: '/admin/statistiques', icon: BarChart3 },
    { id: 'roles' as const, label: t('admin.rolesManagement'), path: '/admin/roles', icon: Shield },
    { id: 'audit-logs' as const, label: t('admin.auditLogs'), path: '/admin/audit-logs', icon: ScrollText },
    { id: 'parametres' as const, label: t('admin.parametres'), path: '/admin/parametres', icon: Settings },
    { id: 'profile' as const, label: t('admin.profile'), path: '/admin/profile', icon: User },
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
    const name = user?.first_name || user?.last_name || user?.email;
    if (!name) return 'AO';
    const parts = String(name).split(' ').filter(Boolean);
    if (parts.length === 0) return 'AO';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const getUserLabel = () => {
    const user = currentUser as any;
    return user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`.trim()
      : user?.email || t('admin.adminOrganisation');
  };

  const handleHeaderSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = headerSearch.trim();
    if (query) {
      navigate(`/admin/dossiers?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/admin/dossiers');
    }
  };

  const isActive = (itemId: ActiveNavType, itemPath: string) => {
    if (activeNav) return activeNav === itemId;
    return location.pathname.startsWith(itemPath);
  };

  return (
    <div className={styles.layout}>
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''} ${
          isCollapsed ? styles.sidebarCollapsed : ''
        }`}
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(15,23,42,0.9), rgba(15,23,42,0.96)), url('/assets/images/niveau_6_admin_organisation.png')",
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
          <button className={styles.closeMobileBtn} onClick={() => setMobileOpen(false)}>
            <X size={24} />
          </button>
        </div>

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
                  navigate('/admin/profile');
                  setUserMenuOpen(false);
                  setMobileOpen(false);
                }}
              >
                <User size={18} />
                <span>{t('common.profile')}</span>
              </button>
              <button className={styles.userMenuItem} onClick={toggleLanguage}>
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

      <div className={`${styles.main} ${isCollapsed ? styles.mainExpanded : ''}`}>
        <header className={styles.topHeader}>
          <form className={styles.topHeaderSearchForm} onSubmit={handleHeaderSearch}>
            <Search size={18} className={styles.topHeaderSearchIcon} />
            <input
              type="text"
              placeholder={t('common.search') || 'Rechercher...'}
              value={headerSearch}
              onChange={(e) => setHeaderSearch(e.target.value)}
              className={styles.topHeaderSearchInput}
            />
          </form>
          <div className={styles.topHeaderRight}>
            <button
              type="button"
              className={styles.topHeaderIconBtn}
              title={t('common.notifications')}
              onClick={() => navigate('/admin/audit-logs')}
            >
              <Bell size={18} />
            </button>
            <button type="button" className={styles.topHeaderIconBtn} onClick={toggleLanguage} title={t('common.language')}>
              <Globe size={18} />
              <span>{language.toUpperCase()}</span>
            </button>
            <button
              type="button"
              className={styles.topHeaderUser}
              onClick={() => navigate('/admin/profile')}
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

        <header className={styles.mobileHeader}>
          <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>
          <span className={styles.appName}>RetrouvonsLes</span>
          <div className={styles.mobileHeaderRight}>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              title={t('common.notifications')}
              onClick={() => navigate('/admin/audit-logs')}
            >
              <Bell size={18} />
            </button>
            <button type="button" className={styles.mobileHeaderIconBtn} onClick={toggleLanguage} title={t('common.language')}>
              <Globe size={18} />
            </button>
            <button type="button" className={styles.mobileAvatarBtn} onClick={() => setMobileOpen(true)}>
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

        <main className={styles.content}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminOrganisationLayout;
