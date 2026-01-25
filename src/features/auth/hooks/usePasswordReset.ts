/**
 * =====================================================
 * usePasswordReset Hook
 * Hook personnalisé pour la réinitialisation du mot de passe
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { resetPassword, updatePassword } from '../../../config/supabase.config';

export interface PasswordResetError {
  message: string;
  code?: string;
}

export interface UsePasswordResetReturn {
  requestPasswordReset: (email: string) => Promise<{
    error: PasswordResetError | null;
  }>;
  resetPasswordWithToken: (token: string, newPassword: string) => Promise<{
    error: PasswordResetError | null;
  }>;
  updateUserPassword: (newPassword: string) => Promise<{
    error: PasswordResetError | null;
  }>;
  isLoading: boolean;
  error: PasswordResetError | null;
}

export const usePasswordReset = (): UsePasswordResetReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<PasswordResetError | null>(null);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        const authError: PasswordResetError = {
          message: resetError.message || 'Erreur lors de la demande de réinitialisation',
          code: resetError.code
        };
        setError(authError);
        return { error: authError };
      }

      return { error: null };
    } catch (err) {
      const authError: PasswordResetError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(authError);
      return { error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPasswordWithToken = useCallback(async (_token: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Note: Ce flux dépend de l'implémentation spécifique de Supabase
      // Généralement, cela se fait via une page de callback avec le token
      // Nous utilisons updatePassword après vérification du token
      const { error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        const authError: PasswordResetError = {
          message: updateError.message || 'Erreur lors de la mise à jour du mot de passe',
          code: updateError.code
        };
        setError(authError);
        return { error: authError };
      }

      return { error: null };
    } catch (err) {
      const authError: PasswordResetError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue lors de la réinitialisation'
      };
      setError(authError);
      return { error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateUserPassword = useCallback(async (newPassword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        const authError: PasswordResetError = {
          message: updateError.message || 'Erreur lors de la mise à jour du mot de passe',
          code: updateError.code
        };
        setError(authError);
        return { error: authError };
      }

      return { error: null };
    } catch (err) {
      const authError: PasswordResetError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(authError);
      return { error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    requestPasswordReset,
    resetPasswordWithToken,
    updateUserPassword,
    isLoading,
    error
  };
};
