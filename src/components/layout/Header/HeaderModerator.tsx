/**
 * =====================================================
 * RETROUVONSLES - Header Moderator
 * En-tête pour les modérateurs
 * =====================================================
 */

import React from 'react';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { HeaderLogo } from './HeaderLogo';
import { HeaderNav } from './HeaderNav';
import { HeaderProfile } from './HeaderProfile';
import styles from './Header.module.css';

interface HeaderModeratorProps {
  children?: React.ReactNode;
}

const HeaderModerator: React.FC<HeaderModeratorProps> = ({ children }) => {
  const currentUser = useAppSelector(selectCurrentUser);

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <HeaderLogo logo={<div>Retrouvons Les</div>} />
        </div>

        {/* Navigation */}
        <nav className={styles.navSection}>
          <HeaderNav>
            <a href="/moderator/dashboard">Dashboard</a>
            <a href="/moderator/signalements">Signalements</a>
            <a href="/moderator/photos">Photos</a>
            <a href="/moderator/rapports">Rapports</a>
          </HeaderNav>
        </nav>

        {/* Profile */}
        <div className={styles.profileSection}>
          <HeaderProfile name={currentUser?.nom_complet} role={currentUser?.role} avatar={<div>{currentUser?.nom_complet?.charAt(0)}</div>} />
        </div>
      </div>
    </header>
  );
};

export default HeaderModerator;
