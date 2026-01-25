/**
 * =====================================================
 * RETROUVONSLES - VerifyEmail Component
 * Vérification d'email avec code OTP
 * =====================================================
 */

import React, { useState, useRef } from 'react';
import { useEmailVerification } from '../hooks';
import styles from './VerifyEmail.module.css';

export interface VerifyEmailProps {
  email: string;
  onSuccess?: () => void;
  onBack?: () => void;
  className?: string;
}

const VerifyEmail: React.FC<VerifyEmailProps> = ({ email, onSuccess, onBack, className = '' }) => {
  const { verifyEmail, resendVerificationEmail, isLoading, error } = useEmailVerification();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      const { success } = await verifyEmail(fullCode);
      if (success) {
        onSuccess?.();
      }
    }
  };

  const handleResend = async () => {
    const { error: resendError } = await resendVerificationEmail(email);
    if (!resendError) {
      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <h1 className={styles.title}>Vérifier votre email</h1>
      <p className={styles.subtitle}>Entrez le code de six chiffres envoyé à {email}</p>

      {error && <div className={styles.error}>{error.message}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.codeInput}>
          {code.map((_digit, index) => (
            <input
              key={index}
              ref={(el) => {
                if (el) inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={code[index]}
              onChange={(e) => handleChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={styles.codeDigit}
              disabled={isLoading}
              aria-label={`Code digit ${index + 1}`}
            />
          ))}
        </div>

        <button type="submit" className={styles.button} disabled={isLoading || code.join('').length < 6}>
          {isLoading ? 'Vérification...' : 'Vérifier'}
        </button>
      </form>

      <div className={styles.actions}>
        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || isLoading}
          className={styles.linkButton}
          type="button"
        >
          {resendCooldown > 0 ? `Renvoyer dans ${resendCooldown}s` : 'Renvoyer le code'}
        </button>

        {onBack && (
          <button onClick={onBack} className={styles.linkButton} disabled={isLoading} type="button">
            Retour
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
