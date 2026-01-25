/**
 * =====================================================
 * RETROUVONSLES - Super Admin Layout
 * Master layout component for super admin pages
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
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
} from 'lucide-react';
import styles from './SuperAdminLayout.module.css';

type ActiveNavType = 'dashboard' | 'global-stats' | 'organisations' | 'system-users' | 
  'ia-config' | 'security' | 'system-logs' | 'system-settings' |
  'campagnes' | 'dons' | 'roles' | 'dossiers-critiques' | 'resultats-ia' |
  'signalement-validation' | 'profile';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav: ActiveNavType;
}

export const SuperAdminLayout: React.FC<SuperAdminLayoutProps> = ({
  children,
  title,
  activeNav,
}) => {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      id: 'dossiers-critiques',
      label: 'Dossiers critiques',
      path: '/super-admin/dossiers-critiques',
      icon: AlertTriangle,
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
  ];

  const handleLogout = () => {
    navigate('/auth/login');
  };

  const toggleLanguage = async () => {
    const newLang = language === 'en' ? 'fr' : 'en';
    await changeLanguage(newLang as any);
  };

  return (
    <div className={styles['super-admin-layout']}>
      {/* Header */}
      <header className={styles['super-admin-layout__header']}>
        <div className={styles['super-admin-layout__header-left']}>
          <button
            className={styles['super-admin-layout__menu-btn']}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={24} />
          </button>
          <h1 className={styles['super-admin-layout__logo']} onClick={() => navigate('/super-admin/dashboard')}>RL</h1>
        </div>

        <div className={styles['super-admin-layout__header-right']}>
          {/* Language Switcher */}
          <button
            className={styles['super-admin-layout__language']}
            onClick={toggleLanguage}
            title={t('common.language')}
          >
            <Globe size={20} />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* User Info */}
          <div className={styles['super-admin-layout__user']}>
            <div className={styles['super-admin-layout__user-avatar']}>
              {currentUser?.prenom?.charAt(0).toUpperCase() || 'S'}
            </div>
            <span className={styles['super-admin-layout__user-name']}>
              {currentUser?.prenom || 'Super Admin'}
            </span>
          </div>
        </div>
      </header>

      {/* Body with Sidebar and Content */}
      <div className={styles['super-admin-layout__body']}>
        {/* Overlay for mobile */}
        <div 
          className={`${styles['super-admin-layout__overlay']} ${sidebarOpen ? styles['super-admin-layout__overlay--visible'] : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar */}
        <aside className={`${styles['super-admin-layout__sidebar']} ${sidebarOpen ? styles['super-admin-layout__sidebar--open'] : ''}`}>
          {/* Close button for mobile */}
          <div className={styles['super-admin-layout__sidebar-header']}>
            <button
              className={styles['super-admin-layout__close-btn']}
              onClick={() => setSidebarOpen(false)}
              aria-label={t('common.close')}
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className={styles['super-admin-layout__nav']}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth <= 768) setSidebarOpen(false);
                  }}
                  className={`${styles['super-admin-layout__nav-item']} ${
                    activeNav === item.id ? styles['super-admin-layout__nav-item--active'] : ''
                  }`}
                  title={item.label}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={styles['super-admin-layout__logout']}
            title={t('common.logout')}
          >
            <LogOut size={20} />
            <span>{t('common.logout')}</span>
          </button>
        </aside>

        {/* Main Content */}
        <div className={styles['super-admin-layout__main']}>
          {/* Content */}
          <div className={styles['super-admin-layout__content']}>
            <h1 className={styles['super-admin-layout__page-title']}>{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
