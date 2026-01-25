import { forwardRef } from 'react';
import styles from './Input.module.css';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: InputSize;
  variant?: InputVariant;
  label?: string;
  helperText?: string;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  size = 'md',
  variant = 'default',
  label,
  helperText,
  fullWidth = false,
  startIcon,
  endIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const inputClasses = [
    styles.input,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    startIcon && styles.hasStartIcon,
    endIcon && styles.hasEndIcon,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.inputWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}

      <div className={styles.inputContainer}>
        {startIcon && (
          <div className={styles.startIcon}>
            {startIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />

        {endIcon && (
          <div className={styles.endIcon}>
            {endIcon}
          </div>
        )}
      </div>

      {helperText && (
        <div className={`${styles.helperText} ${styles[variant]}`}>
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';
