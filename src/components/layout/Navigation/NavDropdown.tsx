import React, { useState } from 'react';

export interface NavDropdownProps {
  label: string;
  icon?: React.ReactNode;
  items: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
}

export const NavDropdown: React.FC<NavDropdownProps> = ({ label, icon, items }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onMouseEnter={(e) => {
          setIsOpen(true);
          (e.currentTarget as HTMLButtonElement).style.color = '#0ea5e9';
        }}
        onMouseLeave={(e) => {
          setIsOpen(false);
          (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
        }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: '#6b7280',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'color 0.2s ease',
        }}
      >
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        <span style={{ transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : '' }}>▼</span>
      </button>

      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            minWidth: '200px',
            zIndex: 100,
            marginTop: '0.5rem',
          }}
        >
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href || '#'}
              onClick={(e) => {
                e.preventDefault();
                item.onClick?.();
                setIsOpen(false);
              }}
              style={{
                display: 'block',
                padding: '0.75rem 1rem',
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.875rem',
                borderBottom: index < items.length - 1 ? '1px solid #f3f4f6' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb';
                (e.currentTarget as HTMLAnchorElement).style.color = '#0ea5e9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                (e.currentTarget as HTMLAnchorElement).style.color = '#6b7280';
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
