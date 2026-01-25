/**
 * =====================================================
 * RETROUVONSLES - Sidebar Admin Component
 * Barre latérale de navigation pour l'interface admin
 * =====================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Folder,
  FileText,
  Users,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
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

export interface SidebarAdminOrganisationProps {
  navigationItems?: NavigationItem[];
  currentUser?: User | null;
  onLogout?: () => void;
}

const iconMap: Record<string, any> = {
  '📊': LayoutDashboard,
  '📁': Folder,
  '📋': FileText,
  '👥': Users,
  '📈': BarChart3,
  '⚙️': Settings,
  '🔒': Shield,
  '📜': ScrollText,
};

export const SidebarAdminOrganisation: React.FC<SidebarAdminOrganisationProps> = ({
  navigationItems = [],
  currentUser,
}) => {
  const { t } = useI18n();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const defaultItems: NavigationItem[] = [
    { label: t('common.dashboard'), href: '/admin/dashboard', icon: '📊' },
    { label: t('admin.dossiers'), href: '/admin/dossiers', icon: '📁' },
    { label: t('admin.rapports'), href: '/admin/rapports', icon: '📋' },
    { label: t('admin.utilisateurs'), href: '/admin/utilisateurs', icon: '👥' },
    { label: t('admin.statistiques'), href: '/admin/statistiques', icon: '📈' },
    { label: t('admin.rolesManagement'), href: '/admin/roles', icon: '🔒' },
    { label: t('admin.auditLogs'), href: '/admin/audit-logs', icon: '📜' },
    { label: t('admin.parametres'), href: '/admin/parametres', icon: '⚙️' },
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
    <aside className={`${styles.sidebar} ${isCollapsed ? styles['sidebar--collapsed'] : ''}`}>
      {/* Toggle Button */}
      <button
        className={styles.sidebar__toggleBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Afficher le menu' : 'Masquer le menu'}
      >
        {isCollapsed ? (
          <ChevronRight className={styles.sidebar__toggleIcon} />
        ) : (
          <ChevronLeft className={styles.sidebar__toggleIcon} />
        )}
      </button>

      {/* Header */}
      <div className={styles.sidebar__header}>
        <div className={styles.sidebar__logo}>
          <Building2 className={styles.sidebar__logoIcon} />
        </div>
        {!isCollapsed && (
          <div className={styles.sidebar__orgInfo}>
            <p className={styles.sidebar__orgName}>{t('admin.organisation')}</p>
            <p className={styles.sidebar__orgRole}>
              {currentUser?.role || NomRole.ADMIN_ORGANISATION}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={styles.sidebar__navigation}>
        <ul className={styles.sidebar__navList}>
          {items.map((item, idx) => {
            const IconComponent = iconMap[item.icon] || LayoutDashboard;
            return (
              <li key={idx} className={styles.sidebar__navItem}>
                <Link
                  to={item.href}
                  className={`${styles.sidebar__navLink} ${item.isActive ? styles['sidebar__navLink--active'] : ''}`}
                  title={item.label}
                >
                  <IconComponent className={styles.sidebar__navIcon} />
                  {!isCollapsed && (
                    <span className={styles.sidebar__navLabel}>{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      {!isCollapsed && (
        <div className={styles.sidebar__userSection}>
          <div className={styles.sidebar__userCard}>
            <div className={styles.sidebar__userAvatar}>
              {getInitials(currentUser?.nom_complet)}
            </div>
            <div className={styles.sidebar__userDetails}>
              <p className={styles.sidebar__userName}>{currentUser?.nom_complet}</p>
              <p className={styles.sidebar__userEmail}>{currentUser?.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div className={styles.sidebar__footer}>
          <p className={styles.sidebar__versionText}>v1.0.0</p>
        </div>
      )}
    </aside>
  );
};

export default SidebarAdminOrganisation;