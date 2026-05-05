/**
 * =====================================================
 * RETROUVONSLES - 500 Server Error Page
 * Page d'erreur 500 - Erreur serveur
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { selectUser } from '../../features/auth/store/authSelectors';
import { getDashboardPathAfterLogin } from '../../services/supabase/auth';
import styles from './ServerErrorPage.module.css';

interface ErrorDetails {
  code?: number;
  message?: string;
  timestamp: string;
  requestId: string;
}

export const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentUser = useAppSelector(selectCurrentUser);
  const authUser = useAppSelector(selectUser);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails>({
    code: 500,
    message: 'Internal Server Error',
    timestamp: new Date().toISOString(),
    requestId: `REQ-${new Date().getTime()}`,
  });
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    // Log error for monitoring
    console.error('500 Error: Server error', {
      timestamp: new Date().toISOString(),
      requestId: errorDetails.requestId,
      user: currentUser?.id,
    });
  }, [errorDetails, currentUser]);

  const handleRetry = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    const u = authUser ?? currentUser;
    if (!u?.role) {
      navigate('/');
      return;
    }
    navigate(getDashboardPathAfterLogin(String(u.role), (u as { organisation_id?: string | null }).organisation_id ?? null));
  };

  const handleReportIssue = () => {
    const reportUrl = `mailto:support@retrouvonsles.org?subject=Erreur Serveur 500&body=Error ID: ${errorDetails.requestId}%0ATimestamp: ${errorDetails.timestamp}`;
    window.location.href = reportUrl;
  };

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorContent}>
        {/* Error Code */}
        <div className={styles.errorCode}>
          <span className={styles.code500}>500</span>
        </div>

        {/* Error Title */}
        <h1 className={styles.errorTitle}>{t('errors.500')}</h1>

        {/* Error Message */}
        <p className={styles.errorMessage}>
          {t('errors.server')}
        </p>

        {/* Error Description */}
        <p className={styles.errorDescription}>
          {t('errors.server_error_description')}
        </p>

        {/* Icons/Illustration */}
        <div className={styles.illustration}>
          <div className={styles.serverIcon}>🖥️</div>
          <div className={styles.errorIcon}>⚠️</div>
        </div>

        {/* Status Info */}
        <div className={styles.statusSection}>
          <h3 className={styles.statusTitle}>{t('errors.service_status')}</h3>
          <div className={styles.statusInfo}>
            <p>
              <strong>{t('errors.error_code')}</strong> {errorDetails.code}
            </p>
            <p>
              <strong>{t('errors.time')}</strong> {new Date(errorDetails.timestamp).toLocaleString('en-US')}
            </p>
            <p>
              <strong>{t('errors.request_id')}</strong> {errorDetails.requestId}
            </p>
          </div>
        </div>

        {/* What We're Doing */}
        <div className={styles.actionSection}>
          <h3 className={styles.actionTitle}>{t('errors.what_we_doing')}</h3>
          <ul className={styles.actionList}>
            <li>{t('errors.investigating_error')}</li>
            <li>{t('errors.diagnosing_servers')}</li>
            <li>{t('errors.update_coming')}</li>
            <li>{t('errors.check_status')}{' '}
              <a href="/status" className={styles.statusLink}>
                {t('errors.status_page')}
              </a>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className={styles.actions}>
          <button 
            className={styles.buttonPrimary}
            onClick={handleRetry}
            disabled={retryCount >= maxRetries}
            aria-label={t('errors.retry')}
          >
            {retryCount === 0 && `${t('errors.retry')} →`}
            {retryCount > 0 && retryCount < maxRetries && `${t('errors.retry')} (${retryCount}/${maxRetries})`}
            {retryCount >= maxRetries && t('errors.maximum_retries')}
          </button>
          <button 
            className={styles.buttonSecondary}
            onClick={handleGoHome}
            aria-label={t('errors.go_home')}
          >
            {t('errors.go_home')}
          </button>
        </div>

        {/* Report Issue */}
        <div className={styles.reportSection}>
          <button 
            className={styles.reportButton}
            onClick={handleReportIssue}
            aria-label={t('errors.report_issue')}
          >
            📧 {t('errors.report_issue')}
          </button>
          <p className={styles.reportText}>
            {t('errors.request_id')}: <code>{errorDetails.requestId}</code>
          </p>
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
          <code>{t('errors.error_id_for_support')}: {errorDetails.requestId}</code>
        </div>
      </div>
    </div>
  );
};
