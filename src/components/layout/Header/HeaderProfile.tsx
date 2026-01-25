import React from 'react';

export interface HeaderProfileProps {
  avatar?: React.ReactNode;
  name?: string;
  role?: string;
  onProfileClick?: () => void;
  menu?: React.ReactNode;
}

export const HeaderProfile: React.FC<HeaderProfileProps> = ({
  avatar,
  name,
  role,
  onProfileClick,
  menu,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        cursor: 'pointer',
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        transition: 'background 0.2s ease',
      }}
      onClick={onProfileClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'rgba(0, 0, 0, 0.05)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {avatar && <div style={{ display: 'flex', alignItems: 'center' }}>{avatar}</div>}
      {(name || role) && (
        <div style={{ textAlign: 'right', minWidth: '150px' }}>
          {name && <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{name}</div>}
          {role && <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.25rem' }}>{role}</div>}
        </div>
      )}
      {menu && <div>{menu}</div>}
    </div>
  );
};
