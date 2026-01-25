import React from 'react';
import styles from './Sidebar.module.css';

export interface SidebarAuthorityProps {
  logo?: React.ReactNode;
  nav?: React.ReactNode;
  alerts?: React.ReactNode;
  profile?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidebarAuthority: React.FC<SidebarAuthorityProps> = ({
  logo,
  nav,
  alerts,
  profile,
  footer,
}) => {
  return (
    <aside className={styles.sidebar}>
      {logo && <div className={styles.logo}>{logo}</div>}
      {alerts && <div className={styles.alerts}>{alerts}</div>}
      {profile && <div className={styles.profile}>{profile}</div>}
      {nav && <div className={styles.nav}>{nav}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  );
};
