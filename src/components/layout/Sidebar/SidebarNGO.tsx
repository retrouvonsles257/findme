/**
 * =====================================================
 * RETROUVONSLES - Sidebar NGO Component
 * Barre latérale de navigation pour l'interface ONG
 * =====================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../../@types/auth.types';
import { useI18n } from '../../../hooks';

import styles from './SidebarAdminOrganisation.module.css';

interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  isActive?: boolean;
}

export interface SidebarNGOProps {
  navigationItems?: NavigationItem[];
  currentUser?: User | null;
  onLogout?: () => void;
}

export const SidebarNGO: React.FC<SidebarNGOProps> = ({
  navigationItems = [],
  currentUser,
}) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const defaultItems: NavigationItem[] = [
    { label: t('common.dashboard'), href: '/ngo/dashboard', icon: '📊' },
    { label: t('ngo.cases'), href: '/ngo/cases', icon: '📁' },
    { label: t('ngo.campaigns'), href: '/ngo/campagnes', icon: '📢' },
    { label: 'IA', href: '/ngo/ia', icon: '🧠' },
    { label: t('ngo.resources'), href: '/ngo/resources', icon: '📚' },
    { label: t('ngo.partnerships'), href: '/ngo/partnerships', icon: '🤝' },
  ];

  const items = navigationItems.length > 0 ? navigationItems : defaultItems;

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      {/* Toggle button */}
      <button
        className={styles.toggleBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? t('common.show') : t('common.hide')}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* User info */}
      <div className={styles.userInfo}>
        <div className={styles.userAvatar}>
          {getInitials(currentUser?.nom_complet)}
        </div>
        {!isCollapsed && (
          <div className={styles.userDetails}>
            <p className={styles.userName}>{currentUser?.nom_complet}</p>
            <p className={styles.userRole}>🤝 ONG</p>
          </div>
        )}
      </div>

      <hr className={styles.divider} />

      {/* Navigation items */}
      <nav className={styles.nav}>
        {items.map((item, idx) => (
          <Link
            key={idx}
            to={item.href}
            className={styles.navItem}
            title={isCollapsed ? item.label : ''}
          >
            <span className={styles.icon}>{item.icon}</span>
            {!isCollapsed && <span className={styles.label}>{item.label}</span>}
          </Link>
        ))}
      </nav>

      <hr className={styles.divider} />

      {/* Footer */}
      <div className={styles.footer}>
        {!isCollapsed && (
          <p className={styles.footerText}>
            © 2024 RETROUVONSLES
          </p>
        )}
      </div>
    </aside>
  );
};
