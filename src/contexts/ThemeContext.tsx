/**
 * =====================================================
 * RETROUVONSLES - Theme Context
 * Gestion centralisée du thème (light/dark/system)
 * =====================================================
 */

import React, { createContext } from 'react';

/**
 * Type de thème supporté
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Interface pour la configuration du thème
 */
export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  fontSize?: {
    small?: number;
    base?: number;
    large?: number;
  };
}

/**
 * Interface pour l'état du thème
 */
export interface ThemeContextType {
  // État
  mode: ThemeMode;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  config: ThemeConfig;

  // Actions
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setConfig: (config: Partial<ThemeConfig>) => void;
  resetConfig: () => void;
}

/**
 * Crée le contexte du thème
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte du thème
 */
export const useTheme = (): ThemeContextType => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
