import React, { ReactNode } from 'react';
import styles from './Table.module.css';

export interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  header?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  align = 'left',
  header = false,
}) => {
  const Component = header ? 'th' : 'td';

  return (
    <Component
      className={`${styles.tableCell} ${styles[align]} ${header ? styles.headerCell : ''} ${className}`}
      role={header ? 'columnheader' : 'cell'}
      data-testid={header ? 'table-header-cell' : 'table-cell'}
    >
      {children}
    </Component>
  );
};
