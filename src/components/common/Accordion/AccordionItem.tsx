import React, { ReactNode } from 'react';
import styles from './Accordion.module.css';

export interface AccordionItemProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ id, children, className = '' }) => {
  return (
    <div className={`${styles.accordionItem} ${className}`} data-testid={`accordion-item-${id}`}>
      {children}
    </div>
  );
};
