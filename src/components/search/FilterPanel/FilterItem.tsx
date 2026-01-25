import React from 'react';
import styles from './FilterPanel.module.css';

export interface FilterItemProps {
  id: string;
  label: string;
  count?: number;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

/**
 * FilterItem component - individual filter checkbox
 */
export const FilterItem: React.FC<FilterItemProps> = ({
  id,
  label,
  count,
  checked = false,
  onChange,
}) => {
  return (
    <label className={styles.filterItem}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        className={styles.checkbox}
      />
      <span className={styles.itemLabel}>{label}</span>
      {count !== undefined && (
        <span className={styles.itemCount}>{count}</span>
      )}
    </label>
  );
};
