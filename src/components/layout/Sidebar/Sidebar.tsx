import React from 'react';
import { SidebarPublic } from './SidebarPublic';
import { SidebarCitizen } from './SidebarCitizen';
import { SidebarAuthority } from './SidebarAuthority';

export type SidebarType = 'public' | 'citizen' | 'authority';

export interface SidebarProps {
  type?: SidebarType;
  logo?: React.ReactNode;
  nav?: React.ReactNode;
  alerts?: React.ReactNode;
  profile?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Sidebar: React.FC<SidebarProps> = ({
  type = 'public',
  logo,
  nav,
  alerts,
  profile,
  footer,
}) => {
  const commonProps = {
    logo,
    nav,
    profile,
    footer,
  };

  return (
    <>
      {type === 'public' && <SidebarPublic {...commonProps} />}
      {type === 'citizen' && <SidebarCitizen {...commonProps} />}
      {type === 'authority' && <SidebarAuthority {...commonProps} alerts={alerts} />}
    </>
  );
};
