/**
 * =====================================================
 * RETROUVONSLES - Auth Feature Barrel Export
 * Point d'entrée unique pour la feature d'authentification
 * =====================================================
 */

// ============================================
// COMPOSANTS
// ============================================

export {
  LoginForm,
  RegisterForm,
  RegisterAuthorityForm,
  RegisterPublicForm,
  RegisterStepSelector,
  ForgotPassword,
  ResetPassword,
  VerifyEmail,
  SocialLogin,
  PasswordStrengthIndicator,
  type LoginFormProps,
  type RegisterFormProps,
  type RegisterAuthorityFormProps,
  type RegisterStepSelectorProps,
  type ForgotPasswordProps,
  type ResetPasswordProps,
  type VerifyEmailProps,
  type SocialLoginProps,
  type PasswordStrengthIndicatorProps,
  type PasswordStrength
} from './components';

// ============================================
// HOOKS
// ============================================

export {
  useAuth,
  useLogin,
  useLogout,
  useRegister,
  usePasswordReset,
  useEmailVerification,
  type UseLoginReturn,
  type LoginError,
  type UseLogoutReturn,
  type LogoutError,
  type UseRegisterReturn,
  type RegisterData,
  type RegisterError,
  type UsePasswordResetReturn,
  type PasswordResetError,
  type UseEmailVerificationReturn,
  type EmailVerificationError
} from './hooks';

// ============================================
// SERVICES - Session Management
// ============================================

export {
  saveSessionLocally,
  getSessionFromStorage,
  saveUserLocally,
  getUserFromStorage,
  isSessionExpired,
  validateToken,
  clearSession,
  getCurrentSession,
  getCurrentUser,
  getSessionAndUser,
  onAuthStateChange,
  exportSessionData
} from './services';

// ============================================
// SERVICES - Token Management
// ============================================

export {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  decodeToken,
  refreshAccessToken,
  validateTokenWithServer,
  getTokenExpiryTime,
  clearTokens,
  getStoredTokenInfo,
  exportTokenData,
  type TokenInfo,
  type DecodedToken
} from './services';

// ============================================
// SERVICES - Auth Operations
// ============================================

export {
  initializeAuthService,
  getCurrentAuthState,
  isAuthenticated,
  ensureValidToken,
  getAuthHeader,
  setupAuthListener,
  logoutAuthService,
  exportAuthData,
  type AuthError,
  type AuthResponse
} from './services';

// ============================================
// TYPES
// ============================================

export type {
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  FormFieldError,
  FieldErrors,
  PasswordRequirements,
  AuthContextValue,
  AuthSession,
  AuthUser,
  AuthStoreState
} from './types';

// ============================================
// UTILITIES - Validation
// ============================================

export {
  validateEmail,
  validatePhoneNumber,
  validatePassword,
  validateName,
  validateFirstName,
  validateLastName,
  validateLoginForm,
  validateRegisterForm,
  validatePasswordResetForm,
  validatePasswordRequestForm,
  validateVerificationCode,
  isValidEmail,
  isValidPhoneNumber,
  isValidPassword,
  checkPasswordStrength,
  getFormErrors,
  hasFormErrors,
  hasFieldError,
  getFieldError,
  type ValidationResult,
  type PasswordValidationResult
} from './utils';

// ============================================
// UTILITIES - Helpers
// ============================================

export {
  formatUserName,
  formatUserDisplayName,
  getUserInitials,
  formatUserEmail,
  maskEmail,
  formatPhoneNumber,
  formatDate,
  formatDateTime,
  getRelativeTime,
  formatTime,
  getTimeRemaining,
  calculateSessionDuration,
  getTokenExpiry,
  isTokenExpired,
  getTokenTimeRemaining,
  shouldRefreshToken,
  parseJWT,
  getJWTPayload,
  getJWTClaim,
  obscurePassword,
  getAuthErrorMessage,
  isValidUser,
  isValidSession,
  getAccountTypeLabel,
  getRoleLabel,
  extractUserInfoFromToken,
  getEmailVerificationStatus,
  getAccountStatus
} from './utils';
