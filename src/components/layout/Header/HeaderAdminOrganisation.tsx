/**
 * =====================================================
 * RETROUVONSLES - Header Admin Component
 * En-tête personnalisé pour l'interface admin
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { User as UserType } from '../../../@types/auth.types';
import { useI18n } from '../../../hooks';

import styles from './HeaderAdminOrganisation.module.css';

export interface HeaderAdminOrganisationProps {
  currentUser?: UserType | null;
  onLogout?: () => void;
}

export const HeaderAdminOrganisation: React.FC<HeaderAdminOrganisationProps> = ({
  currentUser,
  onLogout,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        {/* Logo */}
        <div className={styles.header__logo}>
          <span className={styles.header__logoIcon}>🔍</span>
          <span className={`${styles.header__logoText} app-name-bold`}>RETROUVONSLES</span>
        </div>

        {/* Search */}
        <form className={styles.header__searchForm} onSubmit={handleSearch}>
          <Search className={styles.header__searchIcon} />
          <input
            type="text"
            className={styles.header__searchInput}
            placeholder={t('admin.searchDossiersPeople')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Actions */}
        <div className={styles.header__actions}>
          {/* Notifications */}
          <button className={styles.header__notificationBtn} title={t('admin.notifications')}>
            <Bell className={styles.header__notificationIcon} />
            <span className={styles.header__notificationBadge}>3</span>
          </button>

          {/* User Menu */}
          <div className={styles.header__userMenu}>
            <button
              className={styles.header__userBtn}
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={currentUser?.nom_complet}
            >
              <div className={styles.header__userAvatar}>
                {getInitials(currentUser?.nom_complet)}
              </div>
              <span className={styles.header__userName}>
                {currentUser?.nom_complet?.split(' ')[0] || 'Admin'}
              </span>
              <ChevronDown className={styles.header__menuArrow} />
            </button>

            {showUserMenu && (
              <div className={styles.header__dropdown}>
                <div className={styles.header__dropdownHeader}>
                  <div className={styles.header__userInfo}>
                    <p className={styles.header__userFullName}>
                      {currentUser?.nom_complet}
                    </p>
                    <p className={styles.header__userEmail}>{currentUser?.email}</p>
                  </div>
                </div>
                <div className={styles.header__divider} />
                <button
                  className={styles.header__dropdownItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/admin/profile');
                  }}
                >
                  <User className={styles.header__dropdownIcon} />
                  {t('admin.profile')}
                </button>
                <button
                  className={styles.header__dropdownItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/admin/parametres');
                  }}
                >
                  <Settings className={styles.header__dropdownIcon} />
                  {t('admin.settings')}
                </button>
                <div className={styles.header__divider} />
                <button
                  className={styles.header__dropdownItem}
                  onClick={handleLogout}
                >
                  <LogOut className={styles.header__dropdownIcon} />
                  {t('admin.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderAdminOrganisation;