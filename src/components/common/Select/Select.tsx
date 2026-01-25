import styles from './Select.module.css';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  id?: string;
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  onChange?: (value: string | number) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const Select: React.FC<SelectProps> = ({
  id,
  name,
  value,
  defaultValue,
  options,
  placeholder,
  disabled = false,
  required = false,
  error,
  className = '',
  onChange,
  onBlur,
  onFocus
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      const selectedValue = e.target.value;
      // Convert to number if the original value was a number
      const option = options.find(opt => opt.value.toString() === selectedValue);
      onChange(option ? option.value : selectedValue);
    }
  };

  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const selectClasses = [
    styles.select,
    error && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.selectContainer}>
      <select
        id={selectId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        className={selectClasses}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <div className={styles.selectArrow}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {error && <div className={styles.errorMessage}>{error}</div>}
    </div>
  );
};
