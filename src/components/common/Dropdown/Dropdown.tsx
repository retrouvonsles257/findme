import React, { useState, useRef, useEffect, ReactNode } from 'react';
import styles from './Dropdown.module.css';

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  closeOnSelect?: boolean;
  align?: 'left' | 'right' | 'center';
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  className = '',
  closeOnSelect = true,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    return undefined;
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
    if (e.key === 'Enter' || e.key === ' ') {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = () => {
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`${styles.dropdown} ${className}`} ref={containerRef}>
      <button
        ref={triggerRef}
        className={`${styles.dropdownTrigger} ${isOpen ? styles.open : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        type="button"
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`${styles.dropdownContent} ${styles[align]}`}
          role="menu"
          data-testid="dropdown-menu"
        >
          <DropdownContext.Provider value={{ onSelect: handleSelect }}>
            {children}
          </DropdownContext.Provider>
        </div>
      )}
    </div>
  );
};

export interface DropdownContextType {
  onSelect: () => void;
}

export const DropdownContext = React.createContext<DropdownContextType | undefined>(undefined);

export const useDropdown = () => {
  const context = React.useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdown must be used within a Dropdown component');
  }
  return context;
};
