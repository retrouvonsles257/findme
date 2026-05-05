/**
 * =====================================================
 * RETROUVONSLES - 401 Unauthorized Error Page
 * Page d'erreur 401 - Authentification requise
 * =====================================================
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { selectUser } from '../../features/auth/store/authSelectors';
import { clearUsers } from '../../features/users/store/userSlice';
import { AUTH_ROUTES } from '../../routes/routes.config';
import { getDashboardPathAfterLogin } from '../../services/supabase/auth';
import styles from './UnauthorizedPage.module.css';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const authUser = useAppSelector(selectUser);

  useEffect(() => {
    // Log error for monitoring
    console.warn('401 Error: Unauthorized access attempt');
  }, []);

  const handleLogin = () => {
    // Clear user data before navigating to login
    if (currentUser) {
      dispatch(clearUsers());
    }
    navigate(AUTH_ROUTES.LOGIN);
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
          <span className={styles.code401}>401</span>
        </div>

        {/* Error Title */}
        <h1 className={styles.errorTitle}>{t('errors.unauthorized')}</h1>

        {/* Error Message */}
        <p className={styles.errorMessage}>
          {t('errors.authentication_required')}
        </p>

        {/* Error Description */}
        <p className={styles.errorDescription}>
          {t('errors.authentication_required')}
          <br />
          {t('errors.please_login')}
        </p>

        {/* Icons/Illustration */}
        <div className={styles.illustration}>
          <div className={styles.lockIcon}>🔒</div>
          <div className={styles.keyIcon}>🔑</div>
        </div>

        {/* Reason Section */}
        <div className={styles.reasonSection}>
          <h3 className={styles.reasonTitle}>{t('errors.possible_reasons')}</h3>
          <ul className={styles.reasonList}>
            <li>{t('errors.session_expired')}</li>
            <li>{t('errors.invalid_credentials')}</li>
            <li>{t('errors.unauthorized_access')}</li>
            <li>{t('errors.account_disabled')}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            className={styles.buttonPrimary}
            onClick={handleLogin}
            aria-label={t('errors.login')}
          >
            {t('errors.login')} →
          </button>
          {currentUser && (
            <button 
              className={styles.buttonSecondary}
              onClick={handleGoHome}
              aria-label={t('errors.go_back')}
            >
              {t('errors.go_back')}
            </button>
          )}
        </div>

        {/* Additional Info */}
        <div className={styles.additionalInfo}>
          <p className={styles.infoText}>
            {t('errors.need_help')}{' '}
            <a href="/help" className={styles.supportLink}>
              {t('errors.our_help_center')}
            </a>{' '}
            {t('errors.or_contact')}{' '}
            <a href="mailto:support@retrouvonsles.org" className={styles.supportLink}>
              support
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
