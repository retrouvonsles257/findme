import React from 'react';

export interface NavItemProps {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
}

export const NavItem: React.FC<NavItemProps> = ({ label, href = '#', icon, isActive = false, onClick }) => {
  return (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        color: isActive ? '#2563eb' : '#6b7280',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: isActive ? '600' : '500',
        borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = '#2563eb';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = isActive ? '#2563eb' : '#6b7280';
      }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </a>
  );
};
