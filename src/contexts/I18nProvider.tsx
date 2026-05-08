/**
 * =====================================================
 * i18nProvider - i18n Context Provider
 * Wraps the application with i18n support
 * =====================================================
 */

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../locales/i18n.config';

export interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * i18nProvider Component
 * Provides i18n instance to React component tree
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize i18n on mount
    const savedLanguage = localStorage.getItem('language') || 'en';
    if (i18n.language !== savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    }

    // Set document language attribute
    document.documentElement.lang = i18n.language;
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
};

export default I18nProvider;
