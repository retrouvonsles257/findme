import React, { ReactNode } from 'react';
import styles from './Breadcrum.module.css';

export interface BreadcrumbItemProps {
  children: ReactNode;
  href?: string;
  isActive?: boolean;
  className?: string;
}

export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  children,
  href,
  isActive = false,
  className = '',
}) => {
  return (
    <li className={`${styles.breadcrumbItem} ${isActive ? styles.active : ''} ${className}`}>
      {href && !isActive ? (
        <a href={href} className={styles.breadcrumbLink}>
          {children}
        </a>
      ) : (
        <span className={styles.breadcrumbText} aria-current={isActive ? 'page' : undefined}>
          {children}
        </span>
      )}
    </li>
  );
};
