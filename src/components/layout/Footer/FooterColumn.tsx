import React from 'react';

export interface FooterColumnProps {
  children: React.ReactNode;
}

export const FooterColumn: React.FC<FooterColumnProps> = ({ children }) => {
  return (
    <div style={{ minWidth: '250px' }}>
      {children}
    </div>
  );
};
