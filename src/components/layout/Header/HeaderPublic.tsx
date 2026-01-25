import React from 'react';

export interface HeaderPublicProps {
  logo: React.ReactNode;
  nav?: React.ReactNode;
  actions?: React.ReactNode;
}

export const HeaderPublic: React.FC<HeaderPublicProps> = ({ logo, nav, actions }) => {
  return (
    <header
      style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      {logo}
      {nav && <div style={{ flex: 1 }}>{nav}</div>}
      {actions && <div>{actions}</div>}
    </header>
  );
};
