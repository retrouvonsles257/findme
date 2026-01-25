import React from 'react';

export interface HeaderCitizenProps {
  logo: React.ReactNode;
  nav?: React.ReactNode;
  search?: React.ReactNode;
  notifications?: React.ReactNode;
  profile?: React.ReactNode;
}

export const HeaderCitizen: React.FC<HeaderCitizenProps> = ({
  logo,
  nav,
  search,
  notifications,
  profile,
}) => {
  return (
    <header
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1rem 2rem',
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto auto',
        alignItems: 'center',
        gap: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      }}
    >
      {logo}
      {nav && <div>{nav}</div>}
      {search && <div>{search}</div>}
      {notifications && <div>{notifications}</div>}
      {profile && <div>{profile}</div>}
    </header>
  );
};
