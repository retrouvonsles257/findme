import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { Menu, X, LogOut, Globe, LayoutDashboard, FolderPlus, FileInput, FolderOpen, FileText } from 'lucide-react';
import styles from './OperatorLayout.module.css';

interface OperatorLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const OperatorLayout: React.FC<OperatorLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    navigate('/auth/login');
  };

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { path: '/operator/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { path: '/operator/create-dossier', label: t('operator.createDossier'), icon: FolderPlus },
    { path: '/operator/data-entry', label: t('operator.dataEntry'), icon: FileInput },
    { path: '/operator/my-dossiers', label: t('operator.myDossiers'), icon: FolderOpen },
    { path: '/operator/dossier/:id', label: t('operator.dossierDetails'), icon: FileText },
  ];

  return (
    <div className={styles['operator-layout']}>
      {/* Header */}
      <header className={styles['operator-layout__header']}>
        <button
          className={styles['operator-layout__menu-button']}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>

        <div className={styles['operator-layout__logo']}>RL</div>

        <div className={styles['operator-layout__header-actions']}>
          <button
            className={styles['operator-layout__language-switcher']}
            onClick={toggleLanguage}
          >
            <Globe size={20} />
            <span>{language === 'fr' ? 'FR' : 'EN'}</span>
          </button>

          <div className={styles['operator-layout__user-info']}>
            <div className={styles['operator-layout__user-avatar']}>
              {getInitials(currentUser?.nom_complet)}
            </div>
            <span className={styles['operator-layout__user-name']}>
              {currentUser?.nom_complet || 'User'}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={styles['operator-layout__body']}>
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className={styles['operator-layout__overlay']}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${styles['operator-layout__sidebar']} ${
            sidebarOpen ? styles['operator-layout__sidebar--open'] : ''
          }`}
        >
          <div className={styles['operator-layout__sidebar-header']}>
            <button
              className={styles['operator-layout__close-btn']}
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className={styles['operator-layout__nav']}>
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  className={`${styles['operator-layout__nav-item']} ${
                    isActive ? styles['operator-layout__nav-item--active'] : ''
                  }`}
                  onClick={() => {
                    navigate(item.path);
                    if (window.innerWidth <= 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            className={styles['operator-layout__logout']}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>{t('common.logout')}</span>
          </button>
        </aside>

        {/* Main content */}
        <div className={styles['operator-layout__main']}>
          <div className={styles['operator-layout__content']}>
            <h1 className={styles['operator-layout__page-title']}>{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
