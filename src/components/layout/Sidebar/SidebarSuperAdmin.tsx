/**
 * =====================================================
 * RETROUVONSLES - Sidebar Super Admin Component
 * Barre latérale de navigation pour l'interface super admin
 * =====================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../../../@types/auth.types';
import { useI18n } from '../../../hooks';
import { NomRole } from '../../../@types/enums.types';

import styles from './SidebarAdminOrganisation.module.css';

interface NavigationItem {
  label: string;
  href: string;
  icon: string;
  isActive?: boolean;
}

export interface SidebarSuperAdminProps {
  navigationItems?: NavigationItem[];
  currentUser?: User | null;
  onLogout?: () => void;
}

export const SidebarSuperAdmin: React.FC<SidebarSuperAdminProps> = ({
  navigationItems = [],
  currentUser,
}) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const defaultItems: NavigationItem[] = [
    { label: t('common.dashboard'), href: '/super-admin/dashboard', icon: '📊' },
    { label: t('super_admin.globalStats'), href: '/super-admin/global-stats', icon: '🌍' },
    { label: t('super_admin.organisations'), href: '/super-admin/organisations', icon: '🏢' },
    { label: t('super_admin.systemUsers'), href: '/super-admin/system-users', icon: '👥' },
    { label: t('super_admin.systemLogs'), href: '/super-admin/system-logs', icon: '📋' },
    { label: t('super_admin.systemSettings'), href: '/super-admin/system-settings', icon: '⚙️' },
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
      {/* Bouton de fermeture (mobile) */}
      <button
        className={styles.toggleBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Afficher le menu' : 'Masquer le menu'}
      >
        {isCollapsed ? '→' : '←'}
      </button>

      {/* En-tête du sidebar */}
      <div className={styles.sidebarHeader}>
        <div className={styles.orgLogo}>
          👑
        </div>
        {!isCollapsed && (
          <div className={styles.orgInfo}>
            <p className={styles.orgName}>{t('super_admin.title')}</p>
            <p className={styles.orgRole}>{NomRole.SUPER_ADMIN}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.navigation}>
        <ul className={styles.navList}>
          {items.map((item, idx) => (
            <li key={idx} className={styles.navItem}>
              <Link
                to={item.href}
                className={`${styles.navLink} ${item.isActive ? styles.active : ''}`}
                title={item.label}
              >
                <span className={styles.icon}>{item.icon}</span>
                {!isCollapsed && <span className={styles.label}>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Section utilisateur */}
      {!isCollapsed && (
        <div className={styles.userSection}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              {getInitials(currentUser?.nom_complet)}
            </div>
            <div className={styles.userDetails}>
              <p className={styles.userName}>{currentUser?.nom_complet}</p>
              <p className={styles.userEmail}>{currentUser?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pied de page */}
      {!isCollapsed && (
        <div className={styles.footer}>
          <p className={styles.versionText}>v1.0.0 - SUPER ADMIN</p>
        </div>
      )}
    </aside>
  );
};
