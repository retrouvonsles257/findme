/**
 * =====================================================
 * RETROUVONSLES - User Service Utilities
 * Utility functions for user operations
 * =====================================================
 */

import type { UserProfile, UserStats, UserPermissions, UserWithMetrics } from '../types';

/**
 * Format user display name
 */
export const formatUserName = (user: UserProfile): string => {
  if (!user) return 'Unknown User';
  return user.nom_complet || user.email;
};

/**
 * Get user initials for avatar
 */
export const getUserInitials = (user: UserProfile): string => {
  const name = formatUserName(user);
  return name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

/**
 * Format user status for display
 */
export const formatUserStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    actif: 'Actif',
    suspendu: 'Suspendu',
    en_attente_verification: 'En attente',
    desactive: 'Désactivé',
    bloque: 'Bloqué',
  };
  return statusMap[status] || status;
};

/**
 * Get user status color
 */
export const getUserStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    actif: '#28a745',
    suspendu: '#ffc107',
    en_attente_verification: '#17a2b8',
    desactive: '#6c757d',
    bloque: '#dc3545',
  };
  return colorMap[status] || '#999';
};

/**
 * Check if user has permission
 */
export const hasPermission = (permissions: string[], permission: string): boolean => {
  return permissions.includes(permission) || permissions.includes('*');
};

/**
 * Get user permissions based on role
 */
export const getUserPermissions = (role: string): UserPermissions => {
  const permissionMap: Record<string, UserPermissions> = {
    super_admin: {
      canViewUsers: true,
      canEditUsers: true,
      canDeleteUsers: true,
      canManageRoles: true,
      canViewActivity: true,
      canExportData: true,
      canVerifyUsers: true,
      canSuspendUsers: true,
    },
    admin_organisation: {
      canViewUsers: true,
      canEditUsers: true,
      canDeleteUsers: false,
      canManageRoles: true,
      canViewActivity: true,
      canExportData: true,
      canVerifyUsers: true,
      canSuspendUsers: true,
    },
    moderateur: {
      canViewUsers: true,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canViewActivity: true,
      canExportData: false,
      canVerifyUsers: true,
      canSuspendUsers: true,
    },
    citoyen_verifie: {
      canViewUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canViewActivity: false,
      canExportData: false,
      canVerifyUsers: false,
      canSuspendUsers: false,
    },
    citoyen_standard: {
      canViewUsers: false,
      canEditUsers: false,
      canDeleteUsers: false,
      canManageRoles: false,
      canViewActivity: false,
      canExportData: false,
      canVerifyUsers: false,
      canSuspendUsers: false,
    },
  };

  return permissionMap[role] || permissionMap.citoyen_standard;
};

/**
 * Format user registration date
 */
export const formatRegistrationDate = (date: string | Date): string => {
  if (!date) return 'Unknown';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate user verification completion percentage
 */
export const calculateVerificationCompletion = (user: UserProfile): number => {
  let completed = 0;
  let total = 0;

  const requiredFields = [
    'email_confirme',
    'telephone_confirme',
    'email',
    'nom_complet',
  ];

  requiredFields.forEach((field) => {
    total++;
    if ((user as any)[field]) {
      completed++;
    }
  });

  const optionalFields = ['adresse', 'ville', 'code_postal', 'date_naissance', 'bio'];
  const completedOptional = optionalFields.filter((field) => (user as any)[field]).length;

  return Math.round(((completed + completedOptional) / (total + optionalFields.length)) * 100);
};

/**
 * Format contribution score
 */
export const formatContributionScore = (score: number): string => {
  if (score >= 1000) return '⭐⭐⭐⭐⭐ Excellent';
  if (score >= 500) return '⭐⭐⭐⭐ Très bon';
  if (score >= 100) return '⭐⭐⭐ Bon';
  if (score >= 10) return '⭐⭐ Acceptable';
  return '⭐ Novice';
};

/**
 * Get user activity summary
 */
export const getUserActivitySummary = (stats: UserStats): string => {
  if (!stats) return 'No activity';
  const parts = [];

  if (stats.nombre_signalements > 0)
    parts.push(`${stats.nombre_signalements} signalements`);
  if (stats.nombre_dossiers_crees > 0) parts.push(`${stats.nombre_dossiers_crees} dossiers`);
  if (stats.nombre_verifications > 0)
    parts.push(`${stats.nombre_verifications} vérifications`);

  return parts.join(' • ') || 'No activity';
};

/**
 * Format last activity time
 */
export const formatLastActivityTime = (date: string | Date | undefined): string => {
  if (!date) return 'Never';

  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('fr-FR');
};

/**
 * Merge user with their metrics
 */
export const mergeUserWithMetrics = (user: UserProfile, stats: UserStats | null): UserWithMetrics => {
  return {
    ...user,
    stats: stats || {
      user_id: user.id,
      nombre_signalements: 0,
      nombre_dossiers_crees: 0,
      nombre_verifications: 0,
      nombre_cas_resolus: 0,
      taux_resolution: 0,
      derniere_activite: new Date(),
      score_contribution: 0,
    },
  };
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate phone number format
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const regex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return regex.test(phone);
};

/**
 * Calculate user role level (for permission hierarchy)
 */
export const getRoleLevel = (role: string): number => {
  const levels: Record<string, number> = {
    super_admin: 7,
    admin_organisation: 6,
    responsable_ong: 5,
    officier_police: 4,
    agent_gendarmerie: 4,
    // Aligné avec la documentation: opérateur=2, modérateur=3
    operateur_saisie: 2,
    moderateur: 3,
    citoyen_verifie: 1,
    citoyen_standard: 0,
  };
  return levels[role] || 0;
};

/**
 * Check if user can edit another user
 */
export const canEditUser = (currentUser: UserProfile, targetUser: UserProfile): boolean => {
  const currentLevel = getRoleLevel(currentUser.role);
  const targetLevel = getRoleLevel(targetUser.role);

  // Can edit themselves
  if (currentUser.id === targetUser.id) return true;

  // Can edit users with lower role level
  return currentLevel > targetLevel;
};
