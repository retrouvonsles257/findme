import styles from './Textarea.module.css';

interface TextareaProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  required?: boolean;
  readonly?: boolean;
  error?: string;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  maxLength?: number;
  minLength?: number;
  autoResize?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  id,
  name,
  value,
  defaultValue,
  placeholder,
  rows = 3,
  cols,
  disabled = false,
  required = false,
  readonly = false,
  error,
  className = '',
  onChange,
  onBlur,
  onFocus,
  maxLength,
  minLength,
  autoResize = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }

    if (autoResize) {
      autoResizeTextarea(e.target);
    }
  };

  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const textareaClasses = [
    styles.textarea,
    error && styles.error,
    disabled && styles.disabled,
    readonly && styles.readonly,
    autoResize && styles.autoResize,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.textareaContainer}>
      <textarea
        id={textareaId}
        name={name}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={rows}
        cols={cols}
        disabled={disabled}
        required={required}
        readOnly={readonly}
        maxLength={maxLength}
        minLength={minLength}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        className={textareaClasses}
      />
      {error && <div className={styles.errorMessage}>{error}</div>}
      {maxLength && (
        <div className={styles.charCount}>
          {value?.length || 0}/{maxLength}
        </div>
      )}
    </div>
  );
};
