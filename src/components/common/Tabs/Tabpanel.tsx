import React, { ReactNode } from 'react';
import styles from './Tabs.module.css';
import { useTabs } from './Tabs';

export interface TabPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({ id, children, className = '' }) => {
  const { activeTab } = useTabs();
  const index = parseInt(id);
  const isActive = activeTab === index;

  return (
    <div
      id={`tabpanel-${id}`}
      className={`${styles.tabPanel} ${isActive ? styles.active : ''} ${className}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      data-testid={`tabpanel-${id}`}
    >
      {children}
    </div>
  );
};
