/**
 * =====================================================
 * Auth Hooks Barrel Export
 * Tous les hooks d'authentification
 * =====================================================
 */

export { useAuth } from './useAuth';
export { useLogin, type UseLoginReturn, type LoginError } from './useLogin';
export { useLogout, type UseLogoutReturn, type LogoutError } from './useLogout';
export { useRegister, type UseRegisterReturn, type RegisterData, type RegisterError } from './useRegister';
export {
  usePasswordReset,
  type UsePasswordResetReturn,
  type PasswordResetError
} from './usePasswordReset';
export {
  useEmailVerification,
  type UseEmailVerificationReturn,
  type EmailVerificationError
} from './userEmailVerification';
