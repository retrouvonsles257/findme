/**
 * =====================================================
 * RETROUVONSLES - Auth Feature Type Definitions
 * Type definitions for auth components and utilities
 * =====================================================
 */

import { TypeCompte } from '../../../@types/enums.types';

// ============================================
// Form Data Types
// ============================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  nomComplet: string;
  telephone?: string;
  acceptTerms: boolean;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

// ============================================
// Component Props Types
// ============================================

export interface RegisterStepSelectorProps {
  selectedType?: TypeCompte;
  onSelect: (type: TypeCompte) => void;
  isLoading?: boolean;
  className?: string;
}

export interface RegisterAuthorityFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

// ============================================
// Validation Error Types
// ============================================

export interface FormFieldError {
  field: string;
  message: string;
}

export interface FieldErrors {
  [key: string]: string | undefined;
}

// ============================================
// Session & User Response Types
// ============================================

export interface AuthSession {
  access_token: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  expires_in?: number;
  expiresIn?: number;
  expires_at?: number | string;
  expiresAt?: number | string;
  token_type?: string;
  user?: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  prenom?: string;
  nom?: string;
  email_confirmed_at?: string;
  emailVerified?: boolean;
  phone?: string;
  typeCompte?: string;
  role?: string;
  organisationId?: string;
  permissions?: string[];
  preferences?: Record<string, any>;
  isProfileComplete?: boolean;
  user_metadata?: Record<string, any>;
  aud?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// Password Strength Types
// ============================================

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: PasswordRequirements;
}

// ============================================
// Auth Context Types
// ============================================

export interface AuthContextValue {
  user: AuthUser | null;
  session: AuthSession | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
}

// ============================================
// Auth Store State Types
// ============================================

export interface AuthStoreState {
  user: Partial<AuthUser> | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  isLogout: boolean;
  isPasswordResetting: boolean;
  error: string | null;
  errors: FieldErrors;
  lastLoginAttempt: string | null;
  loginAttempts: number;
  isAccountLocked: boolean;
  lockoutExpiration: string | null;
  passwordResetToken: string | null;
  passwordResetEmail: string | null;
  passwordResetExpiration: string | null;
  emailVerificationToken: string | null;
  emailVerificationEmail: string | null;
  twoFactorEnabled: boolean;
  twoFactorPending: boolean;
}
