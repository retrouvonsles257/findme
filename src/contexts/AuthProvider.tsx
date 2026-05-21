/**
 * =====================================================
 * RETROUVONSLES - Authentication Provider
 * Fournisseur centralisé d'authentification
 * =====================================================
 */

import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  authEventManager,
  getCurrentUser,
  getCurrentSession,
  signInWithPassword,
  signUpWithPassword,
  signInWithGoogle,
  signInWithFacebook,
  signOut,
  resetPassword,
  updatePassword,
  updateUserMetadata,
  refreshSession,
} from '../config/supabase.config';
import { AuthContext, AuthContextType } from './AuthContext';
import { NomRole, StatutCompte } from '../@types/enums.types';
import { getUserMainRole, normalizeAppRole, pickAuthJwtRole } from '../services/supabase/auth';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider d'authentification
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<NomRole | null>(null);
  const [userStatus, setUserStatus] = useState<StatutCompte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialiser la session au montage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        const currentUser = await getCurrentUser();
        const currentSession = await getCurrentSession();

        setUser(currentUser);
        setSession(currentSession);

        if (currentUser) {
          const metadata = currentUser.user_metadata as any;
          let raw: string | null = pickAuthJwtRole(currentUser as any);
          if (!raw) {

            raw = await getUserMainRole(currentUser.id);
          }
          setUserRole(normalizeAppRole(raw) as NomRole);
          setUserStatus(metadata?.statut_compte || 'actif');

        }

        // Initialiser l'écouteur d'événements auth
        authEventManager.addListener('AuthProvider', async (event, updatedSession) => {

          setSession(updatedSession);

          if (event === 'SIGNED_OUT') {
            setUser(null);
            setUserRole(null);
            setUserStatus(null);
          } else if (updatedSession?.user) {
            setUser(updatedSession.user);
            const metadata = updatedSession.user.user_metadata as any;
            let raw: string | null = pickAuthJwtRole(updatedSession.user as any);
            if (!raw && updatedSession.user.id) {
              raw = await getUserMainRole(updatedSession.user.id);
            }
            setUserRole(normalizeAppRole(raw) as NomRole);
            setUserStatus(metadata?.statut_compte || 'actif');

          }
        });
      } catch (err) {
        console.error('[Auth Initialization Error]', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize auth'));
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      authEventManager.removeListener('AuthProvider');
    };
  }, []);

  // Fonction de connexion avec email/password
  const handleSignIn = useCallback(async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error: signInError } = await signInWithPassword(email, password);

      if (signInError) {
        setError(signInError);
        return { user: null, error: signInError };
      }

      setUser(data?.user || null);
      setSession(data?.session || null);
      return { user: data?.user || null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign in failed');
      setError(error);
      return { user: null, error };
    }
  }, []);

  // Fonction d'inscription
  const handleSignUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    try {
      setError(null);
      const { data, error: signUpError } = await signUpWithPassword(email, password, metadata);

      if (signUpError) {
        setError(signUpError);
        return { user: null, error: signUpError };
      }

      setUser(data?.user || null);
      setSession(data?.session || null);
      return { user: data?.user || null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign up failed');
      setError(error);
      return { user: null, error };
    }
  }, []);

  // Fonction de déconnexion
  const handleSignOut = useCallback(async () => {
    try {
      setError(null);
      const { error: signOutError } = await signOut();

      if (signOutError) {
        setError(signOutError);
        return { error: signOutError };
      }

      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserStatus(null);
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sign out failed');
      setError(error);
      return { error };
    }
  }, []);

  // Fonction de réinitialisation de mot de passe
  const handleResetPassword = useCallback(async (email: string) => {
    try {
      setError(null);
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError);
        return { error: resetError };
      }

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Password reset failed');
      setError(error);
      return { error };
    }
  }, []);

  // Fonction de mise à jour du mot de passe
  const handleUpdatePassword = useCallback(async (newPassword: string) => {
    try {
      setError(null);
      const { data, error: updateError } = await updatePassword(newPassword);

      if (updateError) {
        setError(updateError);
        return { user: null, error: updateError };
      }

      if (data?.user) {
        setUser(data.user);
      }
      return { user: data?.user || null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Password update failed');
      setError(error);
      return { user: null, error };
    }
  }, []);

  // Fonction de mise à jour du profil
  const handleUpdateProfile = useCallback(async (metadata: Record<string, any>) => {
    try {
      setError(null);
      const { data, error: updateError } = await updateUserMetadata(metadata);

      if (updateError) {
        setError(updateError);
        return { user: null, error: updateError };
      }

      if (data?.user) {
        setUser(data.user);
        if (data.user.user_metadata) {
          const meta = data.user.user_metadata as any;
          setUserRole(
            normalizeAppRole(
              pickAuthJwtRole(data.user as any) ??
                (typeof meta.role === 'string' ? meta.role : null)
            ) as NomRole
          );
          setUserStatus(meta.statut_compte || null);
        }
      }
      return { user: data?.user || null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Profile update failed');
      setError(error);
      return { user: null, error };
    }
  }, []);

  // Fonction de rafraîchissement de session
  const handleRefreshSession = useCallback(async () => {
    try {
      setError(null);
      const { data, error: refreshError } = await refreshSession();

      if (refreshError) {
        setError(refreshError);
        return { session: null, error: refreshError };
      }

      setSession(data?.session || null);
      return { session: data?.session || null, error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Session refresh failed');
      setError(error);
      return { session: null, error };
    }
  }, []);

  // Déterminer les rôles de l'utilisateur
  const isAdmin = userRole === NomRole.ADMIN_SYSTEME;
  const isModerator = userRole === NomRole.AUTORITE;
  const isOrganisationAdmin = userRole === NomRole.AUTORITE;

  const contextValue: AuthContextType = {
    user,
    session,
    userRole,
    userStatus,
    loading,
    error,
    isAuthenticated: !!user && !!session,
    isAdmin,
    isModerator,
    isOrganisationAdmin,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signInWithGoogle,
    signInWithFacebook,
    signOut: handleSignOut,
    resetPassword: handleResetPassword,
    updatePassword: handleUpdatePassword,
    updateProfile: handleUpdateProfile,
    refreshSession: handleRefreshSession,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
