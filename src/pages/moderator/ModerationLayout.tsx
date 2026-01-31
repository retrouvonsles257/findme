/**
 * =====================================================
 * RETROUVONSLES - Moderator Layout
 * Layout principal pour les pages modérateur
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../hooks';
import { useAppSelector } from '../../store/types';
import { selectUser } from '../../features/auth/store/authSelectors';
import { supabase } from '../../config';
import {
  Home,
  CheckCircle,
  Image,
  BarChart3,
  LogOut,
  Menu,
  X,
  Globe,
  Brain,
  UserCheck,
  MapPin,
  Bell,
  History,
  Heart,
} from 'lucide-react';
import styles from './ModerationLayout.module.css';

// Helper pour Supabase
const db = () => supabase as any;

interface ModerationLayoutProps {
  children: React.ReactNode;
  title: string;
  activeNav: 'dashboard' | 'validation' | 'photos' | 'reports' | 'ia' | 'identity' | 'map' | 'notifications' | 'history';
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Charger le nombre de notifications non lues
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!currentUser?.id) return;
      try {
        const { count, error } = await db()
          .from('notification')
          .select('*', { count: 'exact', head: true })
          .eq('id_utilisateur', currentUser.id)
          .eq('lue', false);
        
        if (!error) {
          setUnreadNotifications(count || 0);
        }
      } catch (err) {
        console.error('Error loading unread count:', err);
      }
    };

    loadUnreadCount();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

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
      id: 'ia',
      label: t('moderator.iaResults') || 'Résultats IA',
      path: '/moderator/ia-results',
      icon: Brain,
    },
    {
      id: 'identity',
      label: t('moderator.identityVerification') || 'Vérification ID',
      path: '/moderator/identity-verification',
      icon: UserCheck,
    },
    {
      id: 'map',
      label: t('moderator.mapView') || 'Vue Carte',
      path: '/moderator/map-view',
      icon: MapPin,
    },
    {
      id: 'notifications',
      label: t('common.notifications') || 'Notifications',
      path: '/moderator/notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    {
      id: 'history',
      label: t('moderator.activityHistory') || 'Mon Historique',
      path: '/moderator/activity-history',
      icon: History,
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
            const badge = (item as any).badge;
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
                <div className={styles['moderation-layout__nav-icon']}>
                  <Icon size={20} />
                  {badge !== undefined && badge > 0 && (
                    <span className={styles['moderation-layout__badge']}>{badge > 99 ? '99+' : badge}</span>
                  )}
                </div>
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
            {/* Bouton Soutenir le projet */}
            <button
              className={styles['moderation-layout__donate-btn']}
              onClick={() => navigate('/donate')}
              title={t('common.supportProject') || 'Soutenir le projet'}
            >
              <Heart size={18} />
              <span>{sidebarOpen ? (t('common.support') || 'Soutenir') : ''}</span>
            </button>

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