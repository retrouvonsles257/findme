/**
 * =====================================================
 * RETROUVONSLES - Users Redux Selectors
 * Redux selectors for users state
 * =====================================================
 */

import type { RootState } from '../../../store/types';
import type { UserProfile, UserActivity, UserStats, UserState } from '../types';

// Helper function to safely access users state
const usersState = (state: RootState) => (state.users as UserState) || {};

// ============================================
// BASIC SELECTORS
// ============================================

export const selectAllUsers = (state: RootState): UserProfile[] =>
  usersState(state).users || [];

export const selectSelectedUser = (state: RootState): UserProfile | null =>
  usersState(state).selectedUser || null;

export const selectCurrentUser = (state: RootState): UserProfile | null =>
  usersState(state).currentUser || null;

export const selectUserActivities = (state: RootState): UserActivity[] =>
  usersState(state).activities || [];

export const selectUserActivityStatistics = (state: RootState) =>
  usersState(state).activities;

export const selectIsLoading = (state: RootState): boolean =>
  usersState(state).isLoading || false;

export const selectError = (state: RootState): string | null =>
  usersState(state).error || null;

export const selectUserFilter = (state: RootState) =>
  usersState(state).filter;

export const selectPagination = (state: RootState) =>
  usersState(state).pagination;

export const selectUserPreferences = (state: RootState) =>
  usersState(state).preferences;

// ============================================
// FILTERED SELECTORS
// ============================================

export const selectUsersByRole = (state: RootState, role: string): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => u.role === role) || [];

export const selectUsersByStatus = (state: RootState, status: string): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => u.statut_compte === status) || [];

export const selectUserById = (state: RootState, id: string): UserProfile | undefined =>
  usersState(state).users?.find((u: UserProfile) => u.id === id);

export const selectVerifiedUsers = (state: RootState): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => u.email_confirme) || [];

export const selectUnverifiedUsers = (state: RootState): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => !u.email_confirme) || [];

export const selectActiveUsers = (state: RootState): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => u.statut_compte === 'actif') || [];

export const selectSuspendedUsers = (state: RootState): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => u.statut_compte === 'suspendu') || [];

export const selectUsersByOrganization = (state: RootState, orgId: string): UserProfile[] =>
  usersState(state).users?.filter((u: UserProfile) => u.organisation_id === orgId) || [];

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectUserCount = (state: RootState): number =>
  usersState(state).users?.length || 0;

export const selectVerifiedUserCount = (state: RootState): number =>
  usersState(state).users?.filter((u: UserProfile) => u.email_confirme).length || 0;

export const selectActiveUserCount = (state: RootState): number =>
  usersState(state).users?.filter((u: UserProfile) => u.statut_compte === 'actif').length || 0;

export const selectSuspendedUserCount = (state: RootState): number =>
  usersState(state).users?.filter((u: UserProfile) => u.statut_compte === 'suspendu').length || 0;

export const selectUsersGroupedByRole = (state: RootState): Record<string, UserProfile[]> => {
  const grouped: Record<string, UserProfile[]> = {};
  (usersState(state).users || []).forEach((u: UserProfile) => {
    const key = u.role || 'unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(u);
  });
  return grouped;
};

export const selectUsersGroupedByStatus = (state: RootState): Record<string, UserProfile[]> => {
  const grouped: Record<string, UserProfile[]> = {};
  (usersState(state).users || []).forEach((u: UserProfile) => {
    const key = u.statut_compte || 'unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(u);
  });
  return grouped;
};

export const selectUsersGroupedByOrganization = (state: RootState): Record<string, UserProfile[]> => {
  const grouped: Record<string, UserProfile[]> = {};
  (usersState(state).users || []).forEach((u: UserProfile) => {
    const key = u.organisation_id || 'independent';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(u);
  });
  return grouped;
};

export const selectRecentlyActiveUsers = (state: RootState, daysBack = 7): UserProfile[] => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return (usersState(state).users || []).filter((u: UserProfile) => {
    if (!u.derniere_connexion) return false;
    const lastLogin = new Date(u.derniere_connexion);
    return lastLogin > cutoffDate;
  });
};

export const selectTopContributors = (state: RootState, limit = 10): UserProfile[] => {
  const users = usersState(state).users || [];
  return users
    .slice()
    .sort((a: UserProfile, b: UserProfile) => {
      const scoreA = a.preferences?.notifications_email ? 1 : 0;
      const scoreB = b.preferences?.notifications_email ? 1 : 0;
      return scoreB - scoreA;
    })
    .slice(0, limit);
};

export const selectUserStatsByUserId = (state: RootState, userId: string): UserStats | undefined =>
  usersState(state).stats?.find((s: UserStats) => s.user_id === userId);

export const selectRecentUserActivities = (state: RootState, limit = 10): UserActivity[] =>
  (usersState(state).activities || []).slice(0, limit);

export const selectAverageUserStats = (state: RootState) => {
  const stats = usersState(state).stats || [];
  if (stats.length === 0) {
    return {
      avg_signalements: 0,
      avg_dossiers: 0,
      avg_verifications: 0,
      avg_resolution_rate: 0,
    };
  }

  const total = stats.reduce(
    (acc: any, stat: UserStats) => ({
      signalements: acc.signalements + stat.nombre_signalements,
      dossiers: acc.dossiers + stat.nombre_dossiers_crees,
      verifications: acc.verifications + stat.nombre_verifications,
      rate: acc.rate + stat.taux_resolution,
    }),
    { signalements: 0, dossiers: 0, verifications: 0, rate: 0 }
  );

  const count = stats.length;

  return {
    avg_signalements: Math.round(total.signalements / count),
    avg_dossiers: Math.round(total.dossiers / count),
    avg_verifications: Math.round(total.verifications / count),
    avg_resolution_rate: Math.round(total.rate / count),
  };
};

export const selectUserStatistics = (state: RootState) => {
  const allUsers = usersState(state).users || [];
  const stats = usersState(state).stats || [];

  return {
    total_users: allUsers.length,
    verified_users: allUsers.filter((u: UserProfile) => u.email_confirme).length,
    active_users: allUsers.filter((u: UserProfile) => u.statut_compte === 'actif').length,
    suspended_users: allUsers.filter((u: UserProfile) => u.statut_compte === 'suspendu').length,
    total_signalements: stats.reduce((sum: number, s: UserStats) => sum + s.nombre_signalements, 0),
    total_dossiers: stats.reduce((sum: number, s: UserStats) => sum + s.nombre_dossiers_crees, 0),
    total_verifications: stats.reduce((sum: number, s: UserStats) => sum + s.nombre_verifications, 0),
  };
};
