/**
 * Services Barrel Export
 */

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
} from './userAPI';

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
} from './userService';
