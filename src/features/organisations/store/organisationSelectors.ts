/**
 * =====================================================
 * RETROUVONSLES - Organisation Selectors
 * Redux selectors for organisation state
 * =====================================================
 */

import type { RootState } from '../../../store/types';
import type { Organisation, OrganisationMember, OrganisationStats, OrganisationState } from '../types';

// Helper function to safely access organisation state
const organisationState = (state: RootState) => (state.organisations as OrganisationState) || {};

// ============================================
// BASIC SELECTORS
// ============================================

export const selectAllOrganisations = (state: RootState): Organisation[] =>
  organisationState(state).organisations || [];

export const selectSelectedOrganisation = (state: RootState): Organisation | null =>
  organisationState(state).selectedOrganisation || null;

export const selectOrganisationMembers = (state: RootState): OrganisationMember[] =>
  organisationState(state).members || [];

export const selectOrganisationStats = (state: RootState): OrganisationStats | null =>
  organisationState(state).stats || null;

export const selectOrganisationSettings = (state: RootState) =>
  organisationState(state).settings;

export const selectIsLoading = (state: RootState): boolean =>
  organisationState(state).isLoading || false;

export const selectError = (state: RootState): string | null =>
  organisationState(state).error || null;

export const selectOrganisationFilter = (state: RootState) =>
  organisationState(state).filter;

export const selectPagination = (state: RootState) =>
  organisationState(state).pagination;

// ============================================
// FILTERED SELECTORS
// ============================================

export const selectActiveOrganisations = (state: RootState): Organisation[] =>
  organisationState(state).organisations?.filter((o: Organisation) => o.status === 'active') || [];

export const selectVerifiedOrganisations = (state: RootState): Organisation[] =>
  organisationState(state).organisations?.filter((o: Organisation) => o.verified) || [];

export const selectOrganisationById = (state: RootState, id: string): Organisation | undefined =>
  organisationState(state).organisations?.find((o: Organisation) => o.id === id);

export const selectOrganisationMembersByRole = (state: RootState, role: string): OrganisationMember[] =>
  organisationState(state).members?.filter((m: OrganisationMember) => m.role === role) || [];

export const selectActiveMembers = (state: RootState): OrganisationMember[] =>
  organisationState(state).members?.filter((m: OrganisationMember) => m.status === 'active') || [];

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectOrganisationCount = (state: RootState): number =>
  organisationState(state).organisations?.length || 0;

export const selectMemberCount = (state: RootState): number =>
  organisationState(state).members?.length || 0;

export const selectActiveMemberCount = (state: RootState): number =>
  organisationState(state).members?.filter((m: OrganisationMember) => m.status === 'active').length || 0;

export const selectMemberStatistics = (state: RootState) => {
  const members = organisationState(state).members || [];
  return {
    total: members.length,
    admin: members.filter((m: OrganisationMember) => m.role === 'admin').length,
    moderator: members.filter((m: OrganisationMember) => m.role === 'moderator').length,
    member: members.filter((m: OrganisationMember) => m.role === 'member').length,
    viewer: members.filter((m: OrganisationMember) => m.role === 'viewer').length,
    active: members.filter((m: OrganisationMember) => m.status === 'active').length,
    inactive: members.filter((m: OrganisationMember) => m.status === 'inactive').length,
    pending: members.filter((m: OrganisationMember) => m.status === 'pending').length,
  };
};

export const selectOrganisationStatsSummary = (state: RootState) => {
  const stats = organisationState(state).stats;
  if (!stats) return null;

  return {
    ...stats,
    resolutionRate: stats.total_cases > 0 ? Math.round((stats.resolved_cases / stats.total_cases) * 100) : 0,
    sightingVerificationRate:
      stats.total_sightings > 0 ? Math.round((stats.verified_sightings / stats.total_sightings) * 100) : 0,
    activeMemberPercentage:
      stats.total_members > 0 ? Math.round((stats.active_members / stats.total_members) * 100) : 0,
  };
};

export const selectTopOrganisationsByMembers = (state: RootState, limit: number = 5): Organisation[] =>
  (organisationState(state).organisations || [])
    .slice()
    .sort((a: Organisation, b: Organisation) => b.member_count - a.member_count)
    .slice(0, limit);

export const selectRecentOrganisations = (state: RootState, limit: number = 5): Organisation[] =>
  (organisationState(state).organisations || [])
    .slice()
    .sort((a: Organisation, b: Organisation) => b.created_at.getTime() - a.created_at.getTime())
    .slice(0, limit);
