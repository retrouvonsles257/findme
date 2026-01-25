/**
 * =====================================================
 * useRegister Hook
 * Hook personnalisé pour l'inscription
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { signUpWithPassword } from '../../../config/supabase.config';
import { TypeCompte } from '../../../@types/enums.types';

export interface RegisterData {
  email: string;
  password: string;
  nom_complet: string;
  telephone?: string;
  type_compte: TypeCompte;
  organisation_id?: string;
}

export interface RegisterError {
  message: string;
  code?: string;
}

export interface UseRegisterReturn {
  register: (data: RegisterData) => Promise<{
    user: User | null;
    error: RegisterError | null;
  }>;
  isLoading: boolean;
  error: RegisterError | null;
}

export const useRegister = (): UseRegisterReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<RegisterError | null>(null);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const metadata = {
        nom_complet: data.nom_complet,
        telephone: data.telephone,
        type_compte: data.type_compte,
        organisation_id: data.organisation_id
      };

      const { data: signupData, error: registerError } = await signUpWithPassword(
        data.email,
        data.password,
        metadata
      );

      if (registerError) {
        const authError: RegisterError = {
          message: registerError.message || 'Erreur lors de l\'inscription',
          code: registerError.code
        };
        setError(authError);
        return { user: null, error: authError };
      }

      const user = signupData?.user || null;
      return { user, error: null };
    } catch (err) {
      const authError: RegisterError = {
        message: err instanceof Error ? err.message : 'Erreur inconnue lors de l\'inscription'
      };
      setError(authError);
      return { user: null, error: authError };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    register,
    isLoading,
    error
  };
};
