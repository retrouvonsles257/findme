import React from 'react';
import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';
import { useI18n } from '../../hooks';
import styles from './AppDownloadPage.module.css';

/**
 * Placeholder page « Télécharger l’application » (stores / APK à brancher).
 */
export const AppDownloadPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <Smartphone className={styles.icon} size={48} strokeWidth={1.75} aria-hidden />
        <h1 className={styles.title}>{t('public.app_download.title')}</h1>
        <p className={styles.lead}>{t('public.app_download.lead')}</p>
        <p className={styles.note}>{t('public.app_download.note')}</p>
        <Link to="/" className={styles.back}>
          {t('public.app_download.back_home')}
        </Link>
      </div>
    </div>
  );
};

export default AppDownloadPage;
