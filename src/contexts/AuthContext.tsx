/**
 * =====================================================
 * RETROUVONSLES - Authentication Context
 * Gestion centralisée de l'authentification
 * =====================================================
 */

import React, { createContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { NomRole, StatutCompte } from '../@types/enums.types';

/**
 * Interface pour l'état d'authentification
 */
export interface AuthContextType {
  // État
  user: User | null;
  session: Session | null;
  userRole: NomRole | null;
  userStatus: StatutCompte | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;

  // Rôles
  isAdmin: boolean;
  isModerator: boolean;
  isOrganisationAdmin: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<{ user: User | null; error: Error | null }>;
  signInWithGoogle: () => Promise<any>;
  signInWithFacebook: () => Promise<any>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ user: User | null; error: Error | null }>;
  updateProfile: (metadata: Record<string, any>) => Promise<{ user: User | null; error: Error | null }>;
  refreshSession: () => Promise<{ session: Session | null; error: Error | null }>;
}

/**
 * Crée le contexte d'authentification
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 */
export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
