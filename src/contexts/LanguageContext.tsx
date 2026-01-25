/**
 * =====================================================
 * RETROUVONSLES - Language Context
 * Gestion multilingue et localisation
 * =====================================================
 */

import React, { createContext } from 'react';

/**
 * Langues supportées
 */
export type SupportedLanguage = 'fr' | 'en' | 'ar' | 'es';

/**
 * Interface pour les traductions
 */
export interface Translations {
  [key: string]: string | Translations;
}

/**
 * Interface pour l'état de langue
 */
export interface LanguageContextType {
  // État
  currentLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];

  // Actions
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, defaultValue?: string) => string;
  addTranslations: (language: SupportedLanguage, translations: Translations) => void;

  // Formatage
  formatDate: (date: Date | string, format?: string) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (num: number, decimals?: number) => string;
  formatPhoneNumber: (phone: string) => string;
}

/**
 * Crée le contexte de langue
 */
export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte de langue
 */
export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/**
 * Hook simplifié pour les traductions
 */
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};
