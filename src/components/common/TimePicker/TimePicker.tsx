import React, { useState, useRef, useEffect } from 'react';
import styles from './TimePicker.module.css';

export interface TimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  placeholder?: string;
  format?: '12h' | '24h';
  disabled?: boolean;
  className?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'HH:MM',
  format = '24h',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState(value || '');
  const [hours, setHours] = useState(value ? parseInt(value.split(':')[0]) : 0);
  const [minutes, setMinutes] = useState(value ? parseInt(value.split(':')[1]) : 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const maxHours = format === '24h' ? 23 : 12;

  useEffect(() => {
    if (value) {
      setDisplayValue(value);
      const [h, m] = value.split(':');
      setHours(parseInt(h));
      setMinutes(parseInt(m));
    }
  }, [value]);

  const formatTime = (h: number, m: number) => {
    const padHour = String(h).padStart(2, '0');
    const padMin = String(m).padStart(2, '0');
    return `${padHour}:${padMin}`;
  };

  const handleTimeChange = () => {
    const time = formatTime(hours, minutes);
    setDisplayValue(time);
    onChange(time);
    setIsOpen(false);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const h = parseInt(e.target.value);
    setHours(Math.min(Math.max(h, 0), maxHours));
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const m = parseInt(e.target.value);
    setMinutes(Math.min(Math.max(m, 0), 59));
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
    <div className={`${styles.timePickerContainer} ${className}`} ref={pickerRef}>
      <div className={styles.timePickerInput}>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={(e) => setDisplayValue(e.target.value)}
          onFocus={() => !disabled && setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly
          className={styles.input}
          aria-label="Time picker input"
          data-testid="time-picker-input"
        />
        <button
          className={`${styles.timePickerButton} ${isOpen ? styles.open : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          aria-label="Open time picker"
          type="button"
        >
          🕐
        </button>
      </div>

      {isOpen && (
        <div className={styles.timePickerPopup}>
          <div className={styles.timePickerContent}>
            <div className={styles.timeSelector}>
              <label htmlFor="hour-select">Hours</label>
              <select
                id="hour-select"
                value={hours}
                onChange={handleHourChange}
                className={styles.select}
                data-testid="hour-select"
              >
                {Array.from({ length: maxHours + 1 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.separator}>:</div>

            <div className={styles.timeSelector}>
              <label htmlFor="minute-select">Minutes</label>
              <select
                id="minute-select"
                value={minutes}
                onChange={handleMinuteChange}
                className={styles.select}
                data-testid="minute-select"
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {String(i).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.timePickerActions}>
            <button
              className={styles.cancelButton}
              onClick={() => setIsOpen(false)}
              type="button"
            >
              Cancel
            </button>
            <button className={styles.confirmButton} onClick={handleTimeChange} type="button">
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
