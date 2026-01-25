import React, { ReactNode } from 'react';
import styles from './Table.module.css';

export interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={`${styles.tableBody} ${className}`} role="rowgroup">
      {children}
    </tbody>
  );
};
