/**
 * =====================================================
 * RETROUVONSLES - UI State Slice
 * Global UI state management (modals, sidebars, tooltips, etc.)
 * =====================================================
 */

// ============================================
// TYPES
// ============================================

export interface UIState {
  // Sidebar & Navigation
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  navDrawerOpen: boolean;

  // Modals
  modals: Record<string, {
    isOpen: boolean;
    data?: any;
  }>;

  // Notifications & Toast
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
    timestamp: number;
  }>;

  // Loading states
  isLoading: boolean;
  loadingMessage?: string;

  // Theme
  theme: 'light' | 'dark';
  locale: string;

  // Right panel
  rightPanelOpen: boolean;
  rightPanelContent?: string;

  // Drawer
  drawerOpen: boolean;
  drawerContent?: string;

  // Tooltip
  tooltipId?: string;

  // Search
  searchOpen: boolean;
  searchQuery: string;
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: UIState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  navDrawerOpen: false,
  modals: {},
  notifications: [],
  isLoading: false,
  theme: 'light',
  locale: 'fr',
  rightPanelOpen: false,
  drawerOpen: false,
  searchOpen: false,
  searchQuery: '',
};

// ============================================
// ACTIONS
// ============================================

export const UI_ACTIONS = {
  // Sidebar
  TOGGLE_SIDEBAR: 'ui/toggleSidebar',
  SET_SIDEBAR_OPEN: 'ui/setSidebarOpen',
  COLLAPSE_SIDEBAR: 'ui/collapseSidebar',
  EXPAND_SIDEBAR: 'ui/expandSidebar',

  // Modals
  OPEN_MODAL: 'ui/openModal',
  CLOSE_MODAL: 'ui/closeModal',
  CLOSE_ALL_MODALS: 'ui/closeAllModals',

  // Notifications
  ADD_NOTIFICATION: 'ui/addNotification',
  REMOVE_NOTIFICATION: 'ui/removeNotification',
  CLEAR_NOTIFICATIONS: 'ui/clearNotifications',

  // Loading
  SET_LOADING: 'ui/setLoading',
  START_LOADING: 'ui/startLoading',
  STOP_LOADING: 'ui/stopLoading',

  // Theme & Locale
  SET_THEME: 'ui/setTheme',
  SET_LOCALE: 'ui/setLocale',

  // Right Panel
  OPEN_RIGHT_PANEL: 'ui/openRightPanel',
  CLOSE_RIGHT_PANEL: 'ui/closeRightPanel',
  SET_RIGHT_PANEL_CONTENT: 'ui/setRightPanelContent',

  // Drawer
  OPEN_DRAWER: 'ui/openDrawer',
  CLOSE_DRAWER: 'ui/closeDrawer',
  SET_DRAWER_CONTENT: 'ui/setDrawerContent',

  // Search
  OPEN_SEARCH: 'ui/openSearch',
  CLOSE_SEARCH: 'ui/closeSearch',
  SET_SEARCH_QUERY: 'ui/setSearchQuery',
};

// ============================================
// REDUCER
// ============================================

export const uiReducer = (state = initialState, action: any): UIState => {
  switch (action.type) {
    // Sidebar
    case UI_ACTIONS.TOGGLE_SIDEBAR:
      return { ...state, sidebarOpen: !state.sidebarOpen };

    case UI_ACTIONS.SET_SIDEBAR_OPEN:
      return { ...state, sidebarOpen: action.payload };

    case UI_ACTIONS.COLLAPSE_SIDEBAR:
      return { ...state, sidebarCollapsed: true, sidebarOpen: true };

    case UI_ACTIONS.EXPAND_SIDEBAR:
      return { ...state, sidebarCollapsed: false };

    // Modals
    case UI_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload.modalId]: {
            isOpen: true,
            data: action.payload.data,
          },
        },
      };

    case UI_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modals: {
          ...state.modals,
          [action.payload]: { isOpen: false },
        },
      };

    case UI_ACTIONS.CLOSE_ALL_MODALS:
      return {
        ...state,
        modals: Object.keys(state.modals).reduce(
          (acc, key) => ({
            ...acc,
            [key]: { isOpen: false },
          }),
          {}
        ),
      };

    // Notifications
    case UI_ACTIONS.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };

    case UI_ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload
        ),
      };

    case UI_ACTIONS.CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };

    // Loading
    case UI_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.isLoading,
        loadingMessage: action.payload.message,
      };

    case UI_ACTIONS.START_LOADING:
      return { ...state, isLoading: true, loadingMessage: action.payload };

    case UI_ACTIONS.STOP_LOADING:
      return { ...state, isLoading: false, loadingMessage: undefined };

    // Theme & Locale
    case UI_ACTIONS.SET_THEME:
      return { ...state, theme: action.payload };

    case UI_ACTIONS.SET_LOCALE:
      return { ...state, locale: action.payload };

    // Right Panel
    case UI_ACTIONS.OPEN_RIGHT_PANEL:
      return { ...state, rightPanelOpen: true };

    case UI_ACTIONS.CLOSE_RIGHT_PANEL:
      return { ...state, rightPanelOpen: false };

    case UI_ACTIONS.SET_RIGHT_PANEL_CONTENT:
      return { ...state, rightPanelContent: action.payload };

    // Drawer
    case UI_ACTIONS.OPEN_DRAWER:
      return { ...state, drawerOpen: true };

    case UI_ACTIONS.CLOSE_DRAWER:
      return { ...state, drawerOpen: false };

    case UI_ACTIONS.SET_DRAWER_CONTENT:
      return { ...state, drawerContent: action.payload };

    // Search
    case UI_ACTIONS.OPEN_SEARCH:
      return { ...state, searchOpen: true };

    case UI_ACTIONS.CLOSE_SEARCH:
      return { ...state, searchOpen: false };

    case UI_ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload };

    default:
      return state;
  }
};

export default uiReducer;
