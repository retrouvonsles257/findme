/**
 * =====================================================
 * RETROUVONSLES - Reset Password Page
 * Page de réinitialisation du mot de passe avec token
 * =====================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAppDispatch } from '../../store/types';
import { AuthLayout } from '../../components/layout';
import { useI18n } from '../../hooks';
import { resetPasswordThunk } from '../../features/auth/store/authThunks';
import { PasswordResetConfirm } from '../../@types/auth.types';

import styles from './ResetPasswordPage.module.css';

interface ResetPasswordError {
  password?: string;
  passwordConfirm?: string;
  token?: string;
  general?: string;
}

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const [formData, setFormData] = useState<PasswordResetConfirm & { passwordConfirm?: string }>({
    token: token || '',
    new_password: '',
    passwordConfirm: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordError>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setErrors({
        token: t('auth.invalid_reset_link', 'Invalid or expired reset link. Please try again.'),
      });
    }
  }, [token, t]);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: ResetPasswordError = {};

    if (!token) {
      newErrors.token = t('auth.invalid_reset_link', 'Invalid or expired reset link');
    }

    // Password validation
    if (!formData.new_password) {
      newErrors.password = t('validation.password_required', 'Password is required');
    } else if (formData.new_password.length < 8) {
      newErrors.password = t(
        'validation.password_min_length',
        'Password must be at least 8 characters'
      );
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.new_password)) {
      newErrors.password = t(
        'validation.password_strength',
        'Password must contain uppercase, lowercase, and numbers'
      );
    }

    // Password confirmation validation
    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = t(
        'validation.password_confirm_required',
        'Password confirmation is required'
      );
    } else if (formData.new_password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = t('validation.password_mismatch', 'Passwords do not match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, token, t]);

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.currentTarget;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field
      if (errors[name as keyof ResetPasswordError]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  // Handle password reset
  const handleResetPassword = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        // Dispatcher Supabase password reset
        const resetData: PasswordResetConfirm = {
          token: formData.token,
          new_password: formData.new_password,
        };

        const result = (await dispatch(resetPasswordThunk(resetData))) as any;
        if (!result?.type?.endsWith('/fulfilled')) {
          throw result?.payload || new Error('Password reset failed');
        }

        console.log('Password reset with token:', formData.token);

        // Show success message
        setIsSuccess(true);
      } catch (error: any) {
        console.error('Password reset error:', error);
        setErrors({
          general: error.message || t(
            'auth.reset_failed',
            'Failed to reset your password. Please try again or request a new reset link.'
          ),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, formData, t, dispatch]
  );

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout
        title={t('auth.password_reset_success', 'Password Reset Successfully')}
        subtitle={t('auth.password_reset_complete', 'Your password has been changed')}
      >
        <div className={styles.container}>
          <div className={styles.successMessage}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successText}>
              {t(
                'auth.password_reset_message',
                'Your password has been successfully reset. You can now log in with your new password.'
              )}
            </p>

            <button
              onClick={() => navigate('/auth/login')}
              className={styles.primaryButton}
            >
              {t('auth.return_to_login', 'Return to Login')}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Invalid token state
  if (!token && errors.token) {
    return (
      <AuthLayout
        title={t('auth.invalid_link', 'Invalid Link')}
        subtitle={t('auth.reset_link_expired', 'Reset link has expired')}
      >
        <div className={styles.container}>
          <div className={styles.errorMessage}>
            <div className={styles.errorIcon}>✕</div>
            <p className={styles.errorText}>
              {t(
                'auth.reset_link_invalid_message',
                'The password reset link is invalid or has expired. Please request a new one.'
              )}
            </p>

            <div className={styles.actions}>
              <button
                onClick={() => navigate('/auth/forgot-password')}
                className={styles.primaryButton}
              >
                {t('auth.request_new_link', 'Request New Link')}
              </button>
              <button
                onClick={() => navigate('/auth/login')}
                className={styles.secondaryButton}
              >
                {t('auth.back_to_login', 'Back to Login')}
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Form state
  return (
    <AuthLayout
      title={t('auth.reset_password_title', 'Create New Password')}
      subtitle={t('auth.reset_password_subtitle', 'Please enter your new password')}
    >
      <div className={styles.container}>
        <form onSubmit={handleResetPassword} className={styles.form}>
          {/* General Error Message */}
          {errors.general && (
            <div className={styles.errorAlert}>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Password Field */}
          <div className={styles.formGroup}>
            <label htmlFor="new_password" className={styles.label}>
              {t('auth.new_password', 'New Password')}
            </label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="new_password"
                name="new_password"
                value={formData.new_password}
                onChange={handleInputChange}
                placeholder={t('common.password_placeholder', 'Enter your password')}
                className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                disabled={isLoading}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.showPasswordButton}
                disabled={isLoading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <span className={styles.fieldError}>{errors.password}</span>
            )}
            <p className={styles.hint}>
              {t(
                'auth.password_requirements',
                'At least 8 characters with uppercase, lowercase, and numbers'
              )}
            </p>
          </div>

          {/* Password Confirmation Field */}
          <div className={styles.formGroup}>
            <label htmlFor="passwordConfirm" className={styles.label}>
              {t('auth.confirm_new_password', 'Confirm New Password')}
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm || ''}
              onChange={handleInputChange}
              placeholder={t('common.password_placeholder', 'Confirm your password')}
              className={`${styles.input} ${errors.passwordConfirm ? styles.inputError : ''}`}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {errors.passwordConfirm && (
              <span className={styles.fieldError}>{errors.passwordConfirm}</span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading
              ? t('common.loading', 'Loading...')
              : t('auth.reset_password', 'Reset Password')}
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
