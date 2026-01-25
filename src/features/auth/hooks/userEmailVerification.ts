/**
 * =====================================================
 * useEmailVerification Hook
 * Hook personnalisé pour la vérification d'email
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../config/supabase.config';

export interface EmailVerificationError {
  message: string;
  code?: string;
}

export interface UseEmailVerificationReturn {
  verifyEmail: (token: string) => Promise<{
    success: boolean;
    error: EmailVerificationError | null;
  }>;
  resendVerificationEmail: (email: string) => Promise<{
    error: EmailVerificationError | null;
  }>;
  checkEmailVerification: () => Promise<{
    isVerified: boolean;
    error: EmailVerificationError | null;
  }>;
  isLoading: boolean;
  error: EmailVerificationError | null;
}

export const useEmailVerification = (): UseEmailVerificationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<EmailVerificationError | null>(null);

  const verifyEmail = useCallback(async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Note: La vérification se fait généralement via le lien email avec token
      // Supabase gère automatiquement la vérification lors du clic sur le lien
      // Cette fonction est fournie pour les cas où le token est nécessaire

      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (verifyError) {
        const authError: EmailVerificationError = {
          message: verifyError.message || 'Erreur lors de la vérification',
          code: verifyError.code
        };
        setError(authError);
        return { success: false, error: authError };
      }

      return { success: true, error: null };
    } catch (err) {
      const authError: EmailVerificationError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue lors de la vérification'
      };
      setError(authError);
      return { success: false, error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email
      });

      if (resendError) {
        const authError: EmailVerificationError = {
          message: resendError.message || 'Erreur lors de l\'envoi',
          code: resendError.code
        };
        setError(authError);
        return { error: authError };
      }

      return { error: null };
    } catch (err) {
      const authError: EmailVerificationError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(authError);
      return { error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkEmailVerification = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();

      if (getUserError) {
        const authError: EmailVerificationError = {
          message: getUserError.message || 'Erreur lors de la vérification',
          code: getUserError.code
        };
        setError(authError);
        return { isVerified: false, error: authError };
      }

      const isVerified = user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
      return { isVerified, error: null };
    } catch (err) {
      const authError: EmailVerificationError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue'
      };
      setError(authError);
      return { isVerified: false, error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    verifyEmail,
    resendVerificationEmail,
    checkEmailVerification,
    isLoading,
    error
  };
};
