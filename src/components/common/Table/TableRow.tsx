import React, { ReactNode } from 'react';
import styles from './Table.module.css';

export interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selectable?: boolean;
  selected?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  onClick,
  selectable = false,
  selected = false,
}) => {
  return (
    <tr
      className={`${styles.tableRow} ${selectable ? styles.selectable : ''} ${selected ? styles.selected : ''} ${className}`}
      onClick={onClick}
      role="row"
      data-testid="table-row"
    >
      {children}
    </tr>
  );
};
