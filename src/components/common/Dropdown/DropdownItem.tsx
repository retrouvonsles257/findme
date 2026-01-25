import React, { ReactNode } from 'react';
import styles from './Dropdown.module.css';
import { useDropdown } from './Dropdown';

export interface DropdownItemProps {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  href?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  onClick,
  children,
  disabled = false,
  className = '',
  href,
}) => {
  const { onSelect } = useDropdown();

  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      onSelect();
    }
  };

  const baseClasses = `${styles.dropdownItem} ${disabled ? styles.disabled : ''} ${className}`;

  if (href && !disabled) {
    return (
      <a href={href} className={baseClasses} onClick={handleClick} role="menuitem">
        {children}
      </a>
    );
  }

  return (
    <button
      className={baseClasses}
      onClick={handleClick}
      disabled={disabled}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  );
};
