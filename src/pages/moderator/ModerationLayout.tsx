/**
 * =====================================================
 * RETROUVONSLES - Moderator Layout
 * Layout principal pour les pages modérateur
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import {
  Home,
  CheckCircle,
  Image,
  BarChart3,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import styles from './ModerationLayout.module.css';

interface ModerationLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav: 'dashboard' | 'validation' | 'photos' | 'reports';
}

export const ModerationLayout: React.FC<ModerationLayoutProps> = ({
  children,
  title,
  activeNav,
}) => {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useI18n();
  const currentUser = useAppSelector(selectUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    {
      id: 'dashboard',
      label: t('common.dashboard'),
      path: '/moderator/dashboard',
      icon: Home,
    },
    {
      id: 'validation',
      label: t('moderator.validation'),
      path: '/moderator/signalements-validation',
      icon: CheckCircle,
    },
    {
      id: 'photos',
      label: t('moderator.photoModeration'),
      path: '/moderator/photos-moderation',
      icon: Image,
    },
    {
      id: 'reports',
      label: t('moderator.reports'),
      path: '/moderator/reports',
      icon: BarChart3,
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
    <div className={styles['moderation-layout']}>
      {/* Sidebar */}
      <aside
        className={`${styles['moderation-layout__sidebar']} ${
          !sidebarOpen ? styles['moderation-layout__sidebar--collapsed'] : ''
        }`}
      >
        <div className={styles['moderation-layout__logo']}>
          <h1>RL</h1>
        </div>

        <nav className={styles['moderation-layout__nav']}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`${styles['moderation-layout__nav-item']} ${
                  activeNav === item.id
                    ? styles['moderation-layout__nav-item--active']
                    : ''
                }`}
                title={item.label}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className={styles['moderation-layout__logout']}
          title={t('common.logout')}
        >
          <LogOut size={20} />
          {sidebarOpen && <span>{t('common.logout')}</span>}
        </button>
      </aside>

      {/* Main Content */}
      <div className={styles['moderation-layout__main']}>
        {/* Header */}
        <header className={styles['moderation-layout__header']}>
          <div className={styles['moderation-layout__header-left']}>
            <button
              className={styles['moderation-layout__menu-btn']}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h2 className={styles['moderation-layout__title']}>{title}</h2>
          </div>

          <div className={styles['moderation-layout__header-right']}>
            <button
              className={styles['moderation-layout__language']}
              onClick={toggleLanguage}
              title={t('common.language')}
            >
              <Globe size={20} />
              <span>{language.toUpperCase()}</span>
            </button>

            <div className={styles['moderation-layout__user']}>
              <div className={styles['moderation-layout__user-avatar']}>
                {currentUser?.prenom?.charAt(0).toUpperCase() || 'M'}
              </div>
              <span className={styles['moderation-layout__user-name']}>
                {currentUser?.prenom && currentUser?.nom
                  ? `${currentUser.prenom} ${currentUser.nom}`
                  : currentUser?.email || 'Moderator'}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className={styles['moderation-layout__content']}>{children}</main>
      </div>
    </div>
  );
};

export default ModerationLayout;