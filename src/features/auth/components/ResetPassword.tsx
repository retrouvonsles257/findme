/**
 * =====================================================
 * RETROUVONSLES - ResetPassword Component
 * Réinitialiser le mot de passe avec token
 * =====================================================
 */

import React, { useState } from 'react';
import { useNotification } from '../../../contexts';
import { usePasswordReset } from '../hooks';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import styles from './ResetPassword.module.css';

export interface ResetPasswordProps {
  token?: string;
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

interface FormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess, onBack, className = '' }) => {
  const notification = useNotification();
  const { resetPasswordWithToken, updateUserPassword, isLoading, error } = usePasswordReset();
  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: ''
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData>>({});
  const [submitted, setSubmitted] = useState(false);

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

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {};

    if (formData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof FormData]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = token
        ? await resetPasswordWithToken(token, formData.password)
        : await updateUserPassword(formData.password);

      if (result.error) {
        showError('Erreur', result.error.message);
        return;
      }

      showSuccess('Succès', 'Votre mot de passe a été réinitialisé avec succès');
      setSubmitted(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err) {
      showError('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue');
    }
  };

  if (submitted) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h2 className={styles.successTitle}>Mot de passe réinitialisé</h2>
          <p className={styles.successText}>Votre mot de passe a été changé avec succès.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <h1 className={styles.title}>Réinitialiser le mot de passe</h1>
      <p className={styles.subtitle}>Entrez votre nouveau mot de passe</p>

      {error && <div className={styles.error}>{error.message}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            disabled={isLoading}
            required
          />
          {formData.password && (
            <PasswordStrengthIndicator password={formData.password} />
          )}
          {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="confirmPassword">
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="••••••••"
            className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
            disabled={isLoading}
            required
          />
          {fieldErrors.confirmPassword && (
            <p className={styles.fieldError}>{fieldErrors.confirmPassword}</p>
          )}
        </div>

        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Mise à jour...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>

      {onBack && (
        <button onClick={onBack} className={styles.backLink} disabled={isLoading} type="button">
          ← Retour
        </button>
      )}
    </div>
  );
};

export default ResetPassword;
