/**
 * =====================================================
 * RETROUVONSLES - Language Provider
 * Fournisseur multilingue avec persistance
 * =====================================================
 */

import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { LanguageContext, LanguageContextType, SupportedLanguage, Translations } from './LanguageContext';

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
  storageKey?: string;
}

/**
 * Provider de langue
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'fr',
  storageKey = 'retrouvonsles-language',
}) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(defaultLanguage);
  const [translations, setTranslations] = useState<Record<SupportedLanguage, Translations>>({
    fr: {},
    en: {},
    ar: {},
    es: {},
  });

  const supportedLanguages: SupportedLanguage[] = ['fr', 'en', 'ar', 'es'];

  // Charger la langue depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem(storageKey);
      if (savedLanguage && supportedLanguages.includes(savedLanguage as SupportedLanguage)) {
        setCurrentLanguageState(savedLanguage as SupportedLanguage);
      } else {
        // Déterminer la langue du navigateur
        const browserLang = navigator.language.split('-')[0];
        if (supportedLanguages.includes(browserLang as SupportedLanguage)) {
          setCurrentLanguageState(browserLang as SupportedLanguage);
        }
      }
    }
  }, [storageKey]);

  // Changer la langue
  const setLanguage = useCallback((language: SupportedLanguage) => {
    if (supportedLanguages.includes(language)) {
      setCurrentLanguageState(language);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, language);
      }
      // Mettre à jour la langue du document
      if (typeof document !== 'undefined') {
        document.documentElement.lang = language;
      }
    }
  }, [storageKey]);

  // Fonction de traduction
  const t = useCallback((key: string, defaultValue: string = key): string => {
    const keys = key.split('.');
    let value: any = translations[currentLanguage];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  }, [currentLanguage, translations]);

  // Ajouter des traductions
  const addTranslations = useCallback((language: SupportedLanguage, newTranslations: Translations) => {
    setTranslations(prev => ({
      ...prev,
      [language]: {
        ...prev[language],
        ...newTranslations,
      },
    }));
  }, []);

  // Formater une date
  const formatDate = useCallback((date: Date | string, format: string = 'short'): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return '';
    }

    const options: Intl.DateTimeFormatOptions =
      format === 'short'
        ? { year: 'numeric', month: 'short', day: 'numeric' }
        : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };

    return dateObj.toLocaleDateString(currentLanguage, options);
  }, [currentLanguage]);

  // Formater une devise
  const formatCurrency = useCallback((amount: number, currency: string = 'XAF'): string => {
    return new Intl.NumberFormat(currentLanguage, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }, [currentLanguage]);

  // Formater un nombre
  const formatNumber = useCallback((num: number, decimals: number = 2): string => {
    return new Intl.NumberFormat(currentLanguage, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  }, [currentLanguage]);

  // Formater un numéro de téléphone
  const formatPhoneNumber = useCallback((phone: string): string => {
    // Format: +237 6XX XXX XXX pour Cameroun
    if (currentLanguage === 'fr' && phone.startsWith('237')) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  }, [currentLanguage]);

  const contextValue: LanguageContextType = {
    currentLanguage,
    supportedLanguages,
    setLanguage,
    t,
    addTranslations,
    formatDate,
    formatCurrency,
    formatNumber,
    formatPhoneNumber,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
