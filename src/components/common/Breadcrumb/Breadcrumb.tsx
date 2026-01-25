import React, { ReactNode } from 'react';
import styles from './Breadcrum.module.css';

export interface BreadcrumbProps {
  children: ReactNode;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ children, className = '' }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`${styles.breadcrumb} ${className}`}
      data-testid="breadcrumb"
    >
      <ol className={styles.breadcrumbList}>{children}</ol>
    </nav>
  );
};
