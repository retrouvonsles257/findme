import styles from './Checkbox.module.css';

interface CheckboxProps {
  id?: string;
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  className?: string;
  onChange?: (checked: boolean) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  checked,
  defaultChecked,
  disabled = false,
  required = false,
  label,
  error,
  className = '',
  onChange,
  onBlur,
  onFocus
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  const checkboxId = id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    styles.checkboxContainer,
    disabled && styles.disabled,
    error && styles.error,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <label htmlFor={checkboxId} className={styles.checkboxLabel}>
        <input
          type="checkbox"
          id={checkboxId}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          required={required}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          className={styles.checkboxInput}
        />
        <span className={styles.checkboxMark}></span>
        {label && <span className={styles.checkboxText}>{label}</span>}
      </label>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
