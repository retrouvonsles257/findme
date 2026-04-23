/**
 * =====================================================
 * RETROUVONSLES - Header Operator
 * En-tête pour les opérateurs de saisie
 * =====================================================
 */

import React from 'react';
import { useI18n } from '../../../hooks';
import { useAppSelector } from '../../../store/hooks';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { HeaderLogo } from './HeaderLogo';
import { HeaderNav } from './HeaderNav';
import { HeaderProfile } from './HeaderProfile';
import styles from './Header.module.css';

interface HeaderOperatorProps {
  children?: React.ReactNode;
}

const HeaderOperator: React.FC<HeaderOperatorProps> = ({ children }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const { t } = useI18n();

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        {/* Logo */}
        <div className={styles.logoSection}>
          <HeaderLogo logo={<div>{t('common.appName')}</div>} />
        </div>

        {/* Navigation */}
        <nav className={styles.navSection}>
          <HeaderNav>
            <a href="/operator/dashboard">Dashboard</a>
            <a href="/operator/dossiers">Dossiers</a>
            <a href="/operator/create-dossier">Créer</a>
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

export default HeaderOperator;
