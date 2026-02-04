import React from 'react';
import styles from './Sidebar.module.css';

export interface SidebarPublicProps {
  logo?: React.ReactNode;
  nav?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidebarPublic: React.FC<SidebarPublicProps> = ({ logo, nav, footer }) => {
  return (
    <aside className={styles.sidebar}>
      {logo && <div className={styles.logo}>{logo}</div>}
      {nav && <div className={styles.nav}>{nav}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
};
