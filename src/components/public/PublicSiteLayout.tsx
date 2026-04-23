import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import styles from './PublicSiteLayout.module.css';

/**
 * Enveloppe unique des pages publiques : navbar + contenu + footer.
 * --nav-h est défini ici pour héritage par HomePage (hero) et cohérence viewport.
 */
export const PublicSiteLayout: React.FC = () => {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <div className={styles.siteRoot}>
      <PublicNavbar variant={isHome ? 'home' : 'default'} />
      <main className={styles.main}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicSiteLayout;
