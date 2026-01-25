import React, { ReactNode } from 'react';
import styles from './Table.module.css';

export interface TableProps {
  children: ReactNode;
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  striped = false,
  bordered = false,
  hoverable = true,
  compact = false,
  className = '',
}) => {
  return (
    <div className={styles.tableWrapper}>
      <table
        className={`${styles.table} ${striped ? styles.striped : ''} ${bordered ? styles.bordered : ''} ${hoverable ? styles.hoverable : ''} ${compact ? styles.compact : ''} ${className}`}
        role="table"
        data-testid="table"
      >
        {children}
      </table>
    </div>
  );
};
