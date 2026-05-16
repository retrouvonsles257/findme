import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Info,
  Mail,
  Menu,
  X,
  Users,
  Smartphone,
  LogIn,
  Languages,
  UserPlus,
} from 'lucide-react';
import { useI18n } from '../../hooks';
import { CITIZEN_ROUTES, PUBLIC_ROUTES } from '../../routes/routes.config';
import homeStyles from '../../pages/public/HomePage.module.css';
import shellStyles from './PublicNavbar.module.css';
import { APP_LOGO_SRC } from '../../config/branding';

const NAV_ICON = 18;
const navIconProps = { size: NAV_ICON, strokeWidth: 2.25 } as const;

export type PublicNavbarVariant = 'home' | 'default';

export interface PublicNavbarProps {
  variant: PublicNavbarVariant;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ variant }) => {
  const { t, language, changeLanguage } = useI18n();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const scrollRaf = useRef<number>(0);

  useEffect(() => {
    if (variant !== 'home') return undefined;
    const onScroll = () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      scrollRaf.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        scrollRaf.current = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      window.removeEventListener('scroll', onScroll);
    };
  }, [variant]);

  const toggleLanguage = () => {
    changeLanguage(language === 'fr' ? 'en' : 'fr');
  };

  const navSolid = Math.min(1, Math.max(0, (scrollY - 10) / 100));
  const navTinted = scrollY > 18 || navSolid > 0.22;
  const navCompact = scrollY > 140;

  const navFillAlpha = navSolid * 0.97;
  const navBarStyle: React.CSSProperties =
    variant === 'home'
      ? {
          backgroundColor: `rgba(255, 255, 255, ${navFillAlpha})`,
          backdropFilter: navSolid > 0.06 ? `saturate(1.15) blur(${6 + navSolid * 10}px)` : 'none',
          WebkitBackdropFilter: navSolid > 0.06 ? `saturate(1.15) blur(${6 + navSolid * 10}px)` : undefined,
          boxShadow:
            navSolid > 0.2 ? `0 8px 32px rgba(15, 23, 42, ${0.06 + navSolid * 0.07})` : undefined,
        }
      : {};

  if (variant === 'home') {
    return (
      <header className={homeStyles.navSection} style={navBarStyle}>
        <nav
          className={`${homeStyles.navbar} ${navTinted ? homeStyles.navbarTinted : ''} ${navCompact ? homeStyles.navbarCompact : ''}`}
        >
          <div className={homeStyles.navContainer}>
            <Link to={PUBLIC_ROUTES.HOME} className={homeStyles.logo} onClick={() => setMobileMenuOpen(false)}>
              <img
                src={APP_LOGO_SRC}
                alt={t('common.appName')}
                className="app-brand-logo app-brand-logo--inverse"
              />
              <span className={homeStyles.logoText}>{t('common.app_name')}</span>
            </Link>

            <div
              className={`${homeStyles.navLinks} ${mobileMenuOpen ? homeStyles.navLinksOpen : ''}`}
              aria-hidden={!mobileMenuOpen}
            >
              <Link to={PUBLIC_ROUTES.HOME} className={homeStyles.navLink} onClick={() => setMobileMenuOpen(false)}>
                <Home {...navIconProps} />
                {t('public.navbar.home')}
              </Link>
              <Link to={PUBLIC_ROUTES.DISPARITIONS} className={homeStyles.navLink} onClick={() => setMobileMenuOpen(false)}>
                <Users {...navIconProps} />
                {t('public.navbar.disparitions')}
              </Link>
              <Link
                to={`${PUBLIC_ROUTES.CONTRIBUTE}?next=${encodeURIComponent(CITIZEN_ROUTES.NEW_SIGNALEMENT)}`}
                className={`${homeStyles.navLink} ${homeStyles.navLinkHighlight}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <UserPlus {...navIconProps} />
                {t('public.contribute.navbar_link')}
              </Link>
              <Link to={PUBLIC_ROUTES.APP} className={homeStyles.navLink} onClick={() => setMobileMenuOpen(false)}>
                <Smartphone {...navIconProps} />
                {t('public.navbar.app_download')}
              </Link>
              <Link to={PUBLIC_ROUTES.ABOUT} className={homeStyles.navLink} onClick={() => setMobileMenuOpen(false)}>
                <Info {...navIconProps} />
                {t('public.navbar.about')}
              </Link>
              <Link to={PUBLIC_ROUTES.CONTACT} className={homeStyles.navLink} onClick={() => setMobileMenuOpen(false)}>
                <Mail {...navIconProps} />
                {t('public.navbar.contact')}
              </Link>
            </div>

            <div className={homeStyles.navActions}>
              <button type="button" className={homeStyles.langBtn} onClick={toggleLanguage}>
                <span className={homeStyles.navBtnInner}>
                  <Languages size={16} strokeWidth={2.25} aria-hidden />
                  {language === 'fr' ? 'EN' : 'FR'}
                </span>
              </button>
              <button type="button" className={homeStyles.loginBtn} onClick={() => navigate('/auth/login')}>
                <span className={homeStyles.navBtnInner}>
                  <LogIn size={16} strokeWidth={2.25} aria-hidden />
                  {t('public.navbar.login')}
                </span>
              </button>
              <button
                type="button"
                className={homeStyles.mobileMenuBtn}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${shellStyles.navLink} ${isActive ? shellStyles.navLinkActive : ''}`;

  return (
    <nav className={shellStyles.navbarDefault}>
      <div className={shellStyles.navContainer}>
        <Link to={PUBLIC_ROUTES.HOME} className={shellStyles.logo} onClick={() => setMobileMenuOpen(false)}>
          <img src={APP_LOGO_SRC} alt={t('common.appName')} className="app-brand-logo" />
          <span className={shellStyles.logoText}>{t('common.app_name')}</span>
        </Link>

        <div
          className={`${shellStyles.navLinks} ${mobileMenuOpen ? shellStyles.navLinksOpen : ''}`}
          aria-hidden={!mobileMenuOpen}
        >
          <NavLink to={PUBLIC_ROUTES.HOME} end className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            <Home {...navIconProps} />
            {t('public.navbar.home')}
          </NavLink>
          <NavLink to={PUBLIC_ROUTES.DISPARITIONS} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            <Users {...navIconProps} />
            {t('public.navbar.disparitions')}
          </NavLink>
          <Link
            to={`${PUBLIC_ROUTES.CONTRIBUTE}?next=${encodeURIComponent(CITIZEN_ROUTES.NEW_SIGNALEMENT)}`}
            className={`${shellStyles.navLink} ${shellStyles.navLinkHighlight}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <UserPlus {...navIconProps} />
            {t('public.contribute.navbar_link')}
          </Link>
          <NavLink to={PUBLIC_ROUTES.APP} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            <Smartphone {...navIconProps} />
            {t('public.navbar.app_download')}
          </NavLink>
          <NavLink to={PUBLIC_ROUTES.ABOUT} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            <Info {...navIconProps} />
            {t('public.navbar.about')}
          </NavLink>
          <NavLink to={PUBLIC_ROUTES.CONTACT} className={linkClass} onClick={() => setMobileMenuOpen(false)}>
            <Mail {...navIconProps} />
            {t('public.navbar.contact')}
          </NavLink>
        </div>

        <div className={shellStyles.navActions}>
          <button type="button" className={shellStyles.langBtn} onClick={toggleLanguage}>
            <span className={shellStyles.navBtnInner}>
              <Languages size={16} strokeWidth={2.25} aria-hidden />
              {language === 'fr' ? 'EN' : 'FR'}
            </span>
          </button>
          <button type="button" className={shellStyles.loginBtn} onClick={() => navigate('/auth/login')}>
            <span className={shellStyles.navBtnInner}>
              <LogIn size={16} strokeWidth={2.25} aria-hidden />
              {t('public.navbar.login')}
            </span>
          </button>
          <button
            type="button"
            className={shellStyles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
};
