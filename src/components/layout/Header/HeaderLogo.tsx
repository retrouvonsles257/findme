import React from 'react';

export interface HeaderLogoProps {
  logo: React.ReactNode;
  title?: string;
  href?: string;
}

export const HeaderLogo: React.FC<HeaderLogoProps> = ({ logo, title, href = '/' }) => {
  return (
    <a
      href={href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        color: 'inherit',
        fontWeight: '700',
        fontSize: '1.25rem',
      }}
    >
      {logo}
      {title && <span>{title}</span>}
    </a>
  );
};
