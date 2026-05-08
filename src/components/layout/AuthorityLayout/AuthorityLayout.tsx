/**
 * =====================================================
 * RETROUVONSLES - Authority Layout
 * Layout principal pour les pages autorités (Police/Gendarmerie)
 * Sidebar collapsible style ChatGPT/Claude
 * =====================================================
 */

import React, { useState, createContext, useContext } from 'react';
import { AuthoritySidebar } from './AuthoritySidebar';
import { AuthorityHeader } from './AuthorityHeader';
import styles from './AuthorityLayout.module.css';

interface AuthorityLayoutContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const AuthorityLayoutContext = createContext<AuthorityLayoutContextType>({
  sidebarOpen: true,
  toggleSidebar: () => {},
  setSidebarOpen: () => {},
});

export const useAuthorityLayout = () => useContext(AuthorityLayoutContext);

export interface AuthorityLayoutProps {
  children: React.ReactNode;
}

export const AuthorityLayout: React.FC<AuthorityLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <AuthorityLayoutContext.Provider value={{ sidebarOpen, toggleSidebar, setSidebarOpen }}>
      <div className={styles.authorityLayout}>
        <AuthoritySidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

        <div className={`${styles.mainWrapper} ${sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
          <AuthorityHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

          <main className={styles.mainContent}>
            {children}
          </main>
        </div>
      </div>
    </AuthorityLayoutContext.Provider>
  );
};

export default AuthorityLayout;
