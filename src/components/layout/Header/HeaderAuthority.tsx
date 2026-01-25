import React from 'react';

export interface HeaderAuthorityProps {
  logo: React.ReactNode;
  nav?: React.ReactNode;
  search?: React.ReactNode;
  alerts?: React.ReactNode;
  notifications?: React.ReactNode;
  profile?: React.ReactNode;
}

export const HeaderAuthority: React.FC<HeaderAuthorityProps> = ({
  logo,
  nav,
  search,
  alerts,
  notifications,
  profile,
}) => {
  return (
    <header
      style={{
        background: '#1f2937',
        color: 'white',
        padding: '1rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto auto',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
      }}
    >
      {logo}
      {nav && <div>{nav}</div>}
      {search && <div>{search}</div>}
      {alerts && <div>{alerts}</div>}
      {notifications && <div>{notifications}</div>}
      {profile && <div>{profile}</div>}
    </header>
  );
};
