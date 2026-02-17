/**
 * RETROUVONSLES - NGO Header
 * Aligné sur Authority : menu toggle, recherche, actions, langue, avatar clic → navigation profil (pas de dropdown)
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, Plus, Globe, CheckCircle } from 'lucide-react';
import { useI18n } from '../../../hooks';
import { useAppSelector } from '../../../store/types';
import { selectCurrentUser } from '../../../features/users/store/userSelectors';
import { getLanguageName } from '../../../locales';
import { supabase } from '../../../config';
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
  const location = useLocation();
  const currentUser = useAppSelector(selectCurrentUser);
  const { t, language, changeLanguage, availableLanguages } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [photoProfil, setPhotoProfil] = useState<string | null>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const loadPhotoProfil = useCallback(async (uid: string) => {
    try {
      const { data } = await (supabase as any)
        .from('utilisateur')
        .select('photo_profil')
        .eq('id', uid)
        .maybeSingle();
      setPhotoProfil(data?.photo_profil || null);
    } catch {
      setPhotoProfil(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id) loadPhotoProfil(currentUser.id);
    else setPhotoProfil(null);
  }, [currentUser?.id, loadPhotoProfil, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

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

        <button
          type="button"
          className={styles.headerAvatarBtn}
          onClick={() => navigate('/ngo/profile')}
          title={t('authority.sidebar.editProfile') || t('common.profile')}
        >
          <div className={styles.headerAvatarPlaceholder}>
            {photoProfil ? (
              <img src={photoProfil} alt="" className={styles.headerAvatarImg} />
            ) : (
              getInitials()
            )}
          </div>
        </button>
      </div>
    </header>
  );
};
