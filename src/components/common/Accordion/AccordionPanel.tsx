import React, { ReactNode } from 'react';
import styles from './Accordion.module.css';
import { useAccordion } from './Accordion';

export interface AccordionPanelProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccordionPanel: React.FC<AccordionPanelProps> = ({ id, children, className = '' }) => {
  const { expandedItems } = useAccordion();
  const isExpanded = expandedItems.has(id);

  return (
    <div
      id={`accordion-panel-${id}`}
      className={`${styles.accordionPanel} ${isExpanded ? styles.expanded : ''} ${className}`}
      role="region"
      aria-labelledby={`accordion-button-${id}`}
      hidden={!isExpanded}
      data-testid={`accordion-panel-${id}`}
    >
      <div className={styles.accordionPanelContent}>{children}</div>
    </div>
  );
};
