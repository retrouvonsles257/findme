/**
 * =====================================================
 * RETROUVONSLES - Auth Routes
 * Routes d'authentification et gestion de comptes
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  CompleteProfilePage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  AuthCallbackPage
} from '../pages/auth';

import { AUTH_ROUTES } from './routes.config';

/**
 * AuthRoutes Component
 * Contient toutes les routes d'authentification
 * - Login
 * - Register
 * - Forgot Password
 * - Reset Password
 * - Verify Email
 * - OAuth Callback
 * - Complete Profile
 */
const AuthRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth Base Route */}
      <Route path="/" element={<Navigate to={AUTH_ROUTES.LOGIN} replace />} />

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Register */}
      <Route path="/register" element={<RegisterPage />} />

      {/* OAuth Callback */}
      <Route path="/callback" element={<AuthCallbackPage />} />

      {/* Complete Profile */}
      <Route path="/complete-profile" element={<CompleteProfilePage />} />

      {/* Forgot Password */}
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Reset Password */}
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Verify Email */}
      <Route path="/verify-email" element={<VerifyEmailPage />} />
    </Routes>
  );
};

export default AuthRoutes;
