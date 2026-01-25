import React from 'react';

export interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right';
}

export const MobileMenuDrawer: React.FC<MobileMenuDrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'left',
}) => {
  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
          }}
          onClick={onClose}
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 0,
          [position]: 0,
          width: '80vw',
          maxWidth: '300px',
          height: '100vh',
          background: 'white',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : `translateX(${position === 'left' ? '-100%' : '100%'})`,
          transition: 'transform 0.3s ease',
          overflowY: 'auto',
          boxShadow: isOpen ? '0 0 20px rgba(0, 0, 0, 0.2)' : 'none',
        }}
      >
        {children}
      </div>
    </>
  );
};
