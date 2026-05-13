/**
 * =====================================================
 * RETROUVONSLES - Auth Redux Thunks
 * Async thunks for authentication actions with Supabase
 * =====================================================
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import { normalizeAppRole, supabaseAuthService } from '../../../services/supabase/auth';
import { supabase } from '../../../config';
import type { 
  LoginCredentials, 
  PasswordResetRequest,
  PasswordResetConfirm,
  User
} from '../../../@types/auth.types';
import { NomRole, StatutCompte, TypeCompte } from '../../../@types/enums.types';

// ============================================
// THUNK TYPES
// ============================================

export interface AuthThunkPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthErrorPayload {
  code: string;
  message: string;
}

// ============================================
// HELPER: Convert service data to User type
// ============================================

function convertToUser(serviceUser: any): User {
  const isAnonymous = Boolean(serviceUser.is_anonymous);
  return {
    id: serviceUser.id,
    email: serviceUser.email,
    nom_complet: `${serviceUser.prenom || ''} ${serviceUser.nom || ''}`.trim() || 'Utilisateur',
    telephone: serviceUser.telephone,
    role: normalizeAppRole(serviceUser.role) as NomRole,
    statut_compte: (serviceUser.statut_compte as StatutCompte) || StatutCompte.ACTIF,
    type_compte: (serviceUser.type_compte as TypeCompte) || TypeCompte.GRAND_PUBLIC,
    organisation_id: serviceUser.organisation_id ?? serviceUser.id_organisation ?? undefined,
    identite_verifiee: Boolean(serviceUser.identite_verifiee),
    autorite_echelon:
      serviceUser.autorite_echelon === undefined || serviceUser.autorite_echelon === null
        ? null
        : Number(serviceUser.autorite_echelon),
    date_creation: new Date().toISOString(),
    derniere_connexion: new Date().toISOString(),
    email_confirme:
      serviceUser.email_confirme !== undefined
        ? Boolean(serviceUser.email_confirme)
        : !isAnonymous,
    telephone_confirme: false,
    is_anonymous: isAnonymous,
  };
}

// ============================================
// LOGIN THUNK
// ============================================

export const loginThunk = createAsyncThunk<
  AuthThunkPayload,
  LoginCredentials,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    const result = await supabaseAuthService.login(credentials);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return rejectWithValue({
        code: 'INVALID_RESPONSE',
        message: 'Invalid login response',
      });
    }

    const user = convertToUser(result.data.user);

    if (user.role === NomRole.ADMIN_SYSTEME || user.role === NomRole.AUTORITE) {
      try {
        await (supabase as any).rpc('record_admin_login_event', {
          p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          p_path: typeof window !== 'undefined' ? window.location.pathname : null,
        });
      } catch {
        // La connexion ne doit pas échouer si l'audit distant est temporairement indisponible.
      }
    }

    return {
      user,
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);

// ============================================
// REGISTER THUNK
// ============================================

export const registerThunk = createAsyncThunk<
  AuthThunkPayload,
  { email: string; password: string },
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/register',
  async (data, { rejectWithValue }) => {
    const result = await supabaseAuthService.register(data);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return rejectWithValue({
        code: 'INVALID_RESPONSE',
        message: 'Invalid registration response',
      });
    }

    return {
      user: convertToUser(result.data.user),
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);

// ============================================
// SIGN IN ANONYMOUS THUNK
// ============================================

export const signInAnonymousThunk = createAsyncThunk<
  AuthThunkPayload,
  void,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/signInAnonymous',
  async (_, { rejectWithValue }) => {
    const result = await supabaseAuthService.signInAnonymously();

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return rejectWithValue({
        code: 'INVALID_RESPONSE',
        message: 'Réponse de connexion anonyme invalide',
      });
    }

    return {
      user: convertToUser(result.data.user),
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);

// ============================================
// UPGRADE ANONYMOUS ACCOUNT THUNK
// ============================================

export const upgradeAnonymousThunk = createAsyncThunk<
  AuthThunkPayload,
  { email: string; password: string },
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/upgradeAnonymous',
  async (data, { rejectWithValue }) => {
    const result = await supabaseAuthService.upgradeAnonymousAccount(data);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return rejectWithValue({
        code: 'INVALID_RESPONSE',
        message: 'Réponse de mise à jour du compte invalide',
      });
    }

    return {
      user: convertToUser(result.data.user),
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);

// ============================================
// LOGOUT THUNK
// ============================================

export const logoutThunk = createAsyncThunk<
  void,
  void,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const result = await supabaseAuthService.logout();

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }
    return;
  }
);

// ============================================
// REQUEST PASSWORD RESET THUNK
// ============================================

export const requestPasswordResetThunk = createAsyncThunk<
  void,
  PasswordResetRequest,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/requestPasswordReset',
  async (request, { rejectWithValue }) => {
    const result = await supabaseAuthService.requestPasswordReset(request);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }
    return;
  }
);

// ============================================
// RESET PASSWORD THUNK
// ============================================

export const resetPasswordThunk = createAsyncThunk<
  AuthThunkPayload,
  PasswordResetConfirm,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/resetPassword',
  async (data, { rejectWithValue }) => {
    const result = await supabaseAuthService.resetPassword({ password: data.new_password });

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return rejectWithValue({
        code: 'INVALID_RESPONSE',
        message: 'Invalid password reset response',
      });
    }

    return {
      user: convertToUser(result.data.user),
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);

// ============================================
// VERIFY EMAIL THUNK
// ============================================

export const verifyEmailThunk = createAsyncThunk<
  void,
  string,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/verifyEmail',
  async (code, { rejectWithValue }) => {
    const result = await supabaseAuthService.verifyEmail(code);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }
    return;
  }
);

// ============================================
// RESEND VERIFICATION EMAIL THUNK
// ============================================

export const resendVerificationEmailThunk = createAsyncThunk<
  void,
  string,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/resendVerificationEmail',
  async (email, { rejectWithValue }) => {
    const result = await supabaseAuthService.resendVerificationEmail(email);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }
    return;
  }
);

// ============================================
// RESTORE SESSION THUNK
// ============================================

export const restoreSessionThunk = createAsyncThunk<
  AuthThunkPayload | null,
  void,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    const result = await supabaseAuthService.getCurrentSession();

    if (result.error) {
      // Session non trouvée est normal, ne pas reject
      if (result.error.code === 'NO_SESSION') {
        return null;
      }
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return null;
    }

    return {
      user: convertToUser(result.data.user),
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);

// ============================================
// REFRESH TOKEN THUNK
// ============================================

export const refreshTokenThunk = createAsyncThunk<
  AuthThunkPayload,
  string,
  {
    rejectValue: AuthErrorPayload;
  }
>(
  'auth/refreshToken',
  async (refreshToken, { rejectWithValue }) => {
    const result = await supabaseAuthService.refreshToken(refreshToken);

    if (result.error) {
      return rejectWithValue({
        code: result.error.code,
        message: result.error.message,
      });
    }

    if (!result.data) {
      return rejectWithValue({
        code: 'INVALID_RESPONSE',
        message: 'Invalid token refresh response',
      });
    }

    return {
      user: convertToUser(result.data.user),
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      expiresAt: result.data.expires_at,
    };
  }
);
