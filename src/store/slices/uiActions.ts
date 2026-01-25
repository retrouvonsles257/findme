/**
 * =====================================================
 * RETROUVONSLES - UI Action Creators
 * Redux action creators for UI state
 * =====================================================
 */

import { UI_ACTIONS } from './uiSlice';

/**
 * Sidebar actions
 */
export const toggleSidebar = () => ({
  type: UI_ACTIONS.TOGGLE_SIDEBAR,
});

export const setSidebarOpen = (isOpen: boolean) => ({
  type: UI_ACTIONS.SET_SIDEBAR_OPEN,
  payload: isOpen,
});

export const collapseSidebar = () => ({
  type: UI_ACTIONS.COLLAPSE_SIDEBAR,
});

export const expandSidebar = () => ({
  type: UI_ACTIONS.EXPAND_SIDEBAR,
});

/**
 * Modal actions
 */
export const openModal = (modalId: string, data?: any) => ({
  type: UI_ACTIONS.OPEN_MODAL,
  payload: { modalId, data },
});

export const closeModal = (modalId: string) => ({
  type: UI_ACTIONS.CLOSE_MODAL,
  payload: modalId,
});

export const closeAllModals = () => ({
  type: UI_ACTIONS.CLOSE_ALL_MODALS,
});

/**
 * Notification actions
 */
export const addNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  message: string,
  duration?: number
) => ({
  type: UI_ACTIONS.ADD_NOTIFICATION,
  payload: {
    id: `notification_${Date.now()}`,
    type,
    message,
    duration: duration || 5000,
    timestamp: Date.now(),
  },
});

export const removeNotification = (id: string) => ({
  type: UI_ACTIONS.REMOVE_NOTIFICATION,
  payload: id,
});

export const clearNotifications = () => ({
  type: UI_ACTIONS.CLEAR_NOTIFICATIONS,
});

/**
 * Loading actions
 */
export const setLoading = (isLoading: boolean, message?: string) => ({
  type: UI_ACTIONS.SET_LOADING,
  payload: { isLoading, message },
});

export const startLoading = (message?: string) => ({
  type: UI_ACTIONS.START_LOADING,
  payload: message,
});

export const stopLoading = () => ({
  type: UI_ACTIONS.STOP_LOADING,
});

/**
 * Theme and locale actions
 */
export const setTheme = (theme: 'light' | 'dark') => ({
  type: UI_ACTIONS.SET_THEME,
  payload: theme,
});

export const setLocale = (locale: string) => ({
  type: UI_ACTIONS.SET_LOCALE,
  payload: locale,
});

/**
 * Right panel actions
 */
export const openRightPanel = () => ({
  type: UI_ACTIONS.OPEN_RIGHT_PANEL,
});

export const closeRightPanel = () => ({
  type: UI_ACTIONS.CLOSE_RIGHT_PANEL,
});

export const setRightPanelContent = (content: string) => ({
  type: UI_ACTIONS.SET_RIGHT_PANEL_CONTENT,
  payload: content,
});

/**
 * Drawer actions
 */
export const openDrawer = () => ({
  type: UI_ACTIONS.OPEN_DRAWER,
});

export const closeDrawer = () => ({
  type: UI_ACTIONS.CLOSE_DRAWER,
});

export const setDrawerContent = (content: string) => ({
  type: UI_ACTIONS.SET_DRAWER_CONTENT,
  payload: content,
});

/**
 * Search actions
 */
export const openSearch = () => ({
  type: UI_ACTIONS.OPEN_SEARCH,
});

export const closeSearch = () => ({
  type: UI_ACTIONS.CLOSE_SEARCH,
});

export const setSearchQuery = (query: string) => ({
  type: UI_ACTIONS.SET_SEARCH_QUERY,
  payload: query,
});

const uiActionsObj = {
  toggleSidebar,
  setSidebarOpen,
  collapseSidebar,
  expandSidebar,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading,
  startLoading,
  stopLoading,
  setTheme,
  setLocale,
  openRightPanel,
  closeRightPanel,
  setRightPanelContent,
  openDrawer,
  closeDrawer,
  setDrawerContent,
  openSearch,
  closeSearch,
  setSearchQuery,
};

export default uiActionsObj;