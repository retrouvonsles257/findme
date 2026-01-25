import React from 'react';
import styles from './Navigation.module.css';

export interface NavigationProps {
  children: React.ReactNode;
}

export const Navigation: React.FC<NavigationProps> = ({ children }) => {
  return (
    <nav className={styles.navigation}>
      {children}
    </nav>
  );
};
