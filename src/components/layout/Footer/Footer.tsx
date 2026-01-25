import React from 'react';
import styles from './Footer.module.css';

export interface FooterProps {
  logo?: React.ReactNode;
  description?: string;
  columns?: React.ReactNode;
  social?: React.ReactNode;
  copyright?: React.ReactNode;
}

export const Footer: React.FC<FooterProps> = ({
  logo,
  description,
  columns,
  social,
  copyright,
}) => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {(logo || description) && (
            <div className={styles.brand}>
              {logo && <div className={styles.logo}>{logo}</div>}
              {description && <p className={styles.description}>{description}</p>}
            </div>
          )}

          {columns && <div className={styles.columns}>{columns}</div>}
        </div>

        {social && <div className={styles.social}>{social}</div>}
      </div>

      {copyright && <div className={styles.copyright}>{copyright}</div>}
    </footer>
  );
};
