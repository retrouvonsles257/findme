/**
 * =====================================================
 * RETROUVONSLES - Redux Hooks
 * Custom typed hooks for Redux dispatch and selectors
 * =====================================================
 */

import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Typed dispatch hook
 * Use throughout app instead of plain useDispatch
 */
export const useAppDispatch = (): AppDispatch => {
  return useDispatch<AppDispatch>();
};

/**
 * Typed selector hook
 * Use throughout app instead of plain useSelector
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Common selector hook - get current user
 */
export const useCurrentUser = () => {
  return useAppSelector((state: RootState) => (state as any).auth?.user);
};

/**
 * Common selector hook - get auth state
 */
export const useAuthState = () => {
  return useAppSelector((state: RootState) => (state as any).auth);
};

/**
 * Common selector hook - get loading state
 */
export const useLoading = () => {
  return useAppSelector((state: RootState) => (state as any).ui?.isLoading);
};

/**
 * Common selector hook - get UI state
 */
export const useUIState = () => {
  return useAppSelector((state: RootState) => (state as any).ui);
};

/**
 * Common selector hook - get notifications
 */
export const useNotifications = () => {
  return useAppSelector((state: RootState) => (state as any).ui?.notifications || []);
};

/**
 * Common selector hook - get filters
 */
export const useFilters = () => {
  return useAppSelector((state: RootState) => (state as any).filters);
};

/**
 * Common selector hook - check if user is authenticated
 */
export const useIsAuthenticated = () => {
  return useAppSelector((state: RootState) => !!(state as any).auth?.user);
};

/**
 * Common selector hook - get user role
 */
export const useUserRole = () => {
  return useAppSelector((state: RootState) => (state as any).auth?.user?.role);
};

/**
 * Common selector hook - get user organisation
 */
export const useUserOrganisation = () => {
  return useAppSelector((state: RootState) => (state as any).auth?.user?.organisationId);
};

export default {
  useAppDispatch,
  useAppSelector,
  useCurrentUser,
  useAuthState,
  useLoading,
  useUIState,
  useNotifications,
  useFilters,
  useIsAuthenticated,
  useUserRole,
  useUserOrganisation,
};
