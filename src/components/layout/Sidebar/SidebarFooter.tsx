import React from 'react';

export interface SidebarFooterProps {
  children: React.ReactNode;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ children }) => {
  return (
    <div
      style={{
        padding: '1rem',
        borderTop: '1px solid #e5e7eb',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {children}
    </div>
  );
};
