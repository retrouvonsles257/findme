/**
 * =====================================================
 * RETROUVONSLES - useMediaQuery Hook
 * Detects media query matches for responsive design
 * =====================================================
 */

import { useState, useEffect } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      // Legacy API
      mediaQuery.addListener(handleChange);
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }
  }, [query]);

  return matches;
};

export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 768px)');
};

export const useIsTablet = (): boolean => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
};

export const useIsDesktop = (): boolean => {
  return useMediaQuery('(min-width: 1025px)');
};

export const useIsDarkMode = (): boolean => {
  return useMediaQuery('(prefers-color-scheme: dark)');
};
