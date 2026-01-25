/**
 * =====================================================
 * RETROUVONSLES - Forgot Password Page
 * Page de réinitialisation de mot de passe
 * =====================================================
 */

import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/types';
import { AuthLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { requestPasswordResetThunk } from '../../features/auth/store/authThunks';

import styles from './ForgotPasswordPage.module.css';

interface ForgotPasswordError {
  email?: string;
  general?: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ForgotPasswordError>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: ForgotPasswordError = {};

    if (!email.trim()) {
      newErrors.email = t('validation.email_required', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('validation.email_invalid', 'Invalid email format');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, t]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.currentTarget;
      setEmail(value);

      // Clear error
      if (errors.email) {
        setErrors((prev) => ({
          ...prev,
          email: undefined,
        }));
      }
    },
    [errors.email]
  );

  // Handle password reset request
  const handleRequestReset = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        // Dispatch Supabase password reset request
        const result = (await dispatch(requestPasswordResetThunk({ email }))) as any;
        if (result?.type?.endsWith('/fulfilled')) {
          console.log('Password reset requested for:', email);
          // Show success message
          setIsSubmitted(true);
        } else {
          throw result?.payload || new Error('Failed to send reset email');
        }
      } catch (error: any) {
        console.error('Password reset request error:', error);
        setErrors({
          general: error.message || t(
            'auth.reset_request_failed',
            'Failed to process your request. Please try again or contact support.'
          ),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, email, t, dispatch]
  );

  // Success state
  if (isSubmitted) {
    return (
      <AuthLayout
        title={t('auth.check_email', 'Check Your Email')}
        subtitle={t('auth.reset_email_sent', 'Password reset instructions sent')}
      >
        <div className={styles.container}>
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successText}>
              {t(
                'auth.reset_email_instruction',
                'We have sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.'
              )}
            </p>
            <p className={styles.emailInfo}>
              {t('auth.email_sent_to', 'Email sent to')}: <strong>{email}</strong>
            </p>

            <div className={styles.actions}>
              <button
                onClick={() => setIsSubmitted(false)}
                className={styles.secondaryButton}
              >
                {t('common.back', 'Back')}
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className={styles.primaryButton}
              >
                {t('auth.return_to_login', 'Return to Login')}
              </button>
            </div>

            <p className={styles.hint}>
              {t('auth.not_received_email', "Didn't receive the email?")}{' '}
              <button
                onClick={() => setIsSubmitted(false)}
                className={styles.resendLink}
              >
                {t('auth.try_again', 'Try again')}
              </button>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Form state
  return (
    <AuthLayout
      title={t('auth.forgot_password_title', 'Reset Password')}
      subtitle={t(
        'auth.forgot_password_subtitle',
        "Don't worry, we'll help you get back to your account"
      )}
    >
      <div className={styles.container}>
        <form onSubmit={handleRequestReset} className={styles.form}>
          {/* General Error Message */}
          {errors.general && (
            <div className={styles.errorAlert}>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Email Field */}
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              {t('common.email', 'Email')}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleInputChange}
              placeholder={t('common.email_placeholder', 'Enter your email')}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
              autoComplete="email"
            />
            {errors.email && (
              <span className={styles.fieldError}>{errors.email}</span>
            )}
          </div>

          {/* Info Text */}
          <p className={styles.infoText}>
            {t(
              'auth.reset_instructions',
              'Enter the email address associated with your account and we will send you instructions to reset your password.'
            )}
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading
              ? t('common.loading', 'Loading...')
              : t('auth.send_reset_email', 'Send Reset Email')}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className={styles.footer}>
          <p>
            <Link to="/auth/login" className={styles.backLink}>
              {t('auth.back_to_login', 'Back to Login')}
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};
