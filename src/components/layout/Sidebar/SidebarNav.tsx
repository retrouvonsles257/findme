import React from 'react';

export interface SidebarNavProps {
  children: React.ReactNode;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ children }) => {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {children}
    </nav>
  );
};
