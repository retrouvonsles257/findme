import React, { useState, ReactNode } from 'react';
import styles from './Tabs.module.css';

export interface TabsProps {
  children: ReactNode;
  defaultTab?: number;
  onTabChange?: (index: number) => void;
  className?: string;
}

export interface TabsContextType {
  activeTab: number;
  setActiveTab: (index: number) => void;
}

export const TabsContext = React.createContext<TabsContextType | undefined>(undefined);

export const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a Tabs component');
  }
  return context;
};

export const Tabs: React.FC<TabsProps> = ({ children, defaultTab = 0, onTabChange, className = '' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const handleTabChange = (index: number) => {
    setActiveTab(index);
    onTabChange?.(index);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={`${styles.tabs} ${className}`} data-testid="tabs">
        {children}
      </div>
    </TabsContext.Provider>
  );
};
