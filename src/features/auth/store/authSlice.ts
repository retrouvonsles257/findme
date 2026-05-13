/**
 * =====================================================
 * RETROUVONSLES - Auth Redux Slice
 * Gestion d'état Redux pour l'authentification
 * =====================================================
 */

import type { AuthStoreState } from '../types';

// ============================================
// INITIAL STATE
// ============================================

const initialState: AuthStoreState = {
  user: null,
  session: null,
  isLoading: true, // true au démarrage jusqu'à la fin de restoreSession (évite redirection flash)
  isAuthenticating: false,
  isLogout: false,
  isPasswordResetting: false,
  error: null,
  errors: {},
  lastLoginAttempt: null,
  loginAttempts: 0,
  isAccountLocked: false,
  lockoutExpiration: null,
  passwordResetToken: null,
  passwordResetEmail: null,
  passwordResetExpiration: null,
  emailVerificationToken: null,
  emailVerificationEmail: null,
  twoFactorEnabled: false,
  twoFactorPending: false,
};

// ============================================
// ACTIONS
// ============================================

export const AUTH_ACTIONS = {
  // Login
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGIN_ATTEMPT_FAILED: 'LOGIN_ATTEMPT_FAILED',

  // Register
  REGISTER_REQUEST: 'REGISTER_REQUEST',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_ERROR: 'REGISTER_ERROR',

  // Logout
  LOGOUT_REQUEST: 'LOGOUT_REQUEST',
  LOGOUT_SUCCESS: 'LOGOUT_SUCCESS',
  LOGOUT_ERROR: 'LOGOUT_ERROR',

  // Password Reset
  REQUEST_PASSWORD_RESET: 'REQUEST_PASSWORD_RESET',
  REQUEST_PASSWORD_RESET_SUCCESS: 'REQUEST_PASSWORD_RESET_SUCCESS',
  REQUEST_PASSWORD_RESET_ERROR: 'REQUEST_PASSWORD_RESET_ERROR',

  RESET_PASSWORD_REQUEST: 'RESET_PASSWORD_REQUEST',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  RESET_PASSWORD_ERROR: 'RESET_PASSWORD_ERROR',

  // Email Verification
  VERIFY_EMAIL_REQUEST: 'VERIFY_EMAIL_REQUEST',
  VERIFY_EMAIL_SUCCESS: 'VERIFY_EMAIL_SUCCESS',
  VERIFY_EMAIL_ERROR: 'VERIFY_EMAIL_ERROR',

  RESEND_VERIFICATION_EMAIL: 'RESEND_VERIFICATION_EMAIL',
  RESEND_VERIFICATION_EMAIL_SUCCESS: 'RESEND_VERIFICATION_EMAIL_SUCCESS',
  RESEND_VERIFICATION_EMAIL_ERROR: 'RESEND_VERIFICATION_EMAIL_ERROR',

  // Session
  RESTORE_SESSION_REQUEST: 'RESTORE_SESSION_REQUEST',
  RESTORE_SESSION_SUCCESS: 'RESTORE_SESSION_SUCCESS',
  RESTORE_SESSION_ERROR: 'RESTORE_SESSION_ERROR',

  REFRESH_TOKEN_REQUEST: 'REFRESH_TOKEN_REQUEST',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  REFRESH_TOKEN_ERROR: 'REFRESH_TOKEN_ERROR',

  // Account Lock
  LOCK_ACCOUNT: 'LOCK_ACCOUNT',
  UNLOCK_ACCOUNT: 'UNLOCK_ACCOUNT',

  // 2FA
  ENABLE_2FA_REQUEST: 'ENABLE_2FA_REQUEST',
  ENABLE_2FA_SUCCESS: 'ENABLE_2FA_SUCCESS',
  ENABLE_2FA_ERROR: 'ENABLE_2FA_ERROR',

  VERIFY_2FA_REQUEST: 'VERIFY_2FA_REQUEST',
  VERIFY_2FA_SUCCESS: 'VERIFY_2FA_SUCCESS',
  VERIFY_2FA_ERROR: 'VERIFY_2FA_ERROR',

  // Cleanup
  RESET_ERRORS: 'RESET_ERRORS',
  RESET_STATE: 'RESET_STATE',
  CLEAR_SESSION: 'CLEAR_SESSION',
};

// ============================================
// REDUCER
// ============================================

export const authReducer = (
  state: AuthStoreState = initialState,
  action: any,
): AuthStoreState => {
  switch (action.type) {
    // ===== LOGIN =====
    case AUTH_ACTIONS.LOGIN_REQUEST:
      return {
        ...state,
        isAuthenticating: true,
        error: null,
        errors: {},
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticating: false,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
        errors: {},
        loginAttempts: 0,
        isAccountLocked: false,
        lockoutExpiration: null,
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        isAuthenticating: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    case AUTH_ACTIONS.LOGIN_ATTEMPT_FAILED:
      const newAttempts = state.loginAttempts + 1;
      const isLocked = newAttempts >= 5;
      return {
        ...state,
        loginAttempts: newAttempts,
        isAccountLocked: isLocked,
        lockoutExpiration: isLocked ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null,
        lastLoginAttempt: new Date().toISOString(),
      };

    // ===== REGISTER =====
    case AUTH_ACTIONS.REGISTER_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
        errors: {},
      };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
        errors: {},
      };

    case AUTH_ACTIONS.REGISTER_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    // ===== LOGOUT =====
    case AUTH_ACTIONS.LOGOUT_REQUEST:
      return {
        ...state,
        isLogout: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGOUT_SUCCESS:
      return {
        ...state,
        isLogout: false,
        user: null,
        session: null,
        error: null,
        twoFactorEnabled: false,
        twoFactorPending: false,
      };

    case AUTH_ACTIONS.LOGOUT_ERROR:
      return {
        ...state,
        isLogout: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_SESSION:
      return {
        ...state,
        user: null,
        session: null,
        isAuthenticating: false,
      };

    // ===== PASSWORD RESET =====
    case AUTH_ACTIONS.REQUEST_PASSWORD_RESET:
      return {
        ...state,
        isPasswordResetting: true,
        error: null,
        errors: {},
      };

    case AUTH_ACTIONS.REQUEST_PASSWORD_RESET_SUCCESS:
      return {
        ...state,
        isPasswordResetting: false,
        passwordResetEmail: action.payload.email,
        passwordResetToken: null,
        error: null,
      };

    case AUTH_ACTIONS.REQUEST_PASSWORD_RESET_ERROR:
      return {
        ...state,
        isPasswordResetting: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    case AUTH_ACTIONS.RESET_PASSWORD_REQUEST:
      return {
        ...state,
        isPasswordResetting: true,
        error: null,
        errors: {},
      };

    case AUTH_ACTIONS.RESET_PASSWORD_SUCCESS:
      return {
        ...state,
        isPasswordResetting: false,
        passwordResetToken: null,
        passwordResetEmail: null,
        passwordResetExpiration: null,
        error: null,
      };

    case AUTH_ACTIONS.RESET_PASSWORD_ERROR:
      return {
        ...state,
        isPasswordResetting: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    // ===== EMAIL VERIFICATION =====
    case AUTH_ACTIONS.VERIFY_EMAIL_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS:
      return {
        ...state,
        isLoading: false,
        user: action.payload.user ? { ...state.user, ...action.payload.user } : state.user,
        error: null,
        emailVerificationToken: null,
        emailVerificationEmail: null,
      };

    case AUTH_ACTIONS.VERIFY_EMAIL_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.RESEND_VERIFICATION_EMAIL:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.RESEND_VERIFICATION_EMAIL_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.RESEND_VERIFICATION_EMAIL_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== SESSION =====
    case AUTH_ACTIONS.RESTORE_SESSION_REQUEST:
      return {
        ...state,
        isLoading: true,
      };

    case AUTH_ACTIONS.RESTORE_SESSION_SUCCESS:
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
      };

    case AUTH_ACTIONS.RESTORE_SESSION_ERROR:
      return {
        ...state,
        isLoading: false,
        user: null,
        session: null,
        error: action.payload,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_REQUEST:
      return {
        ...state,
        isLoading: true,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        session: action.payload,
        error: null,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== ACCOUNT LOCK =====
    case AUTH_ACTIONS.LOCK_ACCOUNT:
      return {
        ...state,
        isAccountLocked: true,
        lockoutExpiration: action.payload,
      };

    case AUTH_ACTIONS.UNLOCK_ACCOUNT:
      return {
        ...state,
        isAccountLocked: false,
        lockoutExpiration: null,
        loginAttempts: 0,
      };

    // ===== 2FA =====
    case AUTH_ACTIONS.ENABLE_2FA_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.ENABLE_2FA_SUCCESS:
      return {
        ...state,
        isLoading: false,
        twoFactorEnabled: true,
        error: null,
      };

    case AUTH_ACTIONS.ENABLE_2FA_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.VERIFY_2FA_REQUEST:
      return {
        ...state,
        isLoading: true,
        twoFactorPending: true,
        error: null,
      };

    case AUTH_ACTIONS.VERIFY_2FA_SUCCESS:
      return {
        ...state,
        isLoading: false,
        twoFactorPending: false,
        user: action.payload.user,
        session: action.payload.session,
        error: null,
      };

    case AUTH_ACTIONS.VERIFY_2FA_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== CLEANUP =====
    case AUTH_ACTIONS.RESET_ERRORS:
      return {
        ...state,
        error: null,
        errors: {},
      };

    case AUTH_ACTIONS.RESET_STATE:
      return initialState;

    // ===== THUNKS (Redux Toolkit) =====
    case 'auth/login/pending':
      return {
        ...state,
        isAuthenticating: true,
        error: null,
        errors: {},
      };

    case 'auth/login/fulfilled':
      return {
        ...state,
        isAuthenticating: false,
        user: action.payload.user,
        session: {
          access_token: action.payload.accessToken,
          refresh_token: action.payload.refreshToken,
          expires_at: action.payload.expiresAt,
          user: action.payload.user,
        },
        error: null,
        errors: {},
        loginAttempts: 0,
        isAccountLocked: false,
        lockoutExpiration: null,
      };

    case 'auth/login/rejected':
      return {
        ...state,
        isAuthenticating: false,
        error: action.payload?.message || 'Connexion échouée',
        errors: {},
      };

    case 'auth/signInAnonymous/pending':
      return {
        ...state,
        isAuthenticating: true,
        error: null,
        errors: {},
      };

    case 'auth/signInAnonymous/fulfilled':
      return {
        ...state,
        isAuthenticating: false,
        user: action.payload.user,
        session: {
          access_token: action.payload.accessToken,
          refresh_token: action.payload.refreshToken,
          expires_at: action.payload.expiresAt,
          user: action.payload.user,
        },
        error: null,
        errors: {},
        loginAttempts: 0,
        isAccountLocked: false,
        lockoutExpiration: null,
      };

    case 'auth/signInAnonymous/rejected':
      return {
        ...state,
        isAuthenticating: false,
        error: action.payload?.message || 'Connexion sans compte impossible',
        errors: {},
      };

    case 'auth/upgradeAnonymous/pending':
      return {
        ...state,
        isAuthenticating: true,
        error: null,
        errors: {},
      };

    case 'auth/upgradeAnonymous/fulfilled':
      return {
        ...state,
        isAuthenticating: false,
        user: action.payload.user,
        session: {
          access_token: action.payload.accessToken,
          refresh_token: action.payload.refreshToken,
          expires_at: action.payload.expiresAt,
          user: action.payload.user,
        },
        error: null,
        errors: {},
      };

    case 'auth/upgradeAnonymous/rejected':
      return {
        ...state,
        isAuthenticating: false,
        error: action.payload?.message || 'Enregistrement du compte impossible',
        errors: {},
      };

    case 'auth/logout/pending':
      return {
        ...state,
        isLogout: true,
        error: null,
      };

    case 'auth/logout/rejected':
      return {
        ...state,
        isLogout: false,
        error: action.payload?.message || 'Erreur de déconnexion',
      };

    case 'auth/logout/fulfilled':
      return {
        ...state,
        isLogout: false,
        user: null,
        session: null,
        error: null,
        twoFactorEnabled: false,
        twoFactorPending: false,
      };

    case 'auth/restoreSession/pending':
      return {
        ...state,
        isLoading: true,
      };

    case 'auth/restoreSession/fulfilled':
      if (action.payload) {
        return {
          ...state,
          isLoading: false,
          user: action.payload.user,
          session: {
            access_token: action.payload.accessToken,
            refresh_token: action.payload.refreshToken,
            expires_at: action.payload.expiresAt,
            user: action.payload.user,
          },
          error: null,
        };
      }
      return {
        ...state,
        isLoading: false,
        user: null,
        session: null,
      };

    case 'auth/restoreSession/rejected':
      return {
        ...state,
        isLoading: false,
        user: null,
        session: null,
      };

    default:
      return state;
  }
};
