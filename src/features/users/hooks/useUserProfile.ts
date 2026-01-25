/**
 * =====================================================
 * RETROUVONSLES - useUserProfile Hook
 * Hook for user profile operations
 * =====================================================
 */

import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchUserById,
  fetchUserActivityLog,
  fetchUserStatistics,
  updateUserProfile,
  setCurrentUser,
} from '../store/userSlice';
import {
  selectSelectedUser,
  selectUserActivities,
  selectUserStatsByUserId,
  selectIsLoading,
  selectError,
} from '../store/userSelectors';
import type { UserProfile, UserUpdatePayload, UserActivity, UserStats } from '../types';

export interface UseUserProfileResult {
  user: UserProfile | null;
  activities: UserActivity[];
  stats: UserStats | undefined;
  isLoading: boolean;
  error: string | null;

  fetchUser: (userId: string) => void;
  fetchActivity: (userId: string) => void;
  fetchStats: (userId: string) => void;
  updateProfile: (userId: string, payload: UserUpdatePayload) => void;
  setAsCurrentUser: (user: UserProfile | null) => void;
}

export const useUserProfile = (): UseUserProfileResult => {
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(selectSelectedUser);
  const activities = useSelector(selectUserActivities);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const stats = useSelector((state: any) =>
    user ? selectUserStatsByUserId(state, user.id) : undefined
  );

  const fetchUser = useCallback(
    (userId: string) => {
      dispatch(fetchUserById(userId));
    },
    [dispatch]
  );

  const fetchActivity = useCallback(
    (userId: string) => {
      dispatch(fetchUserActivityLog(userId));
    },
    [dispatch]
  );

  const fetchStats = useCallback(
    (userId: string) => {
      dispatch(fetchUserStatistics(userId));
    },
    [dispatch]
  );

  const updateProfile = useCallback(
    (userId: string, payload: UserUpdatePayload) => {
      dispatch(updateUserProfile({ userId, payload }));
    },
    [dispatch]
  );

  const setAsCurrentUser = useCallback(
    (userProfile: UserProfile | null) => {
      dispatch(setCurrentUser(userProfile));
    },
    [dispatch]
  );

  // Auto-fetch when user changes
  useEffect(() => {
    if (user?.id) {
      fetchActivity(user.id);
      fetchStats(user.id);
    }
  }, [user?.id, fetchActivity, fetchStats]);

  return {
    user,
    activities,
    stats,
    isLoading,
    error,
    fetchUser,
    fetchActivity,
    fetchStats,
    updateProfile,
    setAsCurrentUser,
  };
};
