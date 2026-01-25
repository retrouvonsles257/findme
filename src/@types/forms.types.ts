/**
 * =====================================================
 * RETROUVONSLES - Types pour les Formulaires
 * =====================================================
 */

export type LoginForm = {
  email: string;
  password: string;
};

export type RegistrationForm = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};
