/**
 * =====================================================
 * RETROUVONSLES - UI Selectors
 * Redux selectors for accessing UI state
 * =====================================================
 */

import type { UIState } from './uiSlice';

/**
 * Root UI state selector
 */
export const selectUIState = (state: any): UIState => (state as any).ui;

/**
 * Sidebar selectors
 */
export const selectSidebarOpen = (state: any) => (state as any).ui.sidebarOpen;
export const selectSidebarCollapsed = (state: any) => (state as any).ui.sidebarCollapsed;
export const selectNavDrawerOpen = (state: any) => (state as any).ui.navDrawerOpen;

/**
 * Modal selectors
 */
export const selectModals = (state: any) => (state as any).ui.modals;
export const selectModalById = (modalId: string) => (state: any) =>
  (state as any).ui.modals[modalId];
export const selectModalIsOpen = (modalId: string) => (state: any) =>
  (state as any).ui.modals[modalId]?.isOpen || false;
export const selectModalData = (modalId: string) => (state: any) =>
  (state as any).ui.modals[modalId]?.data;

/**
 * Notification selectors
 */
export const selectNotifications = (state: any) => (state as any).ui.notifications;
export const selectNotificationCount = (state: any) =>
  (state as any).ui.notifications.length;
export const selectNotificationById = (id: string) => (state: any) =>
  (state as any).ui.notifications.find((n: any) => n.id === id);

/**
 * Loading selectors
 */
export const selectIsLoading = (state: any) => (state as any).ui.isLoading;
export const selectLoadingMessage = (state: any) => (state as any).ui.loadingMessage;

/**
 * Theme and locale selectors
 */
export const selectTheme = (state: any) => (state as any).ui.theme;
export const selectLocale = (state: any) => (state as any).ui.locale;

/**
 * Right panel selectors
 */
export const selectRightPanelOpen = (state: any) => (state as any).ui.rightPanelOpen;
export const selectRightPanelContent = (state: any) => (state as any).ui.rightPanelContent;

/**
 * Drawer selectors
 */
export const selectDrawerOpen = (state: any) => (state as any).ui.drawerOpen;
export const selectDrawerContent = (state: any) => (state as any).ui.drawerContent;

/**
 * Search selectors
 */
export const selectSearchOpen = (state: any) => (state as any).ui.searchOpen;
export const selectSearchQuery = (state: any) => (state as any).ui.searchQuery;

const uiSelectors = {
  selectUIState,
  selectSidebarOpen,
  selectSidebarCollapsed,
  selectNavDrawerOpen,
  selectModals,
  selectModalById,
  selectModalIsOpen,
  selectModalData,
  selectNotifications,
  selectNotificationCount,
  selectNotificationById,
  selectIsLoading,
  selectLoadingMessage,
  selectTheme,
  selectLocale,
  selectRightPanelOpen,
  selectRightPanelContent,
  selectDrawerOpen,
  selectDrawerContent,
  selectSearchOpen,
  selectSearchQuery,
};

export default uiSelectors;
