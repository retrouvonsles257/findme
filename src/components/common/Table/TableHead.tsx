import React, { ReactNode } from 'react';
import styles from './Table.module.css';

export interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <thead className={`${styles.tableHead} ${className}`} role="rowgroup">
      {children}
    </thead>
  );
};
