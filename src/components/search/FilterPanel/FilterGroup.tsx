import React, { useState } from 'react';
import styles from './FilterPanel.module.css';

export interface FilterGroupProps {
  filter: {
    id: string;
    name: string;
  };
  children: React.ReactNode;
}

/**
 * FilterGroup component - groups related filters
 */
export const FilterGroup: React.FC<FilterGroupProps> = ({ filter, children }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={styles.filterGroup}>
      <button
        className={styles.groupHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.groupTitle}>{filter.name}</span>
        <span className={`${styles.arrow} ${isExpanded ? styles.expanded : ''}`}>
          ›
        </span>
      </button>

      {isExpanded && <div className={styles.groupItems}>{children}</div>}
    </div>
  );
};
