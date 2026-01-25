/**
 * =====================================================
 * RETROUVONSLES - Store Barrel Export
 * Central export point for all Redux store functionality
 * =====================================================
 */

// Export store and types
export { store, type RootState, type AppDispatch } from './store';

// Export typed hooks
export {
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
} from './hooks';

// Export root reducer
export { rootReducer } from './rootReducer';

// Export middleware
export {
  apiMiddleware,
  errorMiddleware,
  loggerMiddleware,
  simpleLoggerMiddleware,
  allMiddleware,
  productionMiddleware,
} from './middleware/index';

// Export slices and actions
export { UI_ACTIONS, type UIState } from './slices/uiSlice';
export { FILTER_ACTIONS, type FilterState } from './slices/filterSlice';

// Export selectors and actions from slices
export * from './slices/uiSelectors';
export * from './slices/uiActions';
export * from './slices/filterSelectors';
export * from './slices/filterActions';

// Note: Feature-specific selectors and actions should be imported directly from their respective feature modules
// to avoid naming conflicts. Only export what's needed at the app level.
