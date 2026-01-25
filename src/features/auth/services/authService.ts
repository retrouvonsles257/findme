/**
 * =====================================================
 * RETROUVONSLES - Auth Service
 * Service centralisé pour toutes les opérations d'authentification
 * =====================================================
 */

import { supabase } from '../../../config/supabase.config';
import {
  saveTokens,
  getAccessToken,
  clearTokens,
  refreshAccessToken,
  isTokenExpired
} from './tokenService';
import {
  saveSessionLocally,
  getSessionFromStorage,
  clearSession,
  isSessionExpired
} from './sessionService';

export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  user_metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: AuthUser;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
  error: AuthError | null;
}

/**
 * Initialize auth service - setup listeners and check session
 */
export const initializeAuthService = async (): Promise<void> => {
  try {
    // Check if there's a stored session
    const storedSession = getSessionFromStorage();
    if (storedSession && !isSessionExpired(storedSession)) {
      // Session is still valid
      return;
    }

    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      // No valid session, clear storage
      clearSession();
      clearTokens();
      return;
    }

    // Save the refreshed session
    const authSession: AuthSession = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user: data.session.user as AuthUser
    };

    saveSessionLocally({
      access_token: authSession.access_token,
      refresh_token: authSession.refresh_token || '',
      expires_in: authSession.expires_in || 3600,
      expires_at: authSession.expires_at,
      token_type: authSession.token_type || 'Bearer',
      user: authSession.user as any
    } as any);
    saveTokens({
      accessToken: authSession.access_token,
      refreshToken: authSession.refresh_token,
      expiresIn: authSession.expires_in
    });
  } catch (err) {
    console.error('Error initializing auth service:', err);
    clearSession();
    clearTokens();
  }
};

/**
 * Get current authenticated user and session
 */
export const getCurrentAuthState = async (): Promise<AuthResponse> => {
  try {
    const accessToken = getAccessToken();

    // Check if token needs refresh
    if (accessToken && isTokenExpired(accessToken)) {
      const refreshedTokenInfo = await refreshAccessToken();
      if (!refreshedTokenInfo) {
        clearSession();
        return {
          user: null,
          session: null,
          error: { message: 'Session expired' }
        };
      }
    }

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      clearSession();
      clearTokens();
      return {
        user: null,
        session: null,
        error: error ? { message: error.message, code: error.code } : null
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();

    return {
      user: data.user as AuthUser,
      session: sessionData.session as AuthSession | null,
      error: null
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      user: null,
      session: null,
      error: { message }
    };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { user, error } = await getCurrentAuthState();
    return !error && !!user;
  } catch {
    return false;
  }
};

/**
 * Ensure token is valid, refresh if needed
 */
export const ensureValidToken = async (): Promise<string | null> => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return null;
    }

    if (isTokenExpired(accessToken)) {
      const refreshedTokenInfo = await refreshAccessToken();
      if (!refreshedTokenInfo) {
        return null;
      }
      return refreshedTokenInfo.accessToken;
    }

    return accessToken;
  } catch (err) {
    console.error('Error ensuring valid token:', err);
    return null;
  }
};

/**
 * Get authorization header value
 */
export const getAuthHeader = async (): Promise<{ Authorization: string } | null> => {
  try {
    const token = await ensureValidToken();
    if (!token) {
      return null;
    }

    return {
      Authorization: `Bearer ${token}`
    };
  } catch (err) {
    console.error('Error getting auth header:', err);
    return null;
  }
};

/**
 * Setup auth state change listener
 */
export const setupAuthListener = (
  callback: (authResponse: AuthResponse) => void
): (() => void) => {
  const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
    try {
      if (session) {
        const authSession: AuthSession = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          expires_at: session.expires_at,
          token_type: session.token_type,
          user: session.user as AuthUser
        };

        saveSessionLocally({
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token || '',
          expires_in: authSession.expires_in || 3600,
          expires_at: authSession.expires_at,
          token_type: authSession.token_type || 'Bearer',
          user: authSession.user as any
        } as any);
        saveTokens({
          accessToken: authSession.access_token,
          refreshToken: authSession.refresh_token,
          expiresIn: authSession.expires_in
        });

        callback({
          user: authSession.user || null,
          session: authSession,
          error: null
        });
      } else {
        clearSession();
        clearTokens();

        callback({
          user: null,
          session: null,
          error: event === 'SIGNED_OUT' ? null : { message: 'No session' }
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      callback({
        user: null,
        session: null,
        error: { message }
      });
    }
  });

  // Return unsubscribe function
  return () => {
    data?.subscription.unsubscribe();
  };
};

/**
 * Logout and cleanup
 */
export const logoutAuthService = async (): Promise<AuthError | null> => {
  try {
    const { error } = await supabase.auth.signOut();

    clearSession();
    clearTokens();

    if (error) {
      return { message: error.message, code: error.code };
    }

    return null;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    clearSession();
    clearTokens();
    return { message };
  }
};

/**
 * Export auth data for debugging
 */
export const exportAuthData = async (): Promise<{
  isAuthenticated: boolean;
  user: AuthUser | null;
  sessionValid: boolean;
  tokenValid: boolean;
}> => {
  try {
    const { user, session, error } = await getCurrentAuthState();
    const accessToken = getAccessToken();

    return {
      isAuthenticated: !error && !!user,
      user: user || null,
      sessionValid: !!session && !isSessionExpired(session as any),
      tokenValid: !!accessToken && !isTokenExpired(accessToken)
    };
  } catch (err) {
    return {
      isAuthenticated: false,
      user: null,
      sessionValid: false,
      tokenValid: false
    };
  }
};
