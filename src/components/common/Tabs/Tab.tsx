import React, { ReactNode } from 'react';
import styles from './Tabs.module.css';
import { useTabs } from './Tabs';

export interface TabProps {
  id: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export const Tab: React.FC<TabProps> = ({ id, children, className = '', disabled = false, icon }) => {
  const { activeTab, setActiveTab } = useTabs();
  const index = parseInt(id);
  const isActive = activeTab === index;

  return (
    <button
      className={`${styles.tab} ${isActive ? styles.active : ''} ${disabled ? styles.disabled : ''} ${className}`}
      onClick={() => !disabled && setActiveTab(index)}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      disabled={disabled}
      type="button"
      data-testid={`tab-${id}`}
    >
      {icon && <span className={styles.tabIcon}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
