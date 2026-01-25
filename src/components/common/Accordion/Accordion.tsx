import React, { useState, ReactNode } from 'react';
import styles from './Accordion.module.css';

export interface AccordionProps {
  children: ReactNode;
  allowMultiple?: boolean;
  className?: string;
}

export interface AccordionContextType {
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

export const AccordionContext = React.createContext<AccordionContextType | undefined>(undefined);

export const useAccordion = () => {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('useAccordion must be used within an Accordion component');
  }
  return context;
};

export const Accordion: React.FC<AccordionProps> = ({
  children,
  allowMultiple = false,
  className = '',
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        if (!allowMultiple) {
          newSet.clear();
        }
        newSet.add(id);
      }
      return newSet;
    });
  };

  const value: AccordionContextType = {
    expandedItems,
    toggleItem,
    allowMultiple,
  };

  return (
    <AccordionContext.Provider value={value}>
      <div className={`${styles.accordion} ${className}`} role="region">
        {children}
      </div>
    </AccordionContext.Provider>
  );
};
