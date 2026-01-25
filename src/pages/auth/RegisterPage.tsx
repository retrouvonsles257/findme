/**
 * =====================================================
 * RETROUVONSLES - Register Page
 * Page d'inscription - Création de compte utilisateur
 * =====================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../../store/types';
import { useI18n } from '../../hooks';
import { selectCurrentUser } from '../../features/users/store/userSelectors';
import { supabaseAuthService } from '../../services/supabase/auth';

import styles from './RegisterPage.module.css';

interface RegisterError {
  email?: string;
  password?: string;
  passwordConfirm?: string;
  general?: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const currentUser = useAppSelector(selectCurrentUser);

  useEffect(() => {
    if (currentUser) {
      navigate('/citizen/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterError>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = useCallback((): boolean => {
    const newErrors: RegisterError = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Confirmation du mot de passe requise';
    } else if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.currentTarget;

      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name as keyof RegisterError]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const handleRegister = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        console.log('=== INSCRIPTION CITOYEN ===');
        console.log('Email:', formData.email);
        
        // Appeler directement le service d'auth (comme inscription.js)
        const result = await supabaseAuthService.register({
          email: formData.email,
          password: formData.password,
        });

        if (result.error) {
          console.error('Erreur inscription:', result.error);
          throw new Error(result.error.message);
        }

        if (!result.data?.user) {
          throw new Error('Erreur lors de la création du compte');
        }

        console.log('✓ Inscription réussie pour:', formData.email);
        
        // Redirect to verify email page
        navigate('/auth/verify-email', {
          state: { email: formData.email },
          replace: true,
        });
      } catch (error: any) {
        console.error('[RegisterPage] Registration error:', error);
        setErrors({
          general: error?.message || 'Inscription échouée. Veuillez réessayer.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [validateForm, formData, navigate]
  );

  const handleOAuthSignup = useCallback(
    async (provider: 'google' | 'facebook') => {
      setIsLoading(true);
      setErrors({});

      try {
        const result = await supabaseAuthService.handleOAuthSignup(provider);
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        // Supabase will redirect automatically
      } catch (error: any) {
        console.error('OAuth signup error:', error);
        setErrors({
          general: error?.message || `Erreur lors de l'inscription avec ${provider}. Veuillez réessayer.`,
        });
        setIsLoading(false);
      }
    },
    []
  );

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Carte formulaire */}
        <div className={styles.formCard}>
          <h1 className={styles.title}>Créer un compte</h1>
          <p className={styles.subtitle}>
            Rejoignez le réseau national Retrouvons Les et contribuez à redonner espoir aux familles.
          </p>

          <form onSubmit={handleRegister} className={styles.form}>
            {errors.general && (
              <div className={styles.errorAlert}>
                <span>{errors.general}</span>
              </div>
            )}

            {/* Email */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                Adresse e-mail
              </label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="exemple@email.com"
                  className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            {/* Mot de passe */}
            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                Mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="•••••••• (minimum 8 caractères)"
                  className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>

            {/* Confirmation Mot de passe */}
            <div className={styles.formGroup}>
              <label htmlFor="passwordConfirm" className={styles.label}>
                Confirmer le mot de passe
              </label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="passwordConfirm"
                  name="passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={handleInputChange}
                  placeholder="Confirmer votre mot de passe"
                  className={`${styles.input} ${errors.passwordConfirm ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
              </div>
              {errors.passwordConfirm && <span className={styles.fieldError}>{errors.passwordConfirm}</span>}
            </div>

            {/* Exigences du mot de passe */}
            <div className={styles.passwordHints}>
              <div className={styles.hint}>
                <span className={formData.password.length >= 8 ? styles.valid : ''}>✓</span>
                Au moins 8 caractères
              </div>
              <div className={styles.hint}>
                <span className={/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? styles.valid : ''}>✓</span>
                Lettres et chiffres
              </div>
              <div className={styles.hint}>
                <span className={formData.password ? styles.valid : ''}>✓</span>
                Sécurité et crypté
              </div>
            </div>

            {/* Bouton créer compte */}
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6M23 11h-6" />
              </svg>
              {isLoading ? 'Chargement...' : 'Créer mon compte'}
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              <span>Ou s'inscrire avec</span>
            </div>

            {/* Boutons OAuth */}
            <div className={styles.oauthButtons}>
              <button 
                type="button" 
                className={styles.oauthButton}
                onClick={() => handleOAuthSignup('google')}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Google
              </button>
              <button 
                type="button" 
                className={styles.oauthButton}
                onClick={() => handleOAuthSignup('facebook')}
                disabled={isLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className={styles.footer}>
            <p>
              Déjà un compte ? <Link to="/auth/login" className={styles.link}>Se connecter</Link>
            </p>
            <p className={styles.terms}>
              En créant un compte, vous acceptez nos{' '}
              <Link to="/terms" className={styles.link}>Conditions d'utilisation</Link> et notre{' '}
              <Link to="/privacy" className={styles.link}>Politique de confidentialité</Link>
            </p>
          </div>
        </div>

        {/* Carte bleue */}
        <div className={styles.blueCard}>
          <div className={styles.badge}>Solidarité Nationale</div>
          <h2 className={styles.blueTitle}>Chaque paire d'yeux compte.</h2>
          <p className={styles.blueText}>
            Rejoignez des milliers de citoyens engagés dans la recherche de personnes disparues.
          </p>
          <ul className={styles.features}>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Alertes locales en temps réel
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Contribuez aux recherches
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Protection des données garantie
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};