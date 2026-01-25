import React from 'react';

export interface SidebarNavItemProps {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
  isExpanded?: boolean;
  submenu?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  onClick?: () => void;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  label,
  href = '#',
  icon,
  isActive = false,
  isExpanded = false,
  submenu,
  onClick,
}) => {
  const [expanded, setExpanded] = React.useState(isExpanded);

  return (
    <div>
      <a
        href={href}
        onClick={(e) => {
          if (submenu || onClick) {
            e.preventDefault();
            setExpanded(!expanded);
            onClick?.();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          color: isActive ? '#2563eb' : '#6b7280',
          backgroundColor: isActive ? '#eff6ff' : 'transparent',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: isActive ? '600' : '500',
          borderLeft: isActive ? '4px solid #2563eb' : '4px solid transparent',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.backgroundColor = isActive ? '#eff6ff' : 'transparent';
        }}
      >
        {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        <span style={{ flex: 1 }}>{label}</span>
        {submenu && (
          <span
            style={{
              transform: expanded ? 'rotate(180deg)' : '',
              transition: 'transform 0.2s ease',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ▼
          </span>
        )}
      </a>

      {submenu && expanded && (
        <div style={{ background: '#f9fafb' }}>
          {submenu.map((item, index) => (
            <a
              key={index}
              href={item.href || '#'}
              onClick={(e) => {
                e.preventDefault();
                item.onClick?.();
              }}
              style={{
                display: 'block',
                padding: '0.5rem 1rem 0.5rem 3rem',
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '0.75rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#2563eb';
              }}
              onMouseLeave={(e) => {
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
