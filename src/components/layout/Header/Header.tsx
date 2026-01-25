import React, { useState } from 'react';
import { HeaderPublic } from './HeaderPublic';
import { HeaderCitizen } from './HeaderCitizen';
import { HeaderAuthority } from './HeaderAuthority';
import styles from './Header.module.css';

export type HeaderType = 'public' | 'citizen' | 'authority';

export interface HeaderProps {
  type?: HeaderType;
  logo: React.ReactNode;
  nav?: React.ReactNode;
  search?: React.ReactNode;
  alerts?: React.ReactNode;
  notifications?: React.ReactNode;
  profile?: React.ReactNode;
  actions?: React.ReactNode;
  mobileMenuToggle?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  type = 'public',
  logo,
  nav,
  search,
  alerts,
  notifications,
  profile,
  actions,
  mobileMenuToggle,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const commonProps = {
    logo,
    nav,
    search,
    notifications,
    profile,
  };

  return (
    <>
      <div className={styles.desktopHeader}>
        {type === 'public' && <HeaderPublic {...commonProps} actions={actions} />}
        {type === 'citizen' && <HeaderCitizen {...commonProps} />}
        {type === 'authority' && <HeaderAuthority {...commonProps} alerts={alerts} />}
      </div>

      {mobileMenuToggle && (
        <div
          className={styles.mobileToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {mobileMenuToggle}
        </div>
      )}
    </>
  );
};
