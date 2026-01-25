/**
 * =====================================================
 * LoginForm Component
 * Formulaire de connexion avec email/password
 * =====================================================
 */

import React, { useState } from 'react';
import { useNotification } from '../../../contexts';
import { useLogin } from '../hooks';
import styles from './LoginForm.module.css';

export interface LoginFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  redirectUrl = '/',
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const notification = useNotification();

  const showError = (title: string, message: string) => {
    notification.addNotification({
      title,
      message,
      type: 'error'
    });
  };

  const showSuccess = (title: string, message: string) => {
    notification.addNotification({
      title,
      message,
      type: 'success'
    });
  };
  const { login, isLoading, error } = useLogin();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Email invalide';
    }

    if (!password) {
      errors.password = 'Mot de passe requis';
    } else if (password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const { user, error: loginError } = await login(email, password);

      if (loginError) {
        showError('Connexion échouée', loginError.message || 'Une erreur est survenue lors de la connexion');
        return;
      }

      if (user) {
        showSuccess('Connexion réussie', `Bienvenue ${user.email}`);

        // Reset form
        setEmail('');
        setPassword('');
        setFieldErrors({});

        // Callback de succès
        if (onSuccess) {
          onSuccess();
        }

        // Redirection
        if (redirectUrl !== '/') {
          window.location.href = redirectUrl;
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur de connexion';
      showError('Erreur', errorMsg);
    }
  };

  return (
    <div className={`${styles.loginForm} ${className}`}>
      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors({ ...fieldErrors, email: '' });
              }
            }}
            placeholder="votre@email.com"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <span className={styles.errorText}>{fieldErrors.email}</span>
          )}
        </div>

        {/* Password Input */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="password" className={styles.label}>
              Mot de passe
            </label>
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) {
                setFieldErrors({ ...fieldErrors, password: '' });
              }
            }}
            placeholder="••••••••"
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.password && (
            <span className={styles.errorText}>{fieldErrors.password}</span>
          )}
        </div>

        {/* Global Error */}
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error.message}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className={styles.spinner}></span>
              Connexion en cours...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>
    </div>
  );
};
