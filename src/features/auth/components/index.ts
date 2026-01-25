/**
 * =====================================================
 * Auth Components Barrel Export
 * Tous les composants d'authentification
 * =====================================================
 */

export { LoginForm, type LoginFormProps } from './LoginForm';
export { RegisterForm, type RegisterFormProps } from './RegisterForm';
export { default as RegisterAuthorityForm, type RegisterAuthorityFormProps } from './RegisterAuthorityForm';
export { default as RegisterPublicForm } from './RegisterPublicForm';
export { default as RegisterStepSelector } from './RegisterStepSelector';
export { ForgotPassword, type ForgotPasswordProps } from './ForgotPassword';
export { default as ResetPassword, type ResetPasswordProps } from './ResetPassword';
export { default as VerifyEmail, type VerifyEmailProps } from './VerifyEmail';
export { default as SocialLogin, type SocialLoginProps } from './SocialLogin';
export { PasswordStrengthIndicator, type PasswordStrengthIndicatorProps, type PasswordStrength } from './PasswordStrengthIndicator';

// Re-export types
export type { RegisterStepSelectorProps } from '../types';
