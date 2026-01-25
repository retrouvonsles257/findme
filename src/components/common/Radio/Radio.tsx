import React from 'react';
import styles from './Radio.module.css';

export interface RadioProps {
  name: string;
  value: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const Radio: React.FC<RadioProps> = ({
  name,
  value,
  checked = false,
  onChange,
  disabled = false,
  label,
  className = '',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <div className={`${styles.radioContainer} ${className}`}>
      <input
        type="radio"
        id={`radio-${name}-${value}`}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={styles.radioInput}
        data-testid={`radio-${value}`}
      />
      <label htmlFor={`radio-${name}-${value}`} className={`${styles.radioLabel} ${disabled ? styles.disabled : ''}`}>
        <span className={styles.radioCustom} />
        {label && <span className={styles.labelText}>{label}</span>}
      </label>
    </div>
  );
};
