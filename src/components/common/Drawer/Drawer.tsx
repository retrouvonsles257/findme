import React, { ReactNode, useEffect } from 'react';
import styles from './Drawer.module.css';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  closeButton?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
  className = '',
  closeButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className={styles.drawerBackdrop}
          onClick={handleBackdropClick}
          role="presentation"
          data-testid="drawer-backdrop"
        />
      )}
      <div
        className={`${styles.drawer} ${styles[position]} ${styles[size]} ${isOpen ? styles.open : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        onKeyDown={handleKeyDown}
        data-testid="drawer"
      >
        {title && (
          <div className={styles.drawerHeader}>
            <h2 id="drawer-title" className={styles.drawerTitle}>
              {title}
            </h2>
            {closeButton && (
              <button
                className={styles.drawerClose}
                onClick={onClose}
                aria-label="Close drawer"
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className={styles.drawerContent}>{children}</div>
      </div>
    </>
  );
};
