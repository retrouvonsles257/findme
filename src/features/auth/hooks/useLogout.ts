/**
 * =====================================================
 * useLogout Hook
 * Déconnexion via Redux (logoutThunk) pour garder auth + users en sync.
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useAppDispatch } from '../../../store/types';
import { logoutThunk } from '../store/authThunks';

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
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LogoutError | null>(null);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await dispatch(logoutThunk());
      if (logoutThunk.rejected.match(result)) {
        const payload = result.payload as { message?: string; code?: string } | undefined;
        const authError: LogoutError = {
          message: payload?.message || 'Erreur de déconnexion',
          code: payload?.code,
        };
        setError(authError);
        return { error: authError };
      }
      return { error: null };
    } catch (err) {
      const authError: LogoutError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue lors de la déconnexion',
      };
      setError(authError);
      return { error: authError };
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return {
    logout,
    isLoading,
    error,
  };
};
