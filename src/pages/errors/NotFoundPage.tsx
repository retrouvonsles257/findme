/**
 * =====================================================
 * RETROUVONSLES - 404 Not Found Error Page
 * Page d'erreur 404 - Page non trouvée
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { selectUser } from '../../features/auth/store/authSelectors';
import { getDashboardPathAfterLogin } from '../../services/supabase/auth';
import styles from './NotFoundPage.module.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const authUser = useAppSelector(selectUser);

  useEffect(() => {
    // Log error for monitoring
    console.warn('404 Error: Page not found');
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    const u = authUser ?? currentUser;
    if (!u?.role) {
      navigate('/');
      return;
    }
    navigate(getDashboardPathAfterLogin(String(u.role), (u as { organisation_id?: string | null }).organisation_id ?? null));
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {/* Error Code */}
        <div className={styles.errorCode}>
          <span className={styles.code404}>404</span>
        </div>

        {/* Error Title */}
        <h1 className={styles.errorTitle}>{t('errors.404')}</h1>

        {/* Error Message */}
        <p className={styles.errorMessage}>
          {t('errors.not_found')}
        </p>

        {/* Error Description */}
        <p className={styles.errorDescription}>
          {t('errors.page_not_found')}
          <br />
          {t('errors.check_url')}
        </p>

        {/* Icons/Illustration */}
        <div className={styles.illustration}>
          <div className={styles.searchIcon}>🔍</div>
          <div className={styles.notFoundIcon}>❌</div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            className={styles.buttonSecondary}
            onClick={handleGoBack}
            aria-label={t('errors.previous_page')}
          >
            ← {t('errors.go_back')}
          </button>
          <button 
            className={styles.buttonPrimary}
            onClick={handleGoHome}
            aria-label={t('errors.home')}
          >
            {t('errors.home')} →
          </button>
        </div>

        {/* Additional Info */}
        <div className={styles.additionalInfo}>
          <p className={styles.infoText}>
            {t('errors.contact_support_error')}{' '}
            <a href="mailto:support@retrouvonsles.org" className={styles.supportLink}>
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
