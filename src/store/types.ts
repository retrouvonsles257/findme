/**
 * =====================================================
 * RETROUVONSLES - Redux Store Types
 * Type definitions for Redux store state and dispatch
 * =====================================================
 */

import type { TypedUseSelectorHook } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import type { store } from './store';

/**
 * Root state type - inferred from store getState
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * App dispatch type - inferred from store dispatch
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed selector hook for use throughout the app
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Typed dispatch hook
 */
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

