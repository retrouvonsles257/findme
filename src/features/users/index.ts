/**
 * Users Feature - Main Export
 * Provides all types, services, store, hooks, and components
 */

// Types
export type {
  UserPreferences,
  UserRole,
  UserActivity,
  UserFilter,
  UserCreatePayload,
  UserUpdatePayload,
  UserPreferencesUpdatePayload,
  UserState,
  UserProfileProps,
  UserSettingsProps,
  UserListProps,
  UserRolesProps,
  UserStatsProps,
  UserAvatarProps,
  UserWithMetrics,
  UserPermissions,
  UserSearchResult,
} from './types';

// Services - API Functions
export {
  getAllUsers,
  getUserById,
  searchUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserPreferences,
  updateUserPreferences,
  getUserRoles,
  getUserActivity,
  logUserActivity,
  getUserStats,
  suspendUser,
  activateUser,
  getUsersByRole,
  getUsersByOrganization,
} from './services';

// Services - Utilities
export {
  formatUserName,
  getUserInitials,
  formatUserStatus,
  getUserStatusColor,
  hasPermission,
  getUserPermissions,
  formatRegistrationDate,
  calculateVerificationCompletion,
  formatContributionScore,
  getUserActivitySummary,
  formatLastActivityTime,
  mergeUserWithMetrics,
  isValidEmail,
  isValidPhoneNumber,
  getRoleLevel,
  canEditUser,
} from './services';

// Store - Actions/Thunks
export {
  fetchAllUsers,
  fetchUserById,
  searchUsersList,
  createNewUser,
  updateUserProfile,
  deleteUserAccount,
  updateUserPrefs,
  fetchUserActivityLog,
  fetchUserStatistics,
  suspendUserAccount,
  activateUserAccount,
  fetchUsersByRole,
  fetchUsersByOrganization,
  clearError,
  setFilter,
  setPagination,
  selectUser,
  setCurrentUser,
  clearUsers,
} from './store';

// Store - Selectors
export {
  selectAllUsers,
  selectSelectedUser,
  selectCurrentUser,
  selectUserActivities,
  selectUserActivityStatistics,
  selectIsLoading,
  selectError,
  selectUserFilter,
  selectPagination,
  selectUserPreferences,
  selectUsersByRole,
  selectUsersByStatus,
  selectUserById,
  selectVerifiedUsers,
  selectUnverifiedUsers,
  selectActiveUsers,
  selectSuspendedUsers,
  selectUsersByOrganization,
  selectUserCount,
  selectVerifiedUserCount,
  selectActiveUserCount,
  selectSuspendedUserCount,
  selectUsersGroupedByRole,
  selectUsersGroupedByStatus,
  selectUsersGroupedByOrganization,
  selectRecentlyActiveUsers,
  selectTopContributors,
  selectUserStatsByUserId,
  selectRecentUserActivities,
  selectAverageUserStats,
} from './store';

// Hooks
export { useUsers, useUserProfile, useUserUpdate } from './hooks';

// Components
export {
  UserAvatar,
  UserProfile,
  UserList,
  UserSettings,
  UserRoles,
  UserStats,
} from './components';
