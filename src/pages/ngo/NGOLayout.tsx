import React, { useCallback, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppDispatch, useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { logoutThunk } from '../../features/auth/store/authThunks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { Menu, X, LogOut, Globe, FileText, Users, Briefcase, BookOpen, Handshake, Brain } from 'lucide-react';
import styles from './NGOLayout.module.css';

interface NGOLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const NGOLayout: React.FC<NGOLayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language, changeLanguage } = useI18n();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector(selectUser) as any;
  const currentUserProfile = useAppSelector(selectCurrentUser) as any;
  const currentUser = currentUserProfile || authUser;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = useCallback(async () => {
    try {
      await dispatch(logoutThunk() as any);
    } catch {
      // Best-effort: même si le logout échoue, on redirige vers login
    } finally {
      navigate('/auth/login', { replace: true });
    }
  }, [dispatch, navigate]);

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
    { path: '/ngo/dashboard', label: t('common.dashboard'), icon: FileText },
    { path: '/ngo/cases', label: t('ngo.cases'), icon: Users },
    { path: '/ngo/campagnes', label: t('ngo.campaigns'), icon: Briefcase },
    { path: '/ngo/ia', label: 'IA', icon: Brain },
    { path: '/ngo/resources', label: t('ngo.resources'), icon: BookOpen },
    { path: '/ngo/partnerships', label: t('ngo.partnerships'), icon: Handshake },
  ];

  return (
    <div className={styles['ngo-layout']}>
      {/* Header */}
      <header className={styles['ngo-layout__header']}>
        <button
          className={styles['ngo-layout__menu-button']}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </button>

        <div className={styles['ngo-layout__logo']}>RL</div>

        <div className={styles['ngo-layout__header-actions']}>
          <button
            className={styles['ngo-layout__language-switcher']}
            onClick={toggleLanguage}
          >
            <Globe size={20} />
            <span>{language === 'fr' ? 'FR' : 'EN'}</span>
          </button>

          <div className={styles['ngo-layout__user-info']}>
            <div className={styles['ngo-layout__user-avatar']}>
              {getInitials(currentUser?.nom_complet)}
            </div>
            <span className={styles['ngo-layout__user-name']}>
              {currentUser?.nom_complet || 'User'}
            </span>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className={styles['ngo-layout__body']}>
        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className={styles['ngo-layout__overlay']}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${styles['ngo-layout__sidebar']} ${
            sidebarOpen ? styles['ngo-layout__sidebar--open'] : ''
          }`}
        >
          <div className={styles['ngo-layout__sidebar-header']}>
            <button
              className={styles['ngo-layout__close-btn']}
              onClick={() => setSidebarOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <nav className={styles['ngo-layout__nav']}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  className={`${styles['ngo-layout__nav-item']} ${
                    isActive ? styles['ngo-layout__nav-item--active'] : ''
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
            className={styles['ngo-layout__logout']}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>{t('common.logout')}</span>
          </button>
        </aside>

        {/* Main content */}
        <div className={styles['ngo-layout__main']}>
          <div className={styles['ngo-layout__content']}>
            <h1 className={styles['ngo-layout__page-title']}>{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
