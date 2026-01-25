/**
 * =====================================================
 * RETROUVONSLES - Sidebar Operator
 * Barre latérale pour les opérateurs de saisie
 * =====================================================
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarNav } from './SidebarNav';
import { SidebarFooter } from './SidebarFooter';
import styles from './Sidebar.module.css';

interface SidebarOperatorProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const SidebarOperator: React.FC<SidebarOperatorProps> = ({ isCollapsed = false, onToggle }) => {
  const location = useLocation();

  const operatorMenuItems = [
    {
      label: 'Accueil',
      icon: '📊',
      path: '/operator/dashboard',
      exact: true,
    },
    {
      label: 'Mes Dossiers',
      icon: '📁',
      path: '/operator/dossiers',
      exact: false,
    },
    {
      label: 'Créer Dossier',
      icon: '➕',
      path: '/operator/create-dossier',
      exact: true,
    },
    {
      label: 'Saisie Données',
      icon: '📝',
      path: '/operator/data-entry',
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
            {operatorMenuItems.map((item) => (
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
          <p>Opérateur de Saisie</p>
        </div>
      </SidebarFooter>
    </aside>
  );
};

export default SidebarOperator;
