/**
 * =====================================================
 * RETROUVONSLES - Login Page
 * Page de connexion - Authentification utilisateur
 * =====================================================
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '../../store/types';
import { loginThunk, signInAnonymousThunk } from '../../features/auth/store/authThunks';
import { useI18n } from '../../hooks';
import { LoginCredentials } from '../../@types/auth.types';
import styles from './LoginPage.module.css';
import { getDashboardPathAfterLogin } from '../../services/supabase/auth';
import { safeCitizenNextPath } from '../../utils/safeCitizenNext';
import {
  canAttemptAnonymousSignIn,
  markAnonymousSignInSuccess,
} from '../../utils/anonymousSignInRateLimit';

interface LoginError {
  email?: string;
  password?: string;
  general?: string;
}

interface LocationState {
  message?: string;
  email?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { tNamespace, t } = useI18n();
  const anonAnchorRef = useRef<HTMLDivElement | null>(null);

  /** `?next=` uniquement si présent et déjà limité à `/citizen/…` (sinon on suit le rôle — évite d’envoyer admin/autorité vers /citizen/dashboard). */
  const citizenDeepLinkFromQuery = useMemo(() => {
    const raw = searchParams.get('next');
    if (!raw?.trim()) return null;
    const safe = safeCitizenNextPath(raw, '__invalid__');
    return safe.startsWith('/citizen/') ? safe : null;
  }, [searchParams]);
  
  // Get success message from location state
  const locationState = location.state as LocationState | null;
  const successMessage = locationState?.message;
  const prefillEmail = locationState?.email;

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: prefillEmail || '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginError>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(!!successMessage);

  // Hide success message after 5 seconds
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
    return undefined; // Retour explicite pour tous les chemins
  }, [showSuccessMessage]);

  useEffect(() => {
    if (searchParams.get('anon') === '1' && anonAnchorRef.current) {
      anonAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchParams]);

  const validateForm = useCallback((): boolean => {
    const newErrors: LoginError = {};

    if (!credentials.email.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!credentials.password) {
      newErrors.password = 'Mot de passe requis';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [credentials]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.currentTarget;
      setCredentials((prev) => ({
        ...prev,
        [name]: value,
      }));
      if (errors[name as keyof LoginError]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    },
    [errors]
  );

  const handleLogin = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      // Empêcher les soumissions multiples
      if (isLoading) {
        console.log('[LoginPage] Already logging in, ignoring duplicate submission');
        return;
      }

      if (!validateForm()) {
        return;
      }

      setIsLoading(true);
      setErrors({});

      try {
        const result = (await dispatch(loginThunk(credentials))) as any;
        console.log('[LoginPage] Login result:', result);
        console.log('[LoginPage] Result type:', result?.type);
        console.log('[LoginPage] Result payload:', result?.payload);
        
        if (!result?.type?.endsWith('/fulfilled')) {
          throw result?.payload || new Error('Connexion échouée');
        }

        // Redirection immédiate après succès du login
        const userRole = result.payload?.user?.role as string | undefined;
        console.log('[LoginPage] User role from payload:', userRole);
        console.log('[LoginPage] Full payload user:', result.payload?.user);

        const orgId = result.payload?.user?.organisation_id ?? null;
        const dashboardUrl = getDashboardPathAfterLogin(userRole || 'citoyen', orgId);
        const target = citizenDeepLinkFromQuery ?? dashboardUrl;
        console.log('[LoginPage] Dashboard URL:', dashboardUrl);
        console.log('[LoginPage] About to navigate to:', target);

        // Attendre un court instant pour que Redux termine la mise à jour
        setTimeout(() => {
          console.log('[LoginPage] Navigating now to:', target);
          navigate(target, { replace: true });
        }, 100);
      } catch (error: any) {
        console.error('[LoginPage] Login error:', error);
        setErrors({
          general: error.message || 'Connexion échouée. Vérifiez vos identifiants.',
        });
        setIsLoading(false); // Réactiver le bouton en cas d'erreur
      }
      // Note: Ne pas mettre setIsLoading(false) ici en cas de succès
      // pour éviter que l'utilisateur ne puisse cliquer à nouveau
    },
    [validateForm, credentials, dispatch, isLoading, navigate, citizenDeepLinkFromQuery]
  );

  const handleContinueWithoutAccount = useCallback(async () => {
    if (isLoading) return;
    const gate = canAttemptAnonymousSignIn();
    if (!gate.ok) {
      const sec = Math.ceil(gate.retryAfterMs / 1000);
      setErrors({
        general: t('public.contribute.rate_limited', { count: sec }),
      });
      return;
    }
    setIsLoading(true);
    setErrors({});
    try {
      const result = (await dispatch(signInAnonymousThunk())) as any;
      if (!result?.type?.endsWith('/fulfilled')) {
        throw result?.payload || new Error('Connexion sans compte impossible');
      }
      markAnonymousSignInSuccess();
      const userRole = result.payload?.user?.role as string | undefined;
      const orgId = result.payload?.user?.organisation_id ?? null;
      const dashboardUrl = getDashboardPathAfterLogin(userRole || 'citoyen', orgId);
      const target = citizenDeepLinkFromQuery ?? dashboardUrl;
      setTimeout(() => {
        navigate(target, { replace: true });
      }, 100);
    } catch (error: any) {
      setErrors({
        general: error?.message || 'Connexion sans compte impossible. Réessayez plus tard.',
      });
      setIsLoading(false);
    }
  }, [dispatch, isLoading, navigate, citizenDeepLinkFromQuery, t]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Carte formulaire */}
        <div className={styles.formCard}>
          <h1 className={styles.title}>Connexion</h1>
          <p className={styles.subtitle}>
            Connectez-vous pour continuer les recherches et aider la communauté.
          </p>

          <form onSubmit={handleLogin} className={styles.form}>
            {/* Success message from redirect */}
            {showSuccessMessage && successMessage && (
              <div className={styles.successAlert}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>
                  {successMessage === 'profile_completed' && 'Profil complété avec succès ! Vous pouvez maintenant vous connecter.'}
                  {successMessage === 'email_verified' && 'Email vérifié avec succès ! Vous pouvez maintenant vous connecter.'}
                  {successMessage === 'password_reset' && 'Mot de passe réinitialisé ! Vous pouvez maintenant vous connecter.'}
                </span>
              </div>
            )}

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
                  value={credentials.email}
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
              <div className={styles.labelRow}>
                <label htmlFor="password" className={styles.label}>
                  Mot de passe
                </label>
                <Link to="/auth/forgot-password" className={styles.forgotLink}>
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
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

            {/* Bouton connexion */}
            <button type="submit" disabled={isLoading} className={styles.submitButton}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
              </svg>
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>

            <div ref={anonAnchorRef} />
            <button
              type="button"
              disabled={isLoading}
              className={styles.secondaryButton}
              onClick={handleContinueWithoutAccount}
            >
              {tNamespace('auth', 'auth.login.continue_without_account', 'Continuer sans créer de compte')}
            </button>
            <p className={styles.anonHint}>
              {tNamespace(
                'auth',
                'auth.login.continue_without_account_hint',
                'Vous pourrez enregistrer un e-mail et un mot de passe plus tard pour conserver vos données.',
              )}
            </p>

            {/* Divider */}
            <div className={styles.divider}>
              <span>Ou continuer avec</span>
            </div>

            {/* Boutons OAuth */}
            <div className={styles.oauthButtons}>
              <button type="button" className={styles.oauthButton} disabled={isLoading}>
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
                  <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" />
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
                </svg>
                Google
              </button>
              <button type="button" className={styles.oauthButton} disabled={isLoading}>
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
              Pas encore de compte ? <Link to="/auth/register" className={styles.link}>Créer un compte</Link>
            </p>
          </div>
        </div>

        {/* Carte bleue */}
        <div className={styles.blueCard}>
          <div className={styles.badge}>Réseau Actif</div>
          <h2 className={styles.blueTitle}>Ensemble, ne laissons personne derrière.</h2>
          <p className={styles.blueText}>
            Rejoignez le réseau national de recherche et contribuez à redonner espoir aux familles. 
            Chaque minute compte, chaque contribution peut sauver une vie.
          </p>
        </div>
      </div>
    </div>
  );
};