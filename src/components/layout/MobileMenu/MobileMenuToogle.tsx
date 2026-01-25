import React from 'react';

export interface MobileMenuToggleProps {
  isOpen?: boolean;
  onClick?: () => void;
}

export const MobileMenuToggle: React.FC<MobileMenuToggleProps> = ({ isOpen = false, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
      aria-label="Toggle menu"
    >
      <span
        style={{
          width: '24px',
          height: '2px',
          background: '#333',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(45deg) translateY(10px)' : 'rotate(0)',
        }}
      />
      <span
        style={{
          width: '24px',
          height: '2px',
          background: '#333',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          opacity: isOpen ? 0 : 1,
        }}
      />
      <span
        style={{
          width: '24px',
          height: '2px',
          background: '#333',
          borderRadius: '2px',
          transition: 'all 0.3s ease',
          transform: isOpen ? 'rotate(-45deg) translateY(-10px)' : 'rotate(0)',
        }}
      />
    </button>
  );
};
