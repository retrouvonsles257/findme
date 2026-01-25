import React from 'react';
import { SidebarNav } from './SidebarNav';
import styles from './Sidebar.module.css';

export interface SidebarCitizenProps {
  logo?: React.ReactNode;
  nav?: React.ReactNode;
  profile?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidebarCitizen: React.FC<SidebarCitizenProps> = ({ logo, nav, profile, footer }) => {
  return (
    <aside className={styles.sidebar}>
      {logo && <div className={styles.logo}>{logo}</div>}
      {profile && <div className={styles.profile}>{profile}</div>}
      {nav && <div className={styles.nav}>{nav}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
};
