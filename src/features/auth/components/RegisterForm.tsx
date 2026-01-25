/**
 * =====================================================
 * RegisterForm Component
 * Formulaire d'inscription pour le grand public
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNotification } from '../../../contexts';
import { useRegister } from '../hooks';
import { TypeCompte } from '../../../@types/enums.types';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import styles from './RegisterForm.module.css';

export interface RegisterFormProps {
  onSuccess?: () => void;
  redirectUrl?: string;
  className?: string;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  nomComplet: string;
  telephone?: string;
  acceptTerms: boolean;
}

interface FieldErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  nomComplet?: string;
  telephone?: string;
  acceptTerms?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  redirectUrl = '/dashboard',
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    nomComplet: '',
    telephone: '',
    acceptTerms: false
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const notification = useNotification();
  const { register, isLoading, error } = useRegister();

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

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email requis';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Email invalide';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Mot de passe requis';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Full name validation
    if (!formData.nomComplet.trim()) {
      errors.nomComplet = 'Nom complet requis';
    } else if (formData.nomComplet.trim().length < 3) {
      errors.nomComplet = 'Le nom doit contenir au moins 3 caractères';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.telephone && !/^\+?[1-9]\d{1,14}$/.test(formData.telephone.replace(/\s/g, ''))) {
      errors.telephone = 'Numéro de téléphone invalide';
    }

    // Terms acceptance
    if (!formData.acceptTerms) {
      errors.acceptTerms = 'Vous devez accepter les conditions';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as any;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear field error on change
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  }, [fieldErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const { user, error: registerError } = await register({
        email: formData.email,
        password: formData.password,
        nom_complet: formData.nomComplet,
        telephone: formData.telephone || undefined,
        type_compte: TypeCompte.GRAND_PUBLIC
      });

      if (registerError) {
        showError('Inscription échouée', registerError.message || 'Une erreur est survenue lors de l\'inscription');
        return;
      }

      if (user) {
        showSuccess('Inscription réussie', 'Vérifiez votre email pour confirmer votre compte');

        // Reset form
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          nomComplet: '',
          telephone: '',
          acceptTerms: false
        });
        setFieldErrors({});

        if (onSuccess) {
          onSuccess();
        }

        // Redirection
        setTimeout(() => {
          if (redirectUrl !== '/') {
            window.location.href = redirectUrl;
          }
        }, 2000);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      showError('Erreur', errorMsg);
    }
  };

  return (
    <div className={`${styles.registerForm} ${className}`}>
      <form onSubmit={handleSubmit}>
        {/* Full Name Input */}
        <div className={styles.formGroup}>
          <label htmlFor="nomComplet" className={styles.label}>
            Nom complet
          </label>
          <input
            id="nomComplet"
            type="text"
            name="nomComplet"
            value={formData.nomComplet}
            onChange={handleInputChange}
            placeholder="Jean Dupont"
            className={`${styles.input} ${fieldErrors.nomComplet ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.nomComplet && (
            <span className={styles.errorText}>{fieldErrors.nomComplet}</span>
          )}
        </div>

        {/* Email Input */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="votre@email.com"
            className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <span className={styles.errorText}>{fieldErrors.email}</span>
          )}
        </div>

        {/* Phone Input */}
        <div className={styles.formGroup}>
          <label htmlFor="telephone" className={styles.label}>
            Téléphone (optionnel)
          </label>
          <input
            id="telephone"
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleInputChange}
            placeholder="+33 6 12 34 56 78"
            className={`${styles.input} ${fieldErrors.telephone ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.telephone && (
            <span className={styles.errorText}>{fieldErrors.telephone}</span>
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
              disabled={isLoading}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.password && (
            <span className={styles.errorText}>{fieldErrors.password}</span>
          )}
          <PasswordStrengthIndicator password={formData.password} />
        </div>

        {/* Confirm Password Input */}
        <div className={styles.formGroup}>
          <div className={styles.labelRow}>
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirmer le mot de passe
            </label>
            <button
              type="button"
              className={styles.togglePassword}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
              aria-label={showConfirmPassword ? 'Masquer' : 'Afficher'}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
            disabled={isLoading}
          />
          {fieldErrors.confirmPassword && (
            <span className={styles.errorText}>{fieldErrors.confirmPassword}</span>
          )}
        </div>

        {/* Terms Checkbox */}
        <div className={styles.checkboxGroup}>
          <input
            id="acceptTerms"
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className={`${styles.checkbox} ${fieldErrors.acceptTerms ? styles.checkboxError : ''}`}
            disabled={isLoading}
          />
          <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
            J'accepte les conditions d'utilisation et la politique de confidentialité
          </label>
        </div>
        {fieldErrors.acceptTerms && (
          <span className={styles.errorText}>{fieldErrors.acceptTerms}</span>
        )}

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
              Inscription en cours...
            </>
          ) : (
            'S\'inscrire'
          )}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
