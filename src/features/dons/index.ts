/**
 * =====================================================
 * RETROUVONSLES - Dons Feature Index
 * Exports centralisés pour la feature dons
 * =====================================================
 */

// ============================================
// COMPONENTS
// ============================================

export {
  DonationForm,
  DonationHistory,
  DonationStats,
  DonationSuccess,
  PaymentMethods,
} from './components';

export type {
  DonationFormProps,
  DonationHistoryProps,
  DonationStatsProps,
  DonationSuccessProps,
  PaymentMethodsProps,
} from './components';

// ============================================
// HOOKS
// ============================================

export { useDons, useDonationCreate, useDonationHistory } from './hooks';

export type {
  UseDonsState,
  UseDonsActions,
  UseDonsReturn,
  UseDonationCreateState,
  UseDonationCreateActions,
  UseDonationCreateReturn,
  UseDonationHistoryState,
  UseDonationHistoryActions,
  UseDonationHistoryReturn,
} from './hooks';

// ============================================
// SERVICES
// ============================================

export * from './services';

export type {
  DonCreateInput,
  DonUpdateInput,
  DonFilters,
  DonStats,
  DonFormData,
  DonDisplayData,
  DonValidationErrors,
  PaymentInitiation,
  PaymentVerification,
  PaymentResult,
} from './services';

// ============================================
// STORE & STATE MANAGEMENT
// ============================================

export { donReducer, DON_ACTIONS } from './store';

export {
  selectDonState,
  selectDons,
  selectFilteredDons,
  selectPaginatedDons,
  selectDonById,
  selectSelectedDon,
  selectSelectedDonIds,
  selectDonsByStatus,
  selectDonsByType,
  selectSuccessfulDons,
  selectPendingDons,
  selectFailedDons,
  selectCurrentPage,
  selectPageSize,
  selectTotal,
  selectTotalPages,
  selectIsLastPage,
  selectFilters,
  selectSortBy,
  selectSortOrder,
  selectStatistics,
  selectTotalAmount,
  selectSuccessfulDonsCount,
  selectAverageDonAmount,
  selectIsLoading,
  selectIsCreating,
  selectIsUpdating,
  selectIsDeleting,
  selectIsProcessingPayment,
  selectError,
  selectFieldErrors,
  selectFieldError,
  selectHasDons,
  selectHasSelection,
  selectSelectionCount,
  selectAllDonsSelected,
  selectIsProcessing,
  selectRecentDons,
} from './store';

export type { DonStoreState, DonAction } from './store';

// ============================================
// TYPES
// ============================================

export * from './types';

export type {
  DonFormValues,
  DonDisplayData as DonDisplayDataType,
  DonValidationErrors as DonValidationErrorsType,
  PaymentMethod,
  PaymentConfig,
  PaymentResult as PaymentResultType,
  DonStatistics,
  DonationTrend,
  DonStoreState as DonStoreStateType,
  DonFilterCriteria,
  DonNotification,
  DonModal,
  DonationReceipt,
  RecurringDonationConfig,
} from './types';
