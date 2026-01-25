import React, { ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabListProps {
  children: ReactNode;
  className?: string;
}

export const TabList: React.FC<TabListProps> = ({ children, className = '' }) => {
  return (
    <div className={`${styles.tabList} ${className}`} role="tablist">
      {children}
    </div>
  );
};
