/**
 * =====================================================
 * RETROUVONSLES - SocialLogin Component
 * Connexion via fournisseurs d'identité (OAuth)
 * =====================================================
 */

import React, { useState } from 'react';
import { useNotification } from '../../../contexts';
import styles from './LoginForm.module.css';

export interface SocialLoginProps {
  onSuccess?: () => void;
  className?: string;
}

interface SocialProvider {
  id: 'google' | 'github' | 'microsoft';
  name: string;
  icon: string;
  color: string;
}

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔍',
    color: '#4285F4'
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: '🐙',
    color: '#333333'
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    icon: '🪟',
    color: '#00A4EF'
  }
];

const SocialLogin: React.FC<SocialLoginProps> = ({ className = '' }) => {
  const notification = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'github' | 'microsoft') => {
    setIsLoading(true);
    setSelectedProvider(provider);

    try {
      // Note: Supabase OAuth setup required
      // This is a placeholder for the actual OAuth implementation
      // In production, you would call:
      // const { error } = await supabase.auth.signInWithOAuth({
      //   provider: provider,
      //   options: {
      //     redirectTo: `${window.location.origin}/auth/callback`,
      //   },
      // });

      notification.addNotification({
        title: 'Non configuré',
        message: `La connexion avec ${provider} n'est pas encore configurée. Veuillez utiliser email/mot de passe.`,
        type: 'info'
      });

      setIsLoading(false);
      setSelectedProvider(null);
    } catch (err) {
      notification.addNotification({
        title: 'Erreur de connexion',
        message: err instanceof Error ? err.message : 'Une erreur est survenue',
        type: 'error'
      });
      setIsLoading(false);
      setSelectedProvider(null);
    }
  };

  return (
    <div className={`${styles.socialContainer} ${className}`}>
      <div className={styles.dividerContainer}>
        <div className={styles.divider}></div>
        <span className={styles.dividerText}>Ou connectez-vous avec</span>
        <div className={styles.divider}></div>
      </div>

      <div className={styles.socialButtons}>
        {socialProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => handleSocialLogin(provider.id)}
            disabled={isLoading}
            className={styles.socialButton}
            style={
              {
                '--provider-color': provider.color
              } as React.CSSProperties
            }
            title={`Se connecter avec ${provider.name}`}
            type="button"
          >
            <span className={styles.socialIcon}>{provider.icon}</span>
            <span className={styles.socialLabel}>{provider.name}</span>
            {isLoading && selectedProvider === provider.id && (
              <span className={styles.spinner}></span>
            )}
          </button>
        ))}
      </div>

      <p className={styles.socialInfo}>
        Les connexions sociales vous permettent de créer un compte rapidement
        sans renseigner tous vos détails.
      </p>
    </div>
  );
};

export default SocialLogin;
