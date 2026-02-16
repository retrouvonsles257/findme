/**
 * RETROUVONSLES - NGO Layout
 * Aligné sur Authority Layout : sidebar + header + main content
 */

import React, { useState } from 'react';
import { NGOSidebar } from './NGOSidebar';
import { NGOHeader } from './NGOHeader';
import styles from './NGOLayout.module.css';

export interface NGOLayoutProps {
  children: React.ReactNode;
}

export const NGOLayout: React.FC<NGOLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={styles.ngoLayout}>
      <NGOSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={`${styles.mainWrapper} ${
          sidebarOpen ? styles.sidebarOpen : styles.sidebarClosed
        }`}
      >
        <NGOHeader onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default NGOLayout;
