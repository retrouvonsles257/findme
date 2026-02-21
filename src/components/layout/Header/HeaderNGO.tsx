/**
 * =====================================================
 * RETROUVONSLES - Header NGO Component
 * En-tête personnalisé pour l'interface ONG
 * =====================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../../../@types/auth.types';
import { useI18n } from '../../../hooks';

import styles from './HeaderAdminOrganisation.module.css';

export interface HeaderNGOProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

export const HeaderNGO: React.FC<HeaderNGOProps> = ({
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
      navigate(`/ngo/search?q=${encodeURIComponent(searchQuery)}`);
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
          <span className={styles.logoIcon}>🤝</span>
          <span className={`${styles.logoText} app-name-bold`}>RETROUVONSLES - ONG</span>
        </div>

        {/* Barre de recherche */}
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder={t('ngo.searchCases')}
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
            <span className={styles.notificationBadge}>3</span>
          </button>

          {/* Utilisateur */}
          <div className={styles.userMenu}>
            <button
              className={styles.userBtn}
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={currentUser?.nom_complet || t('common.user')}
            >
              <span className={styles.userAvatar}>
                {getInitials(currentUser?.nom_complet)}
              </span>
              <span className={styles.userName}>{currentUser?.nom_complet}</span>
            </button>

            {showUserMenu && (
              <div className={styles.userDropdown}>
                <div className={styles.userInfo}>
                  <p className={styles.userInfoName}>{currentUser?.nom_complet}</p>
                  <p className={styles.userInfoEmail}>{currentUser?.email}</p>
                </div>
                <hr className={styles.divider} />
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                >
                  👤 {t('common.profile')}
                </button>
                <button
                  className={styles.menuItem}
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                >
                  ⚙️ {t('common.settings')}
                </button>
                <hr className={styles.divider} />
                <button className={styles.menuItem} onClick={handleLogout}>
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
