/**
 * =====================================================
 * RETROUVONSLES - Theme Provider
 * Fournisseur de thème avec persistance
 * =====================================================
 */

import React, { ReactNode, useState, useCallback, useEffect } from 'react';
import { ThemeContext, ThemeContextType, ThemeMode, ThemeConfig } from './ThemeContext';

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
  storageKey?: string;
  defaultConfig?: ThemeConfig;
}

/**
 * Provider de thème
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'system',
  storageKey = 'retrouvonsles-theme',
  defaultConfig = {},
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [config, setConfigState] = useState<ThemeConfig>(defaultConfig);
  const [isDark, setIsDark] = useState(false);

  // Déterminer si le mode système est dark
  const getSystemIsDark = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  // Initialiser le thème
  useEffect(() => {
    // Charger le mode depuis localStorage
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(storageKey);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setModeState(savedMode as ThemeMode);
      }
    }
  }, [storageKey]);

  // Écouter les changements du préférences système
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (mode === 'system') {
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };

    // Support ancien navigateurs
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
    return undefined;
  }, [mode]);

  // Mettre à jour le mode
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newMode);
    }

    // Déterminer l'état dark
    let shouldBeDark = false;
    if (newMode === 'dark') {
      shouldBeDark = true;
    } else if (newMode === 'system') {
      shouldBeDark = getSystemIsDark();
    }

    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, [storageKey, getSystemIsDark]);

  // Basculer le mode
  const toggleMode = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  // Appliquer le thème
  const applyTheme = useCallback((dark: boolean) => {
    if (typeof document === 'undefined') return;

    const htmlElement = document.documentElement;
    if (dark) {
      htmlElement.classList.add('dark');
      htmlElement.classList.remove('light');
    } else {
      htmlElement.classList.add('light');
      htmlElement.classList.remove('dark');
    }

    // Mettre à jour la variable CSS
    htmlElement.style.colorScheme = dark ? 'dark' : 'light';
  }, []);

  // Mettre à jour la configuration
  const setConfig = useCallback((newConfig: Partial<ThemeConfig>) => {
    setConfigState(prev => ({
      ...prev,
      ...newConfig,
    }));

    // Appliquer les styles CSS
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (newConfig.primaryColor) {
        root.style.setProperty('--color-primary', newConfig.primaryColor);
      }
      if (newConfig.secondaryColor) {
        root.style.setProperty('--color-secondary', newConfig.secondaryColor);
      }
      if (newConfig.accentColor) {
        root.style.setProperty('--color-accent', newConfig.accentColor);
      }
      if (newConfig.fontFamily) {
        root.style.setProperty('--font-family', newConfig.fontFamily);
      }
    }
  }, []);

  // Réinitialiser la configuration
  const resetConfig = useCallback(() => {
    setConfigState(defaultConfig);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.removeProperty('--color-primary');
      root.style.removeProperty('--color-secondary');
      root.style.removeProperty('--color-accent');
      root.style.removeProperty('--font-family');
    }
  }, [defaultConfig]);

  // Initialiser le thème au montage
  useEffect(() => {
    const shouldBeDark = mode === 'dark' || (mode === 'system' && getSystemIsDark());
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, [mode, getSystemIsDark, applyTheme]);

  const contextValue: ThemeContextType = {
    mode,
    isDark,
    isLight: !isDark,
    isSystem: mode === 'system',
    config,
    setMode,
    toggleMode,
    setConfig,
    resetConfig,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
