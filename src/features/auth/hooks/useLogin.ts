/**
 * =====================================================
 * useLogin Hook
 * Hook personnalisé pour la connexion
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { signInWithPassword } from '../../../config/supabase.config';

export interface LoginError {
  message: string;
  code?: string;
}

export interface UseLoginReturn {
  login: (email: string, password: string) => Promise<{
    user: User | null;
    error: LoginError | null;
  }>;
  isLoading: boolean;
  error: LoginError | null;
}

export const useLogin = (): UseLoginReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await signInWithPassword(email, password);

      if (loginError) {
        const authError: LoginError = {
          message: loginError.message || 'Erreur de connexion',
          code: loginError.code
        };
        setError(authError);
        return { user: null, error: authError };
      }

      const user = data?.user || null;
      return { user, error: null };
    } catch (err) {
      const authError: LoginError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue lors de la connexion'
      };
      setError(authError);
      return { user: null, error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    login,
    isLoading,
    error
  };
};
