import React from 'react';

export interface HeaderActionsProps {
  children: React.ReactNode;
}

export const HeaderActions: React.FC<HeaderActionsProps> = ({ children }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {children}
    </div>
  );
};
