import React, { useState } from 'react';
import { MobileMenuToggle } from './MobileMenuToogle';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import styles from './MobileMenu.module.css';

export interface MobileMenuProps {
  children: React.ReactNode;
  logo?: React.ReactNode;
  position?: 'left' | 'right';
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ children, logo, position = 'left' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className={styles.header}>
        <MobileMenuToggle isOpen={isOpen} onClick={() => setIsOpen(!isOpen)} />
        {logo && <div className={styles.logo}>{logo}</div>}
      </div>

      <MobileMenuDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} position={position}>
        {children}
      </MobileMenuDrawer>
    </>
  );
};
