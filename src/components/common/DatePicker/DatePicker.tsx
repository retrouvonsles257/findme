import React, { useState, useRef, useEffect } from 'react';
import { Calendar } from './Calendar';
import styles from './DatePicker.module.css';

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
  format?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select a date',
  minDate,
  maxDate,
  disabled = false,
  className = '',
  format = 'MM/DD/YYYY',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDate(value, format));
    } else {
      setDisplayValue('');
    }
  }, [value, format]);

  const formatDate = (date: Date, fmt: string): string => {
    const pad = (num: number) => String(num).padStart(2, '0');
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const year = date.getFullYear();

    return fmt
      .replace('MM', month)
      .replace('DD', day)
      .replace('YYYY', String(year));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleDateSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [isOpen]);

  return (
    <div className={`${styles.datePickerContainer} ${className}`} ref={pickerRef}>
      <div className={styles.datePickerInput}>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          className={styles.input}
          aria-label="Date picker input"
          data-testid="date-picker-input"
        />
        <button
          className={`${styles.datePickerButton} ${isOpen ? styles.open : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label="Open date picker"
          type="button"
        >
          📅
        </button>
      </div>

      {isOpen && (
        <div className={styles.datePickerPopup}>
          <Calendar
            selectedDate={value}
            onDateSelect={handleDateSelect}
            minDate={minDate}
            maxDate={maxDate}
          />
        </div>
      )}
    </div>
  );
};
