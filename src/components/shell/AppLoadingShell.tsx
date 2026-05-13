/**
 * Écran de chargement plein écran (session, code-split, déconnexion).
 */
import React from 'react';
import { APP_LOGO_SRC } from '../../config/branding';
import styles from './AppLoadingShell.module.css';

export type AppLoadingShellVariant = 'session' | 'logout' | 'lazy';

const COPY: Record<AppLoadingShellVariant, { subtitle: string }> = {
  session: { subtitle: 'Préparation de votre session…' },
  logout: { subtitle: 'Déconnexion en cours, merci de patienter…' },
  lazy: { subtitle: 'Chargement de l’application…' },
};

export interface AppLoadingShellProps {
  variant: AppLoadingShellVariant;
  /** Couvre tout le viewport (recommandé pour F5 / Suspense). */
  fixed?: boolean;
}

export const AppLoadingShell: React.FC<AppLoadingShellProps> = ({ variant, fixed = true }) => {
  const { subtitle } = COPY[variant];

  return (
    <div className={fixed ? styles.rootFixed : styles.rootFlow} role="status" aria-live="polite">
      <div className={styles.card}>
        <img src={APP_LOGO_SRC} alt="" className="app-brand-logo app-brand-logo--prominent" />
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.spinner} aria-hidden />
      </div>
    </div>
  );
};
