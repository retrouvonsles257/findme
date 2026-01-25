/**
 * =====================================================
 * RETROUVONSLES - usePermissions Hook
 * Checks user permissions based on role
 * =====================================================
 */

import { useSelector } from 'react-redux';
import type { User } from '../@types/auth.types';

export interface UsePermissionsResult {
  user: User | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isVerified: boolean;
}

// Permission mapping based on roles
const rolePermissions: { [key: string]: string[] } = {
  super_admin: [
    'manage_users',
    'manage_roles',
    'view_reports',
    'manage_organizations',
    'manage_content',
    'view_analytics',
    'manage_alerts',
    'manage_dossiers',
    'manage_signalements',
    'manage_notifications',
  ],
  admin_organisation: [
    'manage_organization_users',
    'view_organization_reports',
    'manage_organization_content',
    'view_organization_analytics',
    'manage_dossiers',
    'manage_signalements',
    'manage_organization_alerts',
  ],
  officier_police: [
    'view_reports',
    'manage_signalements',
    'view_dossiers',
    'create_alerts',
    'view_analytics',
  ],
  delegue_ngo: [
    'view_reports',
    'create_dossiers',
    'manage_dossiers',
    'create_signalements',
    'manage_signalements',
    'view_analytics',
  ],
  moderateur: [
    'manage_content',
    'view_reports',
    'create_dossiers',
    'create_signalements',
    'view_analytics',
  ],
  citoyen_verifie: [
    'create_dossiers',
    'create_signalements',
    'view_dossiers',
    'view_signalements',
  ],
  citoyen_standard: ['view_dossiers', 'view_signalements'],
};

export const usePermissions = (): UsePermissionsResult => {
  // Assuming auth state is stored in Redux
  const user = useSelector((state: any) => state.auth?.user || null);

  const getPermissions = (role?: string): string[] => {
    if (!role) return [];
    return rolePermissions[role] || [];
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = getPermissions(user.role);
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    const userPermissions = getPermissions(user.role);
    return permissions.some((perm) => userPermissions.includes(perm));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    const userPermissions = getPermissions(user.role);
    return permissions.every((perm) => userPermissions.includes(perm));
  };

  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin_organisation';
  const isModerator = user?.role === 'moderateur';
  const isVerified = user?.role === 'citoyen_verifie';

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isModerator,
    isVerified,
  };
};
