/**
 * =====================================================
 * PasswordStrengthIndicator Component
 * Indicateur de force du mot de passe
 * =====================================================
 */

import React, { useMemo } from 'react';
import styles from './PasswordStrengthIndicator.module.css';

export interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
  };
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  className = ''
}) => {
  const strength = useMemo<PasswordStrength>(() => {
    if (!password) {
      return {
        score: 0,
        label: '',
        color: '#e5e7eb',
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false
        }
      };
    }

    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=[\]{}';:"\\|,.<>/?]/.test(password)
    };

    const metRequirements = Object.values(requirements).filter(Boolean).length;

    let score: number;
    let label: string;
    let color: string;

    if (metRequirements === 0) {
      score = 0;
      label = '';
      color = '#e5e7eb';
    } else if (metRequirements === 1) {
      score = 1;
      label = 'Très faible';
      color = '#ef4444';
    } else if (metRequirements === 2) {
      score = 2;
      label = 'Faible';
      color = '#f97316';
    } else if (metRequirements === 3) {
      score = 3;
      label = 'Moyen';
      color = '#eab308';
    } else if (metRequirements === 4) {
      score = 4;
      label = 'Bon';
      color = '#22c55e';
    } else {
      score = 5;
      label = 'Très bon';
      color = '#10b981';
    }

    return {
      score,
      label,
      color,
      requirements
    };
  }, [password]);

  if (!password) {
    return null;
  }

  return (
    <div className={`${styles.strengthIndicator} ${className}`}>
      {/* Strength Bar */}
      <div className={styles.barContainer}>
        {[1, 2, 3, 4, 5].map(level => (
          <div
            key={level}
            className={`${styles.bar} ${level <= strength.score ? styles.active : ''}`}
            style={{
              backgroundColor: level <= strength.score ? strength.color : '#e5e7eb'
            }}
          />
        ))}
      </div>

      {/* Strength Label */}
      {strength.label && (
        <span className={styles.label} style={{ color: strength.color }}>
          {strength.label}
        </span>
      )}

      {/* Requirements Checklist */}
      {strength.score > 0 && (
        <div className={styles.requirements}>
          <div className={`${styles.requirement} ${strength.requirements.minLength ? styles.met : ''}`}>
            <span className={styles.icon}>{strength.requirements.minLength ? '✓' : '○'}</span>
            <span>Au moins 8 caractères</span>
          </div>
          <div className={`${styles.requirement} ${strength.requirements.hasUppercase ? styles.met : ''}`}>
            <span className={styles.icon}>{strength.requirements.hasUppercase ? '✓' : '○'}</span>
            <span>Au moins une majuscule</span>
          </div>
          <div className={`${styles.requirement} ${strength.requirements.hasLowercase ? styles.met : ''}`}>
            <span className={styles.icon}>{strength.requirements.hasLowercase ? '✓' : '○'}</span>
            <span>Au moins une minuscule</span>
          </div>
          <div className={`${styles.requirement} ${strength.requirements.hasNumbers ? styles.met : ''}`}>
            <span className={styles.icon}>{strength.requirements.hasNumbers ? '✓' : '○'}</span>
            <span>Au moins un chiffre</span>
          </div>
          <div className={`${styles.requirement} ${strength.requirements.hasSpecialChars ? styles.met : ''}`}>
            <span className={styles.icon}>{strength.requirements.hasSpecialChars ? '✓' : '○'}</span>
            <span>Au moins un caractère spécial</span>
          </div>
        </div>
      )}
    </div>
  );
};
