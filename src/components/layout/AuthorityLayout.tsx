/**
 * =====================================================
 * RETROUVONSLES - Authority Layout Component
 * Layout wrapper for authority pages
 * =====================================================
 */

import React from 'react';
import { DashboardLayout } from './DashbordLayout';
import { HeaderAuthority } from './Header/HeaderAuthority';
import { SidebarAuthority } from './Sidebar/SidebarAuthority';

export interface AuthorityLayoutProps {
  children: React.ReactNode;
}

export const AuthorityLayout: React.FC<AuthorityLayoutProps> = ({ children }) => {
  return (
    <DashboardLayout
      header={<HeaderAuthority logo={<span>Retrouvons-Les</span>} />}
      sidebar={<SidebarAuthority />}
    >
      {children}
    </DashboardLayout>
  );
};
