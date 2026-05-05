/**
 * =====================================================
 * RETROUVONSLES - Auth Callback Page
 * Traitement du callback OAuth et confirmation email
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  supabaseAuthService,
  getUserAccountStatus,
  getDashboardPathAfterLogin,
  normalizeAppRole,
  pickOrganisationIdFromJwt,
} from '../../services/supabase/auth';

import styles from './VerifyEmailPage.module.css'; // Réutiliser le style

export const AuthCallbackPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Vérification de votre connexion...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const processAuthCallback = async () => {
      try {
        setStatusMessage('Vérification de votre session...');
        
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const source = searchParams.get('source');

        if (errorParam) {
          console.error('OAuth error:', errorParam, errorDescription);
          setError(`Erreur d'authentification: ${errorDescription || errorParam}`);
          setTimeout(() => navigate('/auth/register'), 3000);
          return;
        }

        if (code || source) {
          await handleOAuthReturn(source);
          return;
        }

        // Confirmation email
        await handleEmailConfirmation();
        
      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Une erreur est survenue lors de l\'authentification');
        setTimeout(() => navigate('/auth/register'), 3000);
      } finally {
        setLoading(false);
      }
    };

    processAuthCallback();
  }, [navigate, searchParams]);

  const handleOAuthReturn = async (source: string | null) => {
    try {
      setStatusMessage('Traitement de votre connexion OAuth...');
      
      const result = await supabaseAuthService.handleOAuthCallback();
      
      console.log('OAuth result:', result);
      
      if (result.success) {
        // Profil incomplet - rediriger vers complete-profile
        if (result.needsProfileCompletion || result.redirect === '/auth/complete-profile') {
          setStatusMessage('Bienvenue ! Veuillez compléter votre profil...');
          setTimeout(() => {
            navigate('/auth/complete-profile', { 
              state: { 
                source: source,
                email: result.user?.email 
              }
            });
          }, 1500);
          return;
        }
        
        if (result.user?.id) {
          const status = await getUserAccountStatus(result.user.id);
          console.log('Account status:', status);
          
          if (status === 'en_attente_verification') {
            setStatusMessage('Votre compte est en attente de validation...');
            setTimeout(() => navigate('/auth/verify-email'), 1500);
            return;
          }
          
          if (status === 'suspendu' || status === 'bloque') {
            setError('Votre compte est suspendu. Contactez l\'administrateur.');
            setTimeout(() => navigate('/auth/login'), 3000);
            return;
          }
          
          const userRole = normalizeAppRole(result.role || 'citoyen');
          const orgId =
            (result.profile as { id_organisation?: string } | null)?.id_organisation ??
            pickOrganisationIdFromJwt(result.user as any) ??
            null;
          console.log('User role:', userRole, 'org:', orgId);

          setStatusMessage(`Bienvenue ${result.profile?.prenom || result.user.email}! Redirection...`);

          const redirectPath = getDashboardPathAfterLogin(userRole, orgId);
          console.log('Redirecting to:', redirectPath);
          
          setTimeout(() => {
            navigate(redirectPath);
          }, 1500);
          return;
        }
        
        if (result.emailSent) {
          setStatusMessage('Inscription réussie ! Veuillez vérifier votre email.');
          setTimeout(() => {
            navigate('/auth/login', { 
              state: { 
                message: 'email_sent',
                email: result.user?.email 
              }
            });
          }, 2000);
          return;
        }
      } else {
        setError(result.error || 'Erreur lors de la connexion avec le fournisseur OAuth');
        setTimeout(() => navigate('/auth/register'), 3000);
      }
    } catch (err) {
      console.error('OAuth processing error:', err);
      setError('Erreur lors du traitement OAuth');
      setTimeout(() => navigate('/auth/register'), 3000);
    }
  };

  const handleEmailConfirmation = async () => {
    try {
      setStatusMessage('Vérification de votre email...');
      
      const result = await supabaseAuthService.handleOAuthCallback();
      
      if (result.success && result.user) {
        console.log('Email confirmation result:', result);
        
        // Vérifier si le profil est complet
        if (result.needsProfileCompletion || result.redirect === '/auth/complete-profile') {
          setStatusMessage('Email vérifié ! Veuillez compléter votre profil...');
          setTimeout(() => {
            navigate('/auth/complete-profile', {
              state: {
                email: result.user?.email,
                fromEmailConfirmation: true
              }
            });
          }, 1500);
          return;
        }
        
        // Profil complet - rediriger vers login
        setStatusMessage('Email vérifié ! Vous pouvez maintenant vous connecter...');
        setTimeout(() => {
          navigate('/auth/login', {
            state: {
              message: 'email_verified',
              email: result.user?.email
            }
          });
        }, 2000);
      } else {
        setStatusMessage('Session non trouvée, redirection vers la connexion...');
        setTimeout(() => navigate('/auth/login'), 2000);
      }
    } catch (err) {
      console.error('Email confirmation error:', err);
      setError('Erreur lors de la vérification de l\'email');
      setTimeout(() => navigate('/auth/login'), 3000);
    }
  };

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <h2 className={styles.title}>{statusMessage}</h2>
              <p className={styles.subtitle}>
                Veuillez patienter pendant que nous vérifions vos informations.
              </p>
            </div>
          </div>

          <div className={styles.blueCard}>
            <div className={styles.badge}>Authentification</div>
            <h2 className={styles.blueTitle}>Bienvenue sur Retrouvons-Les</h2>
            <p className={styles.blueText}>
              Nous vérifions votre identité pour sécuriser votre accès à la plateforme.
            </p>
            <ul className={styles.features}>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Connexion sécurisée
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Protection des données
              </li>
              <li>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16.667 5L7.5 14.167 3.333 10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Accès personnalisé
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.container}>
          <div className={styles.formCard}>
            <div className={styles.errorContainer}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <h2 className={styles.title}>Erreur d'authentification</h2>
              <p className={styles.errorMessage}>{error}</p>
              <p className={styles.subtitle}>Redirection en cours...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
