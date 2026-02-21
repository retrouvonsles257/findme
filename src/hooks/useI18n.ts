/**
 * =====================================================
 * useI18n Hook - Custom internationalization hook
 * Provides translation and language management
 * =====================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageCode, SUPPORTED_LANGUAGES, Namespace } from '../locales';

/** Options for t(): either a default value string or interpolation key-value map */
export type TOptions = string | Record<string, any>;

export interface UseI18nResult {
  /**
   * Translation function. Second arg: default value (string) or interpolation object (e.g. { count: 5, name: 'X' }).
   */
  t: (key: string, optionsOrDefault?: TOptions) => string;

  /**
   * Translation function for specific namespace
   */
  tNamespace: (namespace: Namespace, key: string, defaultValue?: string) => string;

  /**
   * Current language code
   */
  language: LanguageCode;

  /**
   * Change application language
   */
  changeLanguage: (lng: LanguageCode) => Promise<void>;

  /**
   * Get all available languages
   */
  availableLanguages: LanguageCode[];

  /**
   * Check if language is supported
   */
  isLanguageSupported: (lng: string) => boolean;

  /**
   * Ready state indicator
   */
  isReady: boolean;
}

/**
 * useI18n Hook
 * Provides internationalization functionality
 */
export const useI18n = (namespace?: Namespace): UseI18nResult => {
  const { t: tBase, i18n, ready } = useTranslation();
  const [language, setLanguage] = useState<LanguageCode>((i18n.language || 'en') as LanguageCode);

  /**
   * Check if language is supported
   */
  const isLanguageSupported = useCallback(
    (lng: string): lng is LanguageCode => {
      return Object.values(SUPPORTED_LANGUAGES).includes(lng as LanguageCode);
    },
    []
  );

  // Update language state when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (isLanguageSupported(lng)) {
        setLanguage(lng as LanguageCode);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n, isLanguageSupported]);

  /**
   * Translation function. Supports interpolation: t('key', { count: 5 }) and default value: t('key', 'Fallback').
   */
  const t = useCallback(
    (key: string, optionsOrDefault: TOptions = ''): string => {
      try {
        if (typeof optionsOrDefault === 'string') {
          const result = tBase(key);
          return result === key && optionsOrDefault ? optionsOrDefault : result;
        }
        return tBase(key, optionsOrDefault as Record<string, unknown>);
      } catch {
        return (typeof optionsOrDefault === 'string' ? optionsOrDefault : key) || key;
      }
    },
    [tBase]
  );

  /**
   * Translation function for specific namespace
   */
  const tNamespace = useCallback(
    (ns: Namespace, key: string, defaultValue: string = ''): string => {
      try {
        const result = tBase(`${ns}:${key}`);
        return result === `${ns}:${key}` && defaultValue ? defaultValue : result;
      } catch {
        return defaultValue || key;
      }
    },
    [tBase]
  );

  /**
   * Change language
   */
  const handleChangeLanguage = useCallback(
    async (lng: LanguageCode): Promise<void> => {
      if (isLanguageSupported(lng)) {
        await i18n.changeLanguage(lng);
        localStorage.setItem('language', lng);
        setLanguage(lng);
      }
    },
    [i18n, isLanguageSupported]
  );

  return {
    t,
    tNamespace,
    language,
    changeLanguage: handleChangeLanguage,
    availableLanguages: Object.values(SUPPORTED_LANGUAGES),
    isLanguageSupported,
    isReady: ready,
  };
};

export default useI18n;
