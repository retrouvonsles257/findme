import React, { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

export const TabPanels: React.FC<TabPanelsProps> = ({ children, className = '' }) => {
  return (
    <div className={`${styles.tabPanels} ${className}`}>
      {children}
    </div>
  );
};
