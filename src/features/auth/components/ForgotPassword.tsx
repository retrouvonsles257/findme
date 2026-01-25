/**
 * =====================================================
 * ForgotPassword Component
 * Composant pour demander la réinitialisation du mot de passe
 * =====================================================
 */

import React, { useState } from 'react';
import { useNotification } from '../../../contexts';
import { usePasswordReset } from '../hooks';
import styles from './ForgotPassword.module.css';

export interface ForgotPasswordProps {
  onSuccess?: () => void;
  onBackClick?: () => void;
  className?: string;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({
  onSuccess,
  onBackClick,
  className = ''
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const notification = useNotification();
  const { requestPasswordReset, isLoading, error } = usePasswordReset();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email requis';
    } else if (!validateEmail(email)) {
      errors.email = 'Email invalide';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      const { error: resetError } = await requestPasswordReset(email);

      if (resetError) {
        showError('Erreur', resetError.message || 'Impossible d\'envoyer l\'email de réinitialisation');
        return;
      }

      setIsSubmitted(true);
      showSuccess('Email envoyé', 'Vérifiez votre email pour les instructions de réinitialisation');

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      showError('Erreur', errorMsg);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`${styles.forgotPassword} ${className}`}>
        <div className={styles.successMessage}>
          <div className={styles.successIcon}>✓</div>
          <h2>Email envoyé avec succès</h2>
          <p>
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>
          </p>
          <p className={styles.instructions}>
            Vérifiez votre dossier spam si vous ne recevez pas l'email.
          </p>
          <button
            onClick={() => {
              setEmail('');
              setIsSubmitted(false);
              onBackClick?.();
            }}
            className={styles.backButton}
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.forgotPassword} ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={styles.header}>
          <h2>Réinitialiser le mot de passe</h2>
          <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

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
                setFieldErrors({});
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

        {/* Global Error */}
        {error && (
          <div className={styles.errorAlert}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>{error.message}</span>
          </div>
        )}

        {/* Buttons */}
        <div className={styles.buttonGroup}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Envoi en cours...
              </>
            ) : (
              'Envoyer le lien'
            )}
          </button>
          <button
            type="button"
            onClick={onBackClick}
            className={styles.cancelButton}
            disabled={isLoading}
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
