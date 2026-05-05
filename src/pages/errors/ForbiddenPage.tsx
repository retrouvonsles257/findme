/**
 * =====================================================
 * RETROUVONSLES - 403 Forbidden Error Page
 * Page d'erreur 403 - Accès refusé
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { selectUser } from '../../features/auth/store/authSelectors';
import { getDashboardPathAfterLogin } from '../../services/supabase/auth';
import styles from './ForbiddenPage.module.css';

export const ForbiddenPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const authUser = useAppSelector(selectUser);

  useEffect(() => {
    // Log error for monitoring
    console.warn('403 Error: Forbidden access attempt', {
      user: currentUser?.id,
      role: currentUser?.role,
      timestamp: new Date().toISOString(),
    });
  }, [currentUser]);

  const handleGoHome = () => {
    const u = authUser ?? currentUser;
    if (!u?.role) {
      navigate('/');
      return;
    }
    navigate(getDashboardPathAfterLogin(String(u.role), (u as { organisation_id?: string | null }).organisation_id ?? null));
  };

  const handleRequestAccess = () => {
    navigate('/request-access');
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {/* Error Code */}
        <div className={styles.errorCode}>
          <span className={styles.code403}>403</span>
        </div>

        {/* Error Title */}
        <h1 className={styles.errorTitle}>{t('errors.403')}</h1>

        {/* Error Message */}
        <p className={styles.errorMessage}>
          {t('errors.access_denied')}
        </p>

        {/* Error Description */}
        <p className={styles.errorDescription}>
          {t('errors.permission_denied')}
          <br />
          {t('errors.insufficient_rights')}
        </p>

        {/* Icons/Illustration */}
        <div className={styles.illustration}>
          <div className={styles.prohibitIcon}>🚫</div>
          <div className={styles.shieldIcon}>🛡️</div>
        </div>

        {/* Access Info */}
        <div className={styles.accessSection}>
          <h3 className={styles.accessTitle}>{t('errors.required_permissions')}</h3>
          <div className={styles.accessInfo}>
            <p>
              <strong>{t('errors.current_role')}</strong> {currentUser?.role || t('errors.not_connected')}
            </p>
            <p>
              <strong>{t('errors.username')}</strong> {currentUser?.nom_complet || t('errors.anonymous')}
            </p>
            <p>
              <strong>{t('errors.organization')}</strong> {currentUser?.organisation_id || t('errors.not_available')}
            </p>
          </div>
        </div>

        {/* Required Permissions */}
        <div className={styles.permissionsSection}>
          <h3 className={styles.permissionsTitle}>{t('errors.required_permissions')}</h3>
          <p className={styles.permissionText}>
            {t('errors.contact_administrator')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            className={styles.buttonPrimary}
            onClick={handleGoHome}
            aria-label={t('errors.go_home')}
          >
            {t('errors.go_home')} →
          </button>
          <button 
            className={styles.buttonSecondary}
            onClick={handleRequestAccess}
            aria-label={t('errors.request_access')}
          >
            {t('errors.request_access')}
          </button>
        </div>

        {/* Additional Info */}
        <div className={styles.additionalInfo}>
          <p className={styles.infoText}>
            {t('errors.contact_support_error')}{' '}
            <a href="mailto:admin@retrouvonsles.org" className={styles.supportLink}>
              {t('errors.or_contact')} support
            </a>
          </p>
        </div>

        {/* Error ID for Support */}
        <div className={styles.errorId}>
          <code>{t('errors.error_id_for_support')}: {new Date().getTime()}</code>
        </div>
      </div>
    </div>
  );
};
