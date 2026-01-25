/**
 * =====================================================
 * RETROUVONSLES - Hooks Barrel Export
 * Central export for all custom hooks
 * =====================================================
 */

// Async & Data
export { useAsync, type UseAsyncState, type UseAsyncResult } from './useAsync';
export { useSearch, type UseSearchResult } from './useSearch';
export { useDebounce } from './useDebounce';
export { useThrottle } from './useThrottle';

// Form & Input
export {
  useForm,
  type UseFormState,
  type UseFormErrors,
  type UseFormResult,
} from './useForm';
export { useFilter, type UseFilterState, type UseFilterResult } from './useFilter';

// Pagination & Sorting
export { usePagination, type UsePaginationState, type UsePaginationResult } from './usePagination';
export { useSort, type UseSortResult, type SortDirection } from './useSort';
export { useTable, type UseTableState, type UseTableResult } from './useTable';

// UI & DOM
export { useClickOutside } from './useClickOutside';
export { useCopyToClipboard, type UseCopyToClipboardResult } from './useCopyToClipboard';
export { useToggle, type UseToggleResult } from './useToggle';
export { useWindowSize, type WindowSize } from './useWindowSize';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useIsDarkMode } from './useMediaQuery';

// Keyboard & Input
export { useKeypress, useKeyboardShortcut } from './useKeypress';

// Storage
export { useLocalStorage, type UseLocalStorageResult } from './useLocalStorage';
export { useSessionStorage, type UseSessionStorageResult } from './useSessionStorage';

// Geolocation & Network
export { useGeolocation, type GeolocationCoordinates, type UseGeolocationResult } from './useGeolocation';
export { useOnlineStatus, type UseOnlineStatusResult } from './useOnlineStatus';
export { useWebsocket, type UseWebsocketOptions, type UseWebsocketResult } from './useWebsocket';

// Scroll
export { useInfiniteScroll, type UseInfiniteScrollOptions, type UseInfiniteScrollResult } from './useInfiniteScroll';

// Utilities
export { usePrevious } from './usePrevious';

// Notifications
export { useNotification, type NotificationType, type NotificationPayload, type UseNotificationResult } from './useNotification';

// Permissions
export { usePermissions, type UsePermissionsResult } from './usePermissions';

// Internationalization
export { useI18n, type UseI18nResult } from './useI18n';
