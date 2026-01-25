/**
 * =====================================================
 * RETROUVONSLES - Verify Email Page
 * Page d'attente de vérification d'email
 * L'utilisateur doit cliquer sur le lien reçu par email
 * =====================================================
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabaseAuthService } from '../../services/supabase/auth';

import styles from './VerifyEmailPage.module.css';

interface LocationState {
  email?: string;
}

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = (location.state as LocationState)?.email || '';

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Handle resend countdown
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (resendCountdown === 0 && !canResend) {
      setCanResend(true);
    }
    return undefined;
  }, [resendCountdown, canResend]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/auth/register');
    }
  }, [email, navigate]);

  // Resend verification email
  const handleResendEmail = useCallback(async () => {
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const result = await supabaseAuthService.resendVerificationEmail(email);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setMessage('Email de vérification renvoyé avec succès !');
      setCanResend(false);
      setResendCountdown(60);
    } catch (err: any) {
      console.error('Resend email error:', err);
      setError(err.message || 'Impossible de renvoyer l\'email. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        {/* Carte formulaire */}
        <div className={styles.formCard}>
          <div className={styles.iconContainer}>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </div>

          <h1 className={styles.title}>Vérifiez votre email</h1>
          
          <p className={styles.subtitle}>
            Nous avons envoyé un lien de confirmation à :
          </p>
          
          <p className={styles.emailHighlight}>{email}</p>

          <div className={styles.instructionBox}>
            <h3>📬 Que faire maintenant ?</h3>
            <ol className={styles.instructionList}>
              <li>Ouvrez votre boîte de réception</li>
              <li>Cherchez l'email de <strong>Retrouvons Les</strong></li>
              <li>Cliquez sur le lien de confirmation dans l'email</li>
              <li>Vous serez redirigé pour compléter votre profil</li>
            </ol>
          </div>

          {/* Success Message */}
          {message && (
            <div className={styles.successAlert}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={styles.errorAlert}>
              <span>{error}</span>
            </div>
          )}

          {/* Resend Email Button */}
          <div className={styles.resendSection}>
            <p className={styles.resendText}>
              Vous n'avez pas reçu l'email ?
            </p>
            <button
              onClick={handleResendEmail}
              disabled={!canResend || isLoading}
              className={styles.resendButton}
            >
              {isLoading ? (
                'Envoi en cours...'
              ) : canResend ? (
                'Renvoyer l\'email'
              ) : (
                `Renvoyer dans ${resendCountdown}s`
              )}
            </button>
          </div>

          {/* Footer links */}
          <div className={styles.footer}>
            <p className={styles.footerText}>
              Email incorrect ?{' '}
              <Link to="/auth/register" className={styles.link}>
                Modifier l'adresse
              </Link>
            </p>
            <p className={styles.footerText}>
              Déjà vérifié ?{' '}
              <Link to="/auth/login" className={styles.link}>
                Se connecter
              </Link>
            </p>
          </div>

          {/* Spam notice */}
          <div className={styles.spamNotice}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <span>
              Vérifiez votre dossier spam si vous ne trouvez pas l'email
            </span>
          </div>
        </div>

        {/* Carte bleue */}
        <div className={styles.blueCard}>
          <div className={styles.badge}>Presque terminé !</div>
          <h2 className={styles.blueTitle}>Plus qu'une étape</h2>
          <p className={styles.blueText}>
            Confirmez votre email pour activer votre compte et rejoindre la communauté.
          </p>
          <ul className={styles.features}>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Sécurité renforcée
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Notifications personnalisées
            </li>
            <li>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Accès complet aux fonctionnalités
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
