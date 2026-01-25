/**
 * =====================================================
 * useLogout Hook
 * Hook personnalisé pour la déconnexion
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { signOut } from '../../../config/supabase.config';

export interface LogoutError {
  message: string;
  code?: string;
}

export interface UseLogoutReturn {
  logout: () => Promise<{ error: LogoutError | null }>;
  isLoading: boolean;
  error: LogoutError | null;
}

export const useLogout = (): UseLogoutReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LogoutError | null>(null);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: logoutError } = await signOut();

      if (logoutError) {
        const authError: LogoutError = {
          message: logoutError.message || 'Erreur de déconnexion',
          code: logoutError.code
        };
        setError(authError);
        return { error: authError };
      }

      return { error: null };
    } catch (err) {
      const authError: LogoutError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue lors de la déconnexion'
      };
      setError(authError);
      return { error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    logout,
    isLoading,
    error
  };
};
