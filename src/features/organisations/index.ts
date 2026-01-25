/**
 * =====================================================
 * RETROUVONSLES - Organisations Feature Barrel Export
 * Complete organisations feature exports
 * =====================================================
 */

// Components
export {
  OrganisationList,
  OrganisationDetail,
  OrganisationMembers,
  OrganisationSettings,
  OrganisationStats,
} from './components';
export type {
  OrganisationListProps,
  OrganisationDetailProps,
  OrganisationMembersProps,
  OrganisationSettingsProps,
  OrganisationStatsProps,
} from './components';

// Hooks
export { useOrganisations, useOrganisationDetail, useOrganisationMembers } from './hooks';
export type {
  UseOrganisationsResult,
  UseOrganisationDetailResult,
  UseOrganisationMembersResult,
} from './hooks';

// Services
export { getOrganisations, getOrganisationById, createOrganisation, updateOrganisation, deleteOrganisation } from './services';
export { getStatusBadgeColor, getRoleBadgeColor, getRoleDisplayName, calculateCompletionPercentage } from './services';

// Store - Thunks
export {
  fetchOrganisations,
  fetchOrganisationById,
  createNewOrganisation,
  updateOrganisationData,
  deleteOrganisationData,
  fetchMembers,
  addMember,
  updateMember,
  removeMember,
  fetchStats,
  fetchSettings,
  updateSettings,
  fetchUserOrganisations,
} from './store';

// Store - Actions
export {
  setSelectedOrganisation,
  setFilter,
  setCurrentPage,
  clearError,
  resetOrganisationState,
} from './store';

// Store - Selectors
export {
  selectAllOrganisations,
  selectSelectedOrganisation,
  selectOrganisationMembers,
  selectOrganisationStats,
  selectOrganisationSettings,
  selectIsLoading,
  selectError,
  selectOrganisationFilter,
  selectPagination,
  selectActiveOrganisations,
  selectVerifiedOrganisations,
  selectOrganisationById,
  selectOrganisationMembersByRole,
  selectActiveMembers,
  selectOrganisationCount,
  selectMemberCount,
  selectActiveMemberCount,
  selectMemberStatistics,
  selectOrganisationStatsSummary,
  selectTopOrganisationsByMembers,
  selectRecentOrganisations,
} from './store';

// Types
export type {
  Organisation,
  OrganisationMember,
  OrganisationSettings as IOrganisationSettings,
  OrganisationStats as IOrganisationStats,
  OrganisationCreatePayload,
  OrganisationUpdatePayload,
  OrganisationMemberCreatePayload,
  OrganisationMemberUpdatePayload,
  OrganisationFilter,
  OrganisationState,
} from './types';

// Store
export { organisationReducer } from './store';
