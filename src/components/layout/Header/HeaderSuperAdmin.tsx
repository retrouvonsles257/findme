/**
 * =====================================================
 * RETROUVONSLES - Header Super Admin Component
 * En-tête personnalisé pour l'interface super admin
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../@types/auth.types';
import { useI18n } from '../../../hooks';

import styles from './HeaderAdminOrganisation.module.css';

export interface HeaderSuperAdminProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export const HeaderSuperAdmin: React.FC<HeaderSuperAdminProps> = ({
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
      navigate(`/super-admin/search?q=${encodeURIComponent(searchQuery)}`);
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
      <div className={styles.container}>
        {/* Logo et titre */}
        <div className={styles.logo}>
          <span className={styles.logoIcon}>👑</span>
          <span className={`${styles.logoText} app-name-bold`}>{`${t('common.app_name')} - SUPER ADMIN`}</span>
        </div>

        {/* Barre de recherche */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('super_admin.searchSystem')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>
            🔍
          </button>
        </form>

        {/* Menu utilisateur */}
        <div className={styles.actions}>
          {/* Notifications */}
          <button className={styles.notificationBtn} title={t('common.notifications')}>
            🔔
            <span className={styles.notificationBadge}>5</span>
          </button>

          {/* Menu utilisateur */}
          <div className={styles.userMenu}>
            <button
              className={styles.userBtn}
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={currentUser?.nom_complet}
            >
              <div className={styles.userAvatar}>
                {getInitials(currentUser?.nom_complet)}
              </div>
              <span className={styles.userName}>
                {currentUser?.nom_complet?.split(' ')[0] || 'SuperAdmin'}
              </span>
              <span className={styles.menuArrow}>▼</span>
            </button>

            {showUserMenu && (
              <div className={styles.userMenuDropdown}>
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/super-admin/profile');
                  }}
                >
                  👤 {t('common.profile')}
                </button>
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/super-admin/settings');
                  }}
                >
                  ⚙️ {t('common.settings')}
                </button>
                <hr className={styles.divider} />
                <button
                  className={styles.menuItem}
                  onClick={handleLogout}
                >
                  🚪 {t('common.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
