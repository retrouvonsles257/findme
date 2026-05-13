import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useI18n } from '../../hooks';
import { PUBLIC_ROUTES } from '../../routes/routes.config';
import { APP_LOGO_SRC } from '../../config/branding';
import styles from '../../pages/public/HomePage.module.css';

/**
 * Pied de page public partagé (styles HomePage.module.css — pas de duplication CSS).
 */
export const PublicFooter: React.FC = () => {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <div className={styles.footerLogo}>
            <img src={APP_LOGO_SRC} alt={t('common.appName')} className="app-brand-logo app-brand-logo--inverse" />
            <span className="app-name-bold">{t('common.app_name')}</span>
          </div>
          <p>{t('public.footer.description')}</p>
        </div>

        <div className={styles.footerSection}>
          <h4>{t('public.footer.navigation')}</h4>
          <ul>
            <li>
              <Link to={PUBLIC_ROUTES.HOME}>{t('public.navbar.home')}</Link>
            </li>
            <li>
              <Link to={PUBLIC_ROUTES.ABOUT}>{t('public.navbar.about')}</Link>
            </li>
            <li>
              <Link to={PUBLIC_ROUTES.HOW_IT_WORKS}>{t('public.how_it_works.title')}</Link>
            </li>
            <li>
              <Link to={PUBLIC_ROUTES.CONTACT}>{t('public.navbar.contact')}</Link>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h4>{t('public.footer.resources')}</h4>
          <ul>
            <li>
              <Link to={PUBLIC_ROUTES.DISPARITIONS}>{t('public.navbar.disparitions')}</Link>
            </li>
            <li>
              <Link to={PUBLIC_ROUTES.APP}>{t('public.navbar.app_download')}</Link>
            </li>
            <li>
              <Link to={PUBLIC_ROUTES.DONATE}>{t('public.donate.title')}</Link>
            </li>
          </ul>
        </div>

        <div className={styles.footerSection}>
          <h4>{t('public.footer.contact')}</h4>
          <p className={styles.contactItem}>
            <Mail size={16} />
            <span>{t('public.footer.email')}</span>
          </p>
          <p className={styles.contactItem}>
            <Phone size={16} />
            <span>{t('public.footer.phone')}</span>
          </p>
          <p className={styles.contactItem}>
            <MapPin size={16} />
            <span>{t('public.footer.address')}</span>
          </p>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>{t('public.footer.copyright').replace('{{year}}', String(currentYear))}</p>
        <div className={styles.footerLinks}>
          <Link to="/legal">{t('public.footer.legal')}</Link>
          <Link to="/privacy">{t('public.footer.privacy')}</Link>
          <Link to="/terms">{t('public.footer.terms')}</Link>
        </div>
      </div>
    </footer>
  );
};
