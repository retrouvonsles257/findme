/**
 * =====================================================
 * RETROUVONSLES - Alertes Feature Index
 * Exports centralisés pour la feature alertes
 * =====================================================
 */

// ============================================
// COMPONENTS
// ============================================

export {
  AlerteCreate,
  AlerteDetail,
  AlerteList,
  AlertePreview,
  AlerteStats,
  AlerteZoneSelector,
  AlerteDiffusion,
} from './components';

export type {
  AlerteCreateProps,
  AlerteDetailProps,
  AlerteListProps,
  AlertePreviewProps,
  AlerteStatsProps,
  AlerteZoneSelectorProps,
  AlerteDiffusionProps,
  Zone,
} from './components';

// ============================================
// HOOKS
// ============================================

export { useAlertes, useAlerteDiffusion } from './hooks';

export type {
  UseAlertsState,
  UseAlertsActions,
  UseAlertsReturn,
  DiffusionSettings,
  DiffusionResult,
  DiffusionStats,
  UseAlerteDiffusionState,
  UseAlerteDiffusionActions,
  UseAlerteDiffusionReturn,
} from './hooks';

// ============================================
// SERVICES
// ============================================

export * from './services';

export type {
  AlerteCreateInput,
  AlerteUpdateInput,
  AlerteFilters,
  AlerteStats as AlerteStatsType,
  AlerteFormData,
  AlerteDisplayData,
  AlerteValidationErrors,
} from './services';

// ============================================
// STORE & STATE MANAGEMENT
// ============================================

export { alerteReducer, ALERTE_ACTIONS } from './store';

export {
  selectAlerteState,
  selectAlertes,
  selectFilteredAlertes,
  selectPaginatedAlertes,
  selectAlerteById,
  selectSelectedAlerte,
  selectSelectedAlerteIds,
  selectAlertesByStatus,
  selectAlertesByType,
  selectActiveAlertes,
  selectDraftAlertes,
  selectAlertesBySearch,
  selectCurrentPage,
  selectPageSize,
  selectTotal,
  selectTotalPages,
  selectIsLastPage,
  selectFilters,
  selectSortBy,
  selectSortOrder,
  selectStatistics,
  selectTotalAlertes,
  selectActiveAlertesCount,
  selectAlertesByTypeStats,
  selectAlertesByStatusStats,
  selectIsLoading,
  selectIsCreating,
  selectIsUpdating,
  selectIsDeleting,
  selectIsDiffusing,
  selectError,
  selectFieldErrors,
  selectFieldError,
  selectHasAlertes,
  selectHasSelection,
  selectSelectionCount,
  selectAllAlertsSelected,
  selectIsProcessing,
} from './store';

export type { AlerteStoreState, AlerteAction } from './store';

// ============================================
// TYPES
// ============================================

export * from './types';

export type {
  AlerteWithRelations,
  AlerteFormValues,
  AlerteFilterCriteria,
  AlerteDiffusionPayload,
  AlerteStatistics,
  AlerteNotification,
  AlerteModal,
} from './types';
