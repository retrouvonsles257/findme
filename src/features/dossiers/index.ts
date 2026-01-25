/**
 * =====================================================
 * RETROUVONSLES - Dossiers Feature Index
 * Central export point for all dossier functionality
 * =====================================================
 */

// Components
export {
  DossierDetail,
  DossierList,
  DossierHeader,
  DossierStatus,
  DossierPhotos,
  DossierStatistics,
  DossierFilters,
  DossierActions,
  DossierTimeline,
  DossierCircumstances,
  DossierContact,
  DossierMap,
} from './components';

// Hooks
export {
  useDossiers,
  useDossierCreate,
  useDossierUpdate,
  useDossierDelete,
  useDossierDetail,
  useDossierActions,
} from './hooks';

export type {
  UseDossiersReturn,
  UseDossierCreateReturn,
  UseDossierUpdateReturn,
  UseDossierDeleteReturn,
  UseDossierDetailReturn,
  UseDossierActionsReturn,
} from './hooks';

// Services
export * from './services';

// Redux Store
export { dossierReducer, DOSSIER_ACTIONS, initialState } from './store';
export * from './store/dossierSelectors';

// Types
export * from './types';

export type {
  DossierFormValues,
  DossierUpdateInput,
  DossierDisplayData,
  DossierValidationErrors,
  DossierStoreState,
  DossierFilterCriteria,
  DossierNotification,
  DossierAction,
  DossierModal,
  DossierUIState,
  DossierTimelineEntry,
  DossierSearchParams,
  DossierTrend,
  LocationHeatmap,
  PriorityQueue,
} from './types';
