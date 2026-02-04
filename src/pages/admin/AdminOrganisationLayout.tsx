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
  Key,
  Search,
  ChevronRight,
  ChevronLeft,
  Bell,
  LogOut,
  Menu,
  X,
  Globe,
  GitBranch,
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
  | 'workflows'
  | 'profile'
  | 'api-keys';

/** Structure de navigation stable (icônes hors rendu) pour éviter la disparition d’icône au changement de langue */
const ADMIN_NAV_CONFIG: {
  id: ActiveNavType;
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: 'dashboard', labelKey: 'common.dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'dossiers', labelKey: 'admin.dossiers', path: '/admin/dossiers', icon: Folder },
  { id: 'rapports', labelKey: 'admin.rapports', path: '/admin/rapports', icon: FileText },
  { id: 'utilisateurs', labelKey: 'admin.utilisateurs', path: '/admin/utilisateurs', icon: Users },
  { id: 'statistiques', labelKey: 'admin.statistiques', path: '/admin/statistiques', icon: BarChart3 },
  { id: 'roles', labelKey: 'admin.rolesManagement', path: '/admin/roles', icon: Shield },
  { id: 'audit-logs', labelKey: 'admin.auditLogs', path: '/admin/audit-logs', icon: ScrollText },
  { id: 'parametres', labelKey: 'admin.parametres', path: '/admin/parametres', icon: Settings },
  { id: 'workflows', labelKey: 'admin.workflows', path: '/admin/workflows', icon: GitBranch },
  { id: 'api-keys', labelKey: 'admin.apiKeys', path: '/admin/api-keys', icon: Key },
  { id: 'profile', labelKey: 'admin.profile', path: '/admin/profile', icon: User },
];

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

  const navItems = ADMIN_NAV_CONFIG.map((item) => ({
    ...item,
    label: t(item.labelKey),
  }));

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
    if (!name) return t('admin.initialsDefault');
    const parts = String(name).split(' ').filter(Boolean);
    if (parts.length === 0) return t('admin.initialsDefault');
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
                <span>{t('common.appName')}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? t('admin.openMenu') : t('admin.closeMenu')}
            aria-label={isCollapsed ? t('admin.openMenu') : t('admin.closeMenu')}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={() => setMobileOpen(false)}
            title={t('common.close')}
            aria-label={t('common.close')}
          >
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
              <button type="button" className={styles.userMenuItem} onClick={toggleLanguage} title={language === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')} aria-label={language === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')}>
                <Globe size={18} />
                <span>{language === 'fr' ? t('common.langCodeEn') : t('common.langCodeFr')}</span>
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
              placeholder={t('common.search')}
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
            <button type="button" className={styles.topHeaderIconBtn} onClick={toggleLanguage} title={language === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')} aria-label={language === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')}>
              <Globe size={18} />
              <span>{language === 'fr' ? t('common.langCodeEn') : t('common.langCodeFr')}</span>
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
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMobileOpen(true)}
            title={t('common.menu')}
            aria-label={t('common.menu')}
          >
            <Menu size={24} />
          </button>
          <span className={styles.appName}>{t('common.appName')}</span>
          <div className={styles.mobileHeaderRight}>
            <button
              type="button"
              className={styles.mobileHeaderIconBtn}
              title={t('common.notifications')}
              onClick={() => navigate('/admin/audit-logs')}
            >
              <Bell size={18} />
            </button>
            <button type="button" className={styles.mobileHeaderIconBtn} onClick={toggleLanguage} title={language === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')} aria-label={language === 'fr' ? t('common.switchToEnglish') : t('common.switchToFrench')}>
              <Globe size={18} />
              <span>{language === 'fr' ? t('common.langCodeEn') : t('common.langCodeFr')}</span>
            </button>
            <button
              type="button"
              className={styles.mobileAvatarBtn}
              onClick={() => setMobileOpen(true)}
              title={getUserLabel()}
              aria-label={t('common.profile')}
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

        <main className={styles.content}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminOrganisationLayout;
