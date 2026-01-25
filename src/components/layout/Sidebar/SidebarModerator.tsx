/**
 * =====================================================
 * RETROUVONSLES - Sidebar Moderator
 * Barre latérale pour les modérateurs
 * =====================================================
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import styles from './Sidebar.module.css';

interface SidebarModeratorProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const SidebarModerator: React.FC<SidebarModeratorProps> = ({ isCollapsed = false, onToggle }) => {
  const location = useLocation();

  const moderatorMenuItems = [
    {
      label: 'Tableau de Bord',
      icon: '📊',
      path: '/moderator/dashboard',
      exact: true,
    },
    {
      label: 'Validation Signalements',
      icon: '✅',
      path: '/moderator/signalements',
      exact: false,
    },
    {
      label: 'Modération Photos',
      icon: '🖼️',
      path: '/moderator/photos',
      exact: false,
    },
    {
      label: 'Rapports de Modération',
      icon: '📋',
      path: '/moderator/rapports',
      exact: true,
    },
  ];

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarContent}>
        {onToggle && (
          <button className={styles.toggleButton} onClick={onToggle}>
            ☰
          </button>
        )}

        <nav className={styles.nav}>
          <SidebarNav>
            {moderatorMenuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={location.pathname === item.path || (location.pathname.startsWith(item.path) && !item.exact) ? 'active' : ''}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </a>
            ))}
          </SidebarNav>
        </nav>
      </div>

      <SidebarFooter>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          <p>Modérateur</p>
        </div>
      </SidebarFooter>
    </aside>
  );
};

export default SidebarModerator;
