/**
 * =====================================================
 * LanguageSwitcher Component
 * Language selection and switching interface
 * =====================================================
 */

import React, { useCallback } from 'react';
import { useI18n } from '../../hooks';
import { getLanguageConfig } from '../../locales';
import './LanguageSwitcher.css';

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'buttons' | 'inline';
  showFlag?: boolean;
  showName?: boolean;
  className?: string;
  onLanguageChange?: (lng: string) => void;
}

/**
 * LanguageSwitcher Component
 * Allows users to switch between supported languages
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  showFlag = true,
  showName = true,
  className = '',
  onLanguageChange,
}) => {
  const { language, changeLanguage, availableLanguages } = useI18n();

  const handleLanguageChange = useCallback(
    async (lng: string) => {
      await changeLanguage(lng as any);
      onLanguageChange?.(lng);
    },
    [changeLanguage, onLanguageChange]
  );

  const renderLanguageLabel = (lng: string) => {
    const config = getLanguageConfig(lng as any);
    const parts = [];

    if (showFlag) {
      parts.push(config.flag);
    }
    if (showName) {
      parts.push(config.name);
    }

    return parts.join(' ');
  };

  if (variant === 'dropdown') {
    return (
      <div className={`language-switcher language-switcher--dropdown ${className}`}>
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="language-switcher__select"
          aria-label="Select language"
        >
          {availableLanguages.map((lng) => (
            <option key={lng} value={lng}>
              {renderLanguageLabel(lng)}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (variant === 'buttons') {
    return (
      <div className={`language-switcher language-switcher--buttons ${className}`}>
        {availableLanguages.map((lng) => (
          <button
            key={lng}
            onClick={() => handleLanguageChange(lng)}
            className={`language-switcher__button ${language === lng ? 'language-switcher__button--active' : ''}`}
            aria-pressed={language === lng}
            aria-label={`Select ${getLanguageConfig(lng as any).name}`}
          >
            {renderLanguageLabel(lng)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`language-switcher language-switcher--inline ${className}`}>
      {availableLanguages.map((lng, index) => (
        <React.Fragment key={lng}>
          <button
            onClick={() => handleLanguageChange(lng)}
            className={`language-switcher__link ${language === lng ? 'language-switcher__link--active' : ''}`}
            aria-pressed={language === lng}
            aria-label={`Select ${getLanguageConfig(lng as any).name}`}
          >
            {renderLanguageLabel(lng)}
          </button>
          {index < availableLanguages.length - 1 && (
            <span className="language-switcher__separator">|</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
