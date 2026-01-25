import React from 'react';

export interface HeaderNavProps {
  children: React.ReactNode;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ children }) => {
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      {children}
    </nav>
  );
};
