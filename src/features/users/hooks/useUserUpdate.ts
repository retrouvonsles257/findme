/**
 * =====================================================
 * RETROUVONSLES - useUserUpdate Hook
 * Hook for user update and preference operations
 * =====================================================
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  updateUserProfile,
  updateUserPrefs,
  suspendUserAccount,
  activateUserAccount,
  deleteUserAccount,
} from '../store/userSlice';
import { selectIsLoading, selectError } from '../store/userSelectors';
import type { UserUpdatePayload, UserPreferencesUpdatePayload } from '../types';

export interface UseUserUpdateResult {
  isLoading: boolean;
  error: string | null;

  updateProfile: (userId: string, payload: UserUpdatePayload) => Promise<void>;
  updatePreferences: (userId: string, payload: UserPreferencesUpdatePayload) => Promise<void>;
  suspendUser: (userId: string, raison?: string) => Promise<void>;
  activateUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
}

export const useUserUpdate = (): UseUserUpdateResult => {
  const dispatch = useDispatch<AppDispatch>();

  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const updateProfile = useCallback(
    async (userId: string, payload: UserUpdatePayload) => {
      try {
        await (dispatch(updateUserProfile({ userId, payload })) as any).unwrap();
      } catch (err) {
        console.error('Error updating profile:', err);
        throw err;
      }
    },
    [dispatch]
  );

  const updatePreferences = useCallback(
    async (userId: string, payload: UserPreferencesUpdatePayload) => {
      try {
        await (dispatch(updateUserPrefs({ userId, payload })) as any).unwrap();
      } catch (err) {
        console.error('Error updating preferences:', err);
        throw err;
      }
    },
    [dispatch]
  );

  const suspendUser = useCallback(
    async (userId: string, raison?: string) => {
      try {
        await (dispatch(suspendUserAccount({ userId, raison })) as any).unwrap();
      } catch (err) {
        console.error('Error suspending user:', err);
        throw err;
      }
    },
    [dispatch]
  );

  const activateUser = useCallback(
    async (userId: string) => {
      try {
        await (dispatch(activateUserAccount(userId)) as any).unwrap();
      } catch (err) {
        console.error('Error activating user:', err);
        throw err;
      }
    },
    [dispatch]
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        await (dispatch(deleteUserAccount(userId)) as any).unwrap();
      } catch (err) {
        console.error('Error deleting user:', err);
        throw err;
      }
    },
    [dispatch]
  );

  return {
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    suspendUser,
    activateUser,
    deleteUser,
  };
};
