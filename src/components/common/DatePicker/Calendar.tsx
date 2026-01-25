import React, { useState } from 'react';
import styles from './DatePicker.module.css';

export interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate = new Date(),
  onDateSelect,
  minDate,
  maxDate,
  className = '',
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const isDateDisabled = (date: Date): boolean => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isDateSelected(date);

      days.push(
        <button
          key={day}
          className={`${styles.day} ${selected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
          onClick={() => !disabled && onDateSelect(date)}
          disabled={disabled}
          aria-label={date.toDateString()}
          type="button"
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className={`${styles.calendar} ${className}`}>
      <div className={styles.calendarHeader}>
        <button
          className={styles.navButton}
          onClick={handlePrevMonth}
          aria-label="Previous month"
          type="button"
        >
          ‹
        </button>
        <h3 className={styles.monthYear}>{monthYear}</h3>
        <button className={styles.navButton} onClick={handleNextMonth} aria-label="Next month" type="button">
          ›
        </button>
      </div>

      <div className={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className={styles.weekDay}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendarDays}>{renderCalendarDays()}</div>
    </div>
  );
};
