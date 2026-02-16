/**
 * RETROUVONSLES - NGO Header
 * Aligné sur Authority : menu toggle, recherche, actions, langue, avatar + dropdown (Profil, Déconnexion)
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Plus, Globe, CheckCircle, User, LogOut, Edit, Settings, KeyRound } from 'lucide-react';
import { useI18n } from '../../../hooks';
import { useAppDispatch, useAppSelector } from '../../../store/types';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { logoutThunk } from '../../../features/auth/store/authThunks';
import { AUTH_ROUTES } from '../../../routes/routes.config';
import { getLanguageName } from '../../../locales';
import styles from './NGOHeader.module.css';

export interface NGOHeaderProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const NGOHeader: React.FC<NGOHeaderProps> = ({
  onToggleSidebar,
  sidebarOpen,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showLanguageMenu || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu, showProfileMenu]);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await dispatch(logoutThunk());
    navigate(AUTH_ROUTES.LOGIN);
  };

  const goToProfile = () => {
    setShowProfileMenu(false);
    navigate('/ngo/profile');
  };

  const goToSettings = () => {
    setShowProfileMenu(false);
    navigate('/ngo/settings');
  };

  const goToSecurity = () => {
    setShowProfileMenu(false);
    navigate('/ngo/security');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/ngo/cases?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/ngo/cases');
    }
  };

  const getInitials = () => {
    const u = currentUser as { nom_complet?: string; email?: string } | null;
    if (u?.nom_complet) {
      const parts = u.nom_complet.trim().split(/\s+/).filter(Boolean);
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    }
    if (u?.email) return (u.email as string).slice(0, 2).toUpperCase();
    return 'U';
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        {!sidebarOpen && (
          <button
            type="button"
            className={styles.menuToggle}
            onClick={onToggleSidebar}
            aria-label={t('common.menu')}
          >
            <Menu size={22} />
          </button>
        )}
      </div>

      <form className={styles.searchForm} onSubmit={handleSearch}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder={t('ngo.searchCases')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </form>

      <div className={styles.rightSection}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => navigate('/ngo/cases/create')}
          title={t('ngo.createCase')}
        >
          <Plus size={20} />
          <span>{t('ngo.createCase')}</span>
        </button>

        <div className={styles.languageWrapper} ref={languageMenuRef}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            title={t('common.language')}
          >
            <Globe size={20} />
            <span className={styles.languageCode}>{language.toUpperCase()}</span>
          </button>
          {showLanguageMenu && (
            <div className={styles.languageDropdown}>
              {availableLanguages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`${styles.languageItem} ${language === lang ? styles.active : ''}`}
                  onClick={async () => {
                    await changeLanguage(lang);
                    setShowLanguageMenu(false);
                  }}
                >
                  <Globe size={16} />
                  <span>{getLanguageName(lang)}</span>
                  {language === lang && <CheckCircle size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.profileWrapper} ref={profileMenuRef}>
          <button
            type="button"
            className={styles.headerAvatarBtn}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            title={t('common.profile')}
            aria-expanded={showProfileMenu}
            aria-haspopup="true"
          >
            <div className={styles.headerAvatarPlaceholder}>
              {getInitials()}
            </div>
          </button>

          {showProfileMenu && (
            <div className={styles.profileDropdown}>
              <div className={styles.profileMenuHeader}>
                <div className={styles.menuAvatar}>
                  {getInitials()}
                </div>
                <div className={styles.menuUserInfo}>
                  <span className={styles.menuUserName}>
                    {(currentUser as any)?.nom_complet || (currentUser as any)?.email || 'Utilisateur'}
                  </span>
                  <span className={styles.menuUserEmail}>{currentUser?.email || ''}</span>
                </div>
              </div>
              <div className={styles.menuDivider} />
              <button type="button" className={styles.menuItem} onClick={goToProfile}>
                <Edit size={16} />
                <span>{t('authority.sidebar.editProfile')}</span>
              </button>
              <button type="button" className={styles.menuItem} onClick={goToSettings}>
                <Settings size={16} />
                <span>{t('authority.sidebar.settings')}</span>
              </button>
              <button type="button" className={styles.menuItem} onClick={goToSecurity}>
                <KeyRound size={16} />
                <span>{t('authority.sidebar.security')}</span>
              </button>
              <div className={styles.menuDivider} />
              <button type="button" className={`${styles.menuItem} ${styles.logoutItem}`} onClick={handleLogout}>
                <LogOut size={16} />
                <span>{t('authority.sidebar.logout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
