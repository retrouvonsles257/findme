import React from 'react';
import styles from './SearchBar.module.css';

export interface SearchBarInputProps {
  value: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'bordered' | 'filled';
  isLoading?: boolean;
}

/**
 * SearchBarInput component - input field
 */
export const SearchBarInput: React.FC<SearchBarInputProps> = ({
  value,
  onChange,
  onClear,
  onFocus,
  onBlur,
  placeholder = 'Search...',
  size = 'medium',
  variant = 'default',
  isLoading = false,
}) => {
  return (
    <div className={`${styles.inputContainer} ${styles[`size-${size}`]} ${styles[`variant-${variant}`]}`}>
      <svg
        className={styles.searchIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={styles.input}
        disabled={isLoading}
      />

      {value && (
        <button
          className={styles.clearBtn}
          onClick={onClear}
          disabled={isLoading}
          type="button"
        >
          ×
        </button>
      )}

      {isLoading && (
        <div className={styles.loadingSpinner} />
      )}
    </div>
  );
};
