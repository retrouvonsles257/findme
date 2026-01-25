/**
 * =====================================================
 * RETROUVONSLES - Organisation Service
 * Business logic for organisations
 * =====================================================
 */

import type { Organisation, OrganisationMember, OrganisationStats } from '../types';

/**
 * Format organisation status
 */
export const getStatusBadgeColor = (status: string): string => {
  const colors = {
    active: '#10b981',
    inactive: '#6b7280',
    suspended: '#ef4444',
  };
  return colors[status as keyof typeof colors] || '#6b7280';
};

/**
 * Format member role
 */
export const getRoleBadgeColor = (role: string): string => {
  const colors = {
    admin: '#8b5cf6',
    moderator: '#f59e0b',
    member: '#3b82f6',
    viewer: '#6b7280',
  };
  return colors[role as keyof typeof colors] || '#6b7280';
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const names = {
    admin: 'Administrator',
    moderator: 'Moderator',
    member: 'Member',
    viewer: 'Viewer',
  };
  return names[role as keyof typeof names] || role;
};

/**
 * Calculate organisation completion percentage
 */
export const calculateCompletionPercentage = (organisation: Organisation): number => {
  const fields = [
    organisation.name,
    organisation.description,
    organisation.email,
    organisation.website,
    organisation.phone,
    organisation.address,
    organisation.city,
    organisation.country,
    organisation.logo_url,
  ];

  const filledFields = fields.filter((field) => field && field.length > 0).length;
  return Math.round((filledFields / fields.length) * 100);
};

/**
 * Filter organisations by role
 */
export const filterOrganisationsByUserRole = (
  organisations: Organisation[],
  userRole: string
): Organisation[] => {
  if (userRole === 'admin') {
    return organisations;
  }
  return organisations.filter((org) => org.status === 'active' || org.verified);
};

/**
 * Get member statistics
 */
export const getMemberStatistics = (members: OrganisationMember[]) => {
  return {
    total: members.length,
    admin: members.filter((m) => m.role === 'admin').length,
    moderator: members.filter((m) => m.role === 'moderator').length,
    member: members.filter((m) => m.role === 'member').length,
    viewer: members.filter((m) => m.role === 'viewer').length,
    active: members.filter((m) => m.status === 'active').length,
    inactive: members.filter((m) => m.status === 'inactive').length,
    pending: members.filter((m) => m.status === 'pending').length,
  };
};

/**
 * Calculate case resolution rate
 */
export const calculateResolutionRate = (stats: OrganisationStats): number => {
  if (stats.total_cases === 0) return 0;
  return Math.round((stats.resolved_cases / stats.total_cases) * 100);
};

/**
 * Validate organisation email
 */
export const isValidOrganisationEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate organisation website
 */
export const isValidOrganisationWebsite = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Sort organisations
 */
export const sortOrganisations = (
  organisations: Organisation[],
  sortBy: 'name' | 'created_at' | 'member_count' = 'created_at',
  order: 'asc' | 'desc' = 'desc'
): Organisation[] => {
  return [...organisations].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'name':
        compareValue = a.name.localeCompare(b.name);
        break;
      case 'created_at':
        compareValue = a.created_at.getTime() - b.created_at.getTime();
        break;
      case 'member_count':
        compareValue = a.member_count - b.member_count;
        break;
      default:
        compareValue = 0;
    }

    return order === 'asc' ? compareValue : -compareValue;
  });
};
