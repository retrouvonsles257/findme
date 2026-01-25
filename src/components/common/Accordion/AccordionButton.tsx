import React, { ReactNode } from 'react';
import styles from './Accordion.module.css';
import { useAccordion } from './Accordion';

export interface AccordionButtonProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccordionButton: React.FC<AccordionButtonProps> = ({ id, children, className = '' }) => {
  const { expandedItems, toggleItem } = useAccordion();
  const isExpanded = expandedItems.has(id);

  return (
    <button
      className={`${styles.accordionButton} ${isExpanded ? styles.expanded : ''} ${className}`}
      onClick={() => toggleItem(id)}
      aria-expanded={isExpanded}
      aria-controls={`accordion-panel-${id}`}
      type="button"
      data-testid={`accordion-button-${id}`}
    >
      <span className={styles.accordionButtonContent}>{children}</span>
      <span className={styles.accordionButtonIcon} aria-hidden="true">
        ▼
      </span>
    </button>
  );
};
