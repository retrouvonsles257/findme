import React, { ReactNode } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ children, className = '' }) => {
  return (
    <div className={`${styles.dropdownMenu} ${className}`} role="menuitem">
      {children}
    </div>
  );
};
