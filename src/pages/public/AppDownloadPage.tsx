import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, MapPin, Smartphone, Shield } from 'lucide-react';
import { useI18n } from '../../hooks';
import { PUBLIC_ROUTES } from '../../routes/routes.config';
import styles from './AppDownloadPage.module.css';

const FEATURE_ICONS = [Bell, MapPin, Shield] as const;

export const AppDownloadPage: React.FC = () => {
  const { t } = useI18n();
  const featuresRaw = t('public.app_download.features', { returnObjects: true });
  const features = Array.isArray(featuresRaw) ? (featuresRaw as string[]) : [];

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.hero}>
          <div className={styles.heroIconWrap} aria-hidden>
            <Smartphone className={styles.heroIcon} size={40} strokeWidth={1.75} />
          </div>
          <h1 className={styles.title}>{t('public.app_download.title')}</h1>
          <p className={styles.lead}>{t('public.app_download.lead')}</p>
        </div>

        <div className={styles.card}>
          <span className={styles.statusBadge}>{t('public.app_download.coming_soon')}</span>
          <p className={styles.note}>{t('public.app_download.note')}</p>

          <ul className={styles.featureList}>
            {(Array.isArray(features) ? features : []).map((text, i) => {
              const Icon = FEATURE_ICONS[i] ?? Bell;
              return (
                <li key={text} className={styles.featureItem}>
                  <span className={styles.featureIcon} aria-hidden>
                    <Icon size={18} strokeWidth={2.25} />
                  </span>
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>

          <div className={styles.storeRow} aria-label={t('public.app_download.stores_aria')}>
            <span className={styles.storePlaceholder}>App Store</span>
            <span className={styles.storePlaceholder}>Google Play</span>
          </div>

          <p className={styles.webHint}>{t('public.app_download.web_hint')}</p>

          <div className={styles.actions}>
            <Link to={PUBLIC_ROUTES.DISPARITIONS} className={styles.primaryBtn}>
              {t('public.app_download.cta_disparitions')}
            </Link>
            <Link to={PUBLIC_ROUTES.HOME} className={styles.secondaryBtn}>
              {t('public.app_download.back_home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDownloadPage;
