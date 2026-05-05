/**
 * =====================================================
 * RETROUVONSLES - usePermissions Hook
 * Checks user permissions based on role
 * =====================================================
 */

import { useSelector } from 'react-redux';
import type { User } from '../@types/auth.types';
import { NomRole } from '../@types/enums.types';

export interface UsePermissionsResult {
  user: User | null;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  isAdmin: boolean;
  isModerator: boolean;
  isVerified: boolean;
}

const permissionsCitoyen: string[] = [
  'create_signalements',
  'view_dossiers',
  'view_signalements',
  'view_notifications',
  'manage_profile',
  'manage_notification_preferences',
];

const permissionsCitoyenIdentite: string[] = [
  ...permissionsCitoyen,
  'priority_reports',
  'upload_multiple_photos',
];

/** Ancienne granularité opérateur / modérateur / ONG / police regroupée sous `autorite`. */
const permissionsAutorite: string[] = [
  'view_reports',
  'manage_signalements',
  'view_dossiers',
  'create_alerts',
  'view_analytics',
  'manage_content',
  'create_signalements',
  'view_organization_dossiers',
  'create_dossiers',
  'edit_own_dossiers',
  'create_personnes',
  'manage_filiation',
  'view_pending_signalements',
  'view_pending_photos',
  'manage_dossiers',
  'manage_organization_alerts',
  'manage_organization_content',
  'view_organization_analytics',
  'manage_organization_users',
];

const permissionsAdminSysteme: string[] = [
  ...permissionsAutorite,
  'manage_users',
  'manage_roles',
  'manage_organizations',
  'manage_alerts',
  'manage_notifications',
];

const rolePermissions: Partial<Record<NomRole, string[]>> = {
  [NomRole.ADMIN_SYSTEME]: permissionsAdminSysteme,
  [NomRole.AUTORITE]: permissionsAutorite,
  [NomRole.CITOYEN]: permissionsCitoyen,
};

export const usePermissions = (): UsePermissionsResult => {
  const user = useSelector((state: any) => state.auth?.user || null) as User | null;

  const getPermissions = (role?: NomRole): string[] => {
    if (!role) return [];
    if (role === NomRole.CITOYEN && user?.identite_verifiee) {
      return permissionsCitoyenIdentite;
    }
    return rolePermissions[role] || [];
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    const permissions = getPermissions(user.role as NomRole);
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!user) return false;
    const userPermissions = getPermissions(user.role as NomRole);
    return permissions.some((perm) => userPermissions.includes(perm));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!user) return false;
    const userPermissions = getPermissions(user.role as NomRole);
    return permissions.every((perm) => userPermissions.includes(perm));
  };

  const isAdmin = user?.role === NomRole.ADMIN_SYSTEME;
  const echelon = user?.autorite_echelon ?? null;
  const isModerator = user?.role === NomRole.AUTORITE && echelon !== null && echelon <= 2;
  const isVerified = user?.role === NomRole.CITOYEN && Boolean(user?.identite_verifiee);

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
