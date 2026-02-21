/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Layout
 * Aligné sur le layout Super Admin (sidebar image + header)
 * =====================================================
 */

import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector, useAppDispatch } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { logoutThunk } from '../../features/auth/store/authThunks';
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
  GitBranch,
  FileSearch,
  Brain,
  UsersRound,
  MapPin,
  Image,
  UserCheck,
  UserCircle,
  Camera,
  ClipboardList,
  BookOpen,
  Handshake,
  Heart,
} from 'lucide-react';
import './adminTheme.css';
import styles from './AdminOrganisationLayout.module.css';

type ActiveNavType =
  | 'dashboard'
  | 'dossiers'
  | 'rapports'
  | 'alertes'
  | 'signalements'
  | 'ia'
  | 'coordination'
  | 'carte'
  | 'photos-moderation'
  | 'verification-identite'
  | 'personnes'
  | 'photos-en-attente'
  | 'signalements-en-attente'
  | 'campagnes'
  | 'cas'
  | 'ressources'
  | 'partenariats'
  | 'utilisateurs'
  | 'statistiques'
  | 'roles'
  | 'audit-logs'
  | 'parametres'
  | 'workflows'
  | 'profile'
  | 'api-keys'
  | 'donations';

/** Structure de navigation stable (icônes hors rendu) pour éviter la disparition d’icône au changement de langue */
interface AdminNavItem {
  id: ActiveNavType;
  labelKey: string;
  path: string;
  icon: typeof LayoutDashboard;
}

interface AdminNavGroup {
  groupKey: 'operational' | 'organisation' | 'followUp';
  labelKey: string;
  items: AdminNavItem[];
}

/** Navigation structurée par groupes : Opérationnel, Organisation, Suivi */
const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    groupKey: 'operational',
    labelKey: 'admin.nav.operational',
    items: [
      { id: 'dashboard', labelKey: 'common.dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
      { id: 'dossiers', labelKey: 'admin.dossiers', path: '/admin/dossiers', icon: Folder },
      { id: 'rapports', labelKey: 'admin.rapports', path: '/admin/rapports', icon: FileText },
      { id: 'alertes', labelKey: 'admin.alertes', path: '/admin/alertes', icon: Bell },
      { id: 'signalements', labelKey: 'admin.signalements', path: '/admin/signalements', icon: FileSearch },
      { id: 'ia', labelKey: 'admin.ia', path: '/admin/ia', icon: Brain },
      { id: 'coordination', labelKey: 'admin.coordination', path: '/admin/coordination', icon: UsersRound },
      { id: 'carte', labelKey: 'admin.carte', path: '/admin/carte', icon: MapPin },
      { id: 'photos-moderation', labelKey: 'admin.photosModeration', path: '/admin/photos-moderation', icon: Image },
      { id: 'verification-identite', labelKey: 'admin.verificationIdentite', path: '/admin/verification-identite', icon: UserCheck },
      { id: 'personnes', labelKey: 'admin.personnes', path: '/admin/personnes', icon: UserCircle },
      { id: 'photos-en-attente', labelKey: 'admin.photosEnAttente', path: '/admin/photos-en-attente', icon: Camera },
      { id: 'signalements-en-attente', labelKey: 'admin.signalementsEnAttente', path: '/admin/signalements-en-attente', icon: ClipboardList },
      { id: 'campagnes', labelKey: 'admin.campagnes', path: '/admin/campagnes', icon: Globe },
      { id: 'cas', labelKey: 'admin.cas', path: '/admin/cas', icon: FileSearch },
      { id: 'ressources', labelKey: 'admin.ressources', path: '/admin/ressources', icon: BookOpen },
      { id: 'partenariats', labelKey: 'admin.partenariats', path: '/admin/partenariats', icon: Handshake },
      { id: 'donations', labelKey: 'admin.donations', path: '/admin/donations', icon: Heart },
    ],
  },
  {
    groupKey: 'organisation',
    labelKey: 'admin.nav.organisation',
    items: [
      { id: 'utilisateurs', labelKey: 'admin.utilisateurs', path: '/admin/utilisateurs', icon: Users },
      { id: 'roles', labelKey: 'admin.rolesManagement', path: '/admin/roles', icon: Shield },
      { id: 'parametres', labelKey: 'admin.parametres', path: '/admin/parametres', icon: Settings },
      { id: 'workflows', labelKey: 'admin.workflows', path: '/admin/workflows', icon: GitBranch },
      { id: 'profile', labelKey: 'admin.profile', path: '/admin/profile', icon: User },
    ],
  },
  {
    groupKey: 'followUp',
    labelKey: 'admin.nav.followUp',
    items: [
      { id: 'statistiques', labelKey: 'admin.statistiques', path: '/admin/statistiques', icon: BarChart3 },
      { id: 'audit-logs', labelKey: 'admin.auditLogs', path: '/admin/audit-logs', icon: ScrollText },
    ],
  },
];

interface AdminOrganisationLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav?: ActiveNavType;
  /** Titre et contenu sur la même ligne (alignés verticalement) */
  titleOnSameRow?: boolean;
}

export const AdminOrganisationLayout: React.FC<AdminOrganisationLayoutProps> = ({
  children,
  title,
  activeNav,
  titleOnSameRow,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminOrgSidebarCollapsed');
    return saved === 'true';
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const SIDEBAR_SCROLL_KEY = 'adminOrgSidebarScrollTop';
  const savedNavScrollRef = useRef(0);
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

  const handleLogout = async () => {
    await dispatch(logoutThunk());
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

  /* Garder la position de défilement du sidebar après navigation (sessionStorage + useLayoutEffect) */
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
              <img src="/android/mipmap-hdpi/ic_launcher.png" alt="" className={styles.sidebarLogoImg} />
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

        <nav ref={navRef} className={styles.nav} aria-label={t('common.menu')}>
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.groupKey} className={styles.navGroup}>
              <div
                className={styles.navGroupTitle}
                id={isCollapsed ? undefined : `nav-group-${group.groupKey}`}
                aria-hidden={isCollapsed}
              >
                {t(group.labelKey)}
              </div>
              <ul
                className={styles.navGroupList}
                aria-labelledby={isCollapsed ? undefined : `nav-group-${group.groupKey}`}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.id, item.path);
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
                          setMobileOpen(false);
                        }}
                        title={isCollapsed ? label : undefined}
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
          <span className={`${styles.topHeaderAppName} app-name-bold`}>{t('common.appName')}</span>
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
          <span className={`${styles.appName} app-name-bold`}>{t('common.appName')}</span>
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

        <main className={`${styles.content} ${titleOnSameRow ? styles.contentTitleRow : ''}`}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {titleOnSameRow ? <div className={styles.contentBody}>{children}</div> : children}
        </main>
      </div>
    </div>
  );
};

export default AdminOrganisationLayout;
