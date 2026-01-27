/**
 * =====================================================
 * RETROUVONSLES - Locales Index Export
 * Barrel export for i18n configuration and utilities
 * =====================================================
 */

import i18n from './i18n.config';

// Supported languages
export const SUPPORTED_LANGUAGES = {
  EN: 'en',
  FR: 'fr',
} as const;

export type LanguageCode = typeof SUPPORTED_LANGUAGES[keyof typeof SUPPORTED_LANGUAGES];

/**
 * Get current language
 */
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language || 'en') as LanguageCode;
};

/**
 * Change application language
 */
export const changeLanguage = async (lng: LanguageCode): Promise<void> => {
  await i18n.changeLanguage(lng);
  localStorage.setItem('language', lng);
};

/**
 * Initialize i18n on app startup
 */
export const initializeI18n = async (): Promise<void> => {
  const savedLanguage = localStorage.getItem('language') as LanguageCode | null;
  if (savedLanguage && Object.values(SUPPORTED_LANGUAGES).includes(savedLanguage)) {
    await changeLanguage(savedLanguage);
  }
};

/**
 * Get language name in native language
 */
export const getLanguageName = (lng: LanguageCode): string => {
  const names: Record<LanguageCode, string> = {
    en: 'English',
    fr: 'Français',
  };
  return names[lng] || 'English';
};

/**
 * Get language flag emoji (deprecated - use icons instead)
 */
export const getLanguageFlag = (lng: LanguageCode): string => {
  const flags: Record<LanguageCode, string> = {
    en: 'GB',
    fr: 'FR',
  };
  return flags[lng] || 'GL';
};

/**
 * Namespace names for type safety
 */
export const NAMESPACES = {
  COMMON: 'common',
  AUTH: 'auth',
  NAVIGATION: 'navigation',
  FORMS: 'forms',
  DOSSIERS: 'dossiers',
  SIGNALEMENTS: 'signalements',
  ALERTES: 'alertes',
  USERS: 'users',
  SUCCESS: 'success',
  ERRORS: 'errors',
  VALIDATION: 'validation',
  AUTHORITY: 'authority',
} as const;

export type Namespace = typeof NAMESPACES[keyof typeof NAMESPACES];

/**
 * Language configuration interface
 */
export interface LanguageConfig {
  code: LanguageCode;
  name: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Get language configuration
 */
export const getLanguageConfig = (lng: LanguageCode): LanguageConfig => {
  const configs: Record<LanguageCode, LanguageConfig> = {
    en: {
      code: 'en',
      name: getLanguageName('en'),
      flag: getLanguageFlag('en'),
      direction: 'ltr',
    },
    fr: {
      code: 'fr',
      name: getLanguageName('fr'),
      flag: getLanguageFlag('fr'),
      direction: 'ltr',
    },
  };
  return configs[lng];
};

/**
 * Get all available languages
 */
export const getAvailableLanguages = (): LanguageConfig[] => {
  return Object.values(SUPPORTED_LANGUAGES).map(getLanguageConfig);
};

export default i18n;
