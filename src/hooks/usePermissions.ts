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

// Permission mapping based on roles
const rolePermissions: Partial<Record<NomRole, string[]>> = {
  [NomRole.SUPER_ADMIN]: [
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
  [NomRole.ADMIN_ORGANISATION]: [
    'manage_organization_users',
    'view_organization_reports',
    'manage_organization_content',
    'view_organization_analytics',
    'manage_dossiers',
    'manage_signalements',
    'manage_organization_alerts',
  ],
  [NomRole.OFFICIER_POLICE]: [
    'view_reports',
    'manage_signalements',
    'view_dossiers',
    'create_alerts',
    'view_analytics',
  ],
  [NomRole.AGENT_GENDARMERIE]: [
    'view_reports',
    'manage_signalements',
    'view_dossiers',
    'create_alerts',
    'view_analytics',
  ],
  [NomRole.RESPONSABLE_ONG]: [
    'view_reports',
    'create_dossiers',
    'manage_dossiers',
    'create_signalements',
    'manage_signalements',
    'view_analytics',
  ],
  [NomRole.MODERATEUR]: [
    'manage_content',
    'view_reports',
    'create_signalements',
    'view_analytics',
  ],
  [NomRole.OPERATEUR_SAISIE]: [
    // Docs: opérateur saisie (niveau 2)
    'view_dossiers',
    'view_organization_dossiers',
    'create_dossiers',
    'edit_own_dossiers',
    'create_personnes',
    'manage_filiation',
    'view_pending_signalements',
    'view_pending_photos',
  ],
  // Citoyens (docs: peuvent consulter les dossiers publics + créer des signalements)
  [NomRole.CITOYEN_VERIFIE]: [
    'create_signalements',
    'view_dossiers',
    'view_signalements',
    'view_notifications',
    'manage_profile',
    'manage_notification_preferences',
    // Spécifique niveau 1
    'priority_reports',
    'upload_multiple_photos',
  ],
  [NomRole.CITOYEN_STANDARD]: [
    'create_signalements',
    'view_dossiers',
    'view_signalements',
    'view_notifications',
    'manage_profile',
    'manage_notification_preferences',
  ],
};

export const usePermissions = (): UsePermissionsResult => {
  // Assuming auth state is stored in Redux
  const user = useSelector((state: any) => state.auth?.user || null);

  const getPermissions = (role?: NomRole): string[] => {
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

  const isAdmin =
    user?.role === NomRole.SUPER_ADMIN || user?.role === NomRole.ADMIN_ORGANISATION;
  const isModerator = user?.role === NomRole.MODERATEUR;
  const isVerified = user?.role === NomRole.CITOYEN_VERIFIE;

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
