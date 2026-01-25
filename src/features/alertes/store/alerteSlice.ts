/**
 * =====================================================
 * RETROUVONSLES - Alertes Redux Slice
 * Gestion d'état Redux pour les alertes
 * =====================================================
 */

import type { AlerteStoreState } from '../types';

// ============================================
// INITIAL STATE
// ============================================

const initialState: AlerteStoreState = {
  alertes: [],
  filteredAlertes: [],
  selectedAlerte: null,
  selectedAlertes: [],
  currentPage: 1,
  pageSize: 10,
  total: 0,
  filters: {},
  statistics: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isDiffusing: false,
  error: null,
  errors: {},
  sortBy: 'date',
  sortOrder: 'desc',
};

// ============================================
// ACTIONS
// ============================================

export const ALERTE_ACTIONS = {
  // Fetch
  FETCH_ALERTES_REQUEST: 'FETCH_ALERTES_REQUEST',
  FETCH_ALERTES_SUCCESS: 'FETCH_ALERTES_SUCCESS',
  FETCH_ALERTES_ERROR: 'FETCH_ALERTES_ERROR',

  // Detail
  FETCH_ALERTE_REQUEST: 'FETCH_ALERTE_REQUEST',
  FETCH_ALERTE_SUCCESS: 'FETCH_ALERTE_SUCCESS',
  FETCH_ALERTE_ERROR: 'FETCH_ALERTE_ERROR',

  // Create
  CREATE_ALERTE_REQUEST: 'CREATE_ALERTE_REQUEST',
  CREATE_ALERTE_SUCCESS: 'CREATE_ALERTE_SUCCESS',
  CREATE_ALERTE_ERROR: 'CREATE_ALERTE_ERROR',

  // Update
  UPDATE_ALERTE_REQUEST: 'UPDATE_ALERTE_REQUEST',
  UPDATE_ALERTE_SUCCESS: 'UPDATE_ALERTE_SUCCESS',
  UPDATE_ALERTE_ERROR: 'UPDATE_ALERTE_ERROR',

  // Delete
  DELETE_ALERTE_REQUEST: 'DELETE_ALERTE_REQUEST',
  DELETE_ALERTE_SUCCESS: 'DELETE_ALERTE_SUCCESS',
  DELETE_ALERTE_ERROR: 'DELETE_ALERTE_ERROR',

  // Diffuse
  DIFFUSE_ALERTE_REQUEST: 'DIFFUSE_ALERTE_REQUEST',
  DIFFUSE_ALERTE_SUCCESS: 'DIFFUSE_ALERTE_SUCCESS',
  DIFFUSE_ALERTE_ERROR: 'DIFFUSE_ALERTE_ERROR',

  // Status Change
  UPDATE_STATUS_REQUEST: 'UPDATE_STATUS_REQUEST',
  UPDATE_STATUS_SUCCESS: 'UPDATE_STATUS_SUCCESS',
  UPDATE_STATUS_ERROR: 'UPDATE_STATUS_ERROR',

  // Filters & Search
  SET_FILTERS: 'SET_FILTERS',
  CLEAR_FILTERS: 'CLEAR_FILTERS',
  SET_SEARCH: 'SET_SEARCH',

  // Pagination
  SET_PAGE: 'SET_PAGE',
  SET_PAGE_SIZE: 'SET_PAGE_SIZE',

  // Sorting
  SET_SORT: 'SET_SORT',

  // Selection
  SELECT_ALERTE: 'SELECT_ALERTE',
  DESELECT_ALERTE: 'DESELECT_ALERTE',
  SELECT_MULTIPLE: 'SELECT_MULTIPLE',
  CLEAR_SELECTION: 'CLEAR_SELECTION',

  // Statistics
  FETCH_STATISTICS_REQUEST: 'FETCH_STATISTICS_REQUEST',
  FETCH_STATISTICS_SUCCESS: 'FETCH_STATISTICS_SUCCESS',
  FETCH_STATISTICS_ERROR: 'FETCH_STATISTICS_ERROR',

  // Reset
  RESET_ERRORS: 'RESET_ERRORS',
  RESET_STATE: 'RESET_STATE',
};

// ============================================
// REDUCER
// ============================================

export const alerteReducer = (
  state: AlerteStoreState = initialState,
  action: any,
): AlerteStoreState => {
  switch (action.type) {
    // ===== FETCH ALERTES =====
    case ALERTE_ACTIONS.FETCH_ALERTES_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case ALERTE_ACTIONS.FETCH_ALERTES_SUCCESS:
      return {
        ...state,
        isLoading: false,
        alertes: action.payload.data,
        filteredAlertes: action.payload.data,
        total: action.payload.total,
        error: null,
      };

    case ALERTE_ACTIONS.FETCH_ALERTES_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== FETCH SINGLE ALERTE =====
    case ALERTE_ACTIONS.FETCH_ALERTE_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case ALERTE_ACTIONS.FETCH_ALERTE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        selectedAlerte: action.payload,
        error: null,
      };

    case ALERTE_ACTIONS.FETCH_ALERTE_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== CREATE ALERTE =====
    case ALERTE_ACTIONS.CREATE_ALERTE_REQUEST:
      return {
        ...state,
        isCreating: true,
        error: null,
        errors: {},
      };

    case ALERTE_ACTIONS.CREATE_ALERTE_SUCCESS:
      return {
        ...state,
        isCreating: false,
        alertes: [action.payload, ...state.alertes],
        filteredAlertes: [action.payload, ...state.filteredAlertes],
        total: state.total + 1,
        error: null,
      };

    case ALERTE_ACTIONS.CREATE_ALERTE_ERROR:
      return {
        ...state,
        isCreating: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    // ===== UPDATE ALERTE =====
    case ALERTE_ACTIONS.UPDATE_ALERTE_REQUEST:
      return {
        ...state,
        isUpdating: true,
        error: null,
        errors: {},
      };

    case ALERTE_ACTIONS.UPDATE_ALERTE_SUCCESS:
      return {
        ...state,
        isUpdating: false,
        alertes: state.alertes.map((a) => (a.id === action.payload.id ? action.payload : a)),
        filteredAlertes: state.filteredAlertes.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
        selectedAlerte:
          state.selectedAlerte?.id === action.payload.id ? action.payload : state.selectedAlerte,
        error: null,
      };

    case ALERTE_ACTIONS.UPDATE_ALERTE_ERROR:
      return {
        ...state,
        isUpdating: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    // ===== DELETE ALERTE =====
    case ALERTE_ACTIONS.DELETE_ALERTE_REQUEST:
      return {
        ...state,
        isDeleting: true,
        error: null,
      };

    case ALERTE_ACTIONS.DELETE_ALERTE_SUCCESS:
      return {
        ...state,
        isDeleting: false,
        alertes: state.alertes.filter((a) => a.id !== action.payload),
        filteredAlertes: state.filteredAlertes.filter((a) => a.id !== action.payload),
        selectedAlertes: state.selectedAlertes.filter((id) => id !== action.payload),
        selectedAlerte:
          state.selectedAlerte?.id === action.payload ? null : state.selectedAlerte,
        total: Math.max(0, state.total - 1),
        error: null,
      };

    case ALERTE_ACTIONS.DELETE_ALERTE_ERROR:
      return {
        ...state,
        isDeleting: false,
        error: action.payload,
      };

    // ===== DIFFUSE ALERTE =====
    case ALERTE_ACTIONS.DIFFUSE_ALERTE_REQUEST:
      return {
        ...state,
        isDiffusing: true,
        error: null,
      };

    case ALERTE_ACTIONS.DIFFUSE_ALERTE_SUCCESS:
      return {
        ...state,
        isDiffusing: false,
        selectedAlerte: action.payload,
        error: null,
      };

    case ALERTE_ACTIONS.DIFFUSE_ALERTE_ERROR:
      return {
        ...state,
        isDiffusing: false,
        error: action.payload,
      };

    // ===== UPDATE STATUS =====
    case ALERTE_ACTIONS.UPDATE_STATUS_REQUEST:
      return {
        ...state,
        isUpdating: true,
        error: null,
      };

    case ALERTE_ACTIONS.UPDATE_STATUS_SUCCESS:
      return {
        ...state,
        isUpdating: false,
        alertes: state.alertes.map((a) => (a.id === action.payload.id ? action.payload : a)),
        filteredAlertes: state.filteredAlertes.map((a) =>
          a.id === action.payload.id ? action.payload : a,
        ),
        selectedAlerte:
          state.selectedAlerte?.id === action.payload.id ? action.payload : state.selectedAlerte,
        error: null,
      };

    case ALERTE_ACTIONS.UPDATE_STATUS_ERROR:
      return {
        ...state,
        isUpdating: false,
        error: action.payload,
      };

    // ===== FILTERS & SEARCH =====
    case ALERTE_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
        currentPage: 1,
      };

    case ALERTE_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: {},
        filteredAlertes: state.alertes,
        currentPage: 1,
      };

    case ALERTE_ACTIONS.SET_SEARCH:
      return {
        ...state,
        filters: { ...state.filters, search: action.payload },
        currentPage: 1,
      };

    // ===== PAGINATION =====
    case ALERTE_ACTIONS.SET_PAGE:
      return {
        ...state,
        currentPage: action.payload,
      };

    case ALERTE_ACTIONS.SET_PAGE_SIZE:
      return {
        ...state,
        pageSize: action.payload,
        currentPage: 1,
      };

    // ===== SORTING =====
    case ALERTE_ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    // ===== SELECTION =====
    case ALERTE_ACTIONS.SELECT_ALERTE:
      return {
        ...state,
        selectedAlertes: [action.payload],
        selectedAlerte: state.alertes.find((a) => a.id === action.payload) || null,
      };

    case ALERTE_ACTIONS.DESELECT_ALERTE:
      return {
        ...state,
        selectedAlertes: state.selectedAlertes.filter((id) => id !== action.payload),
      };

    case ALERTE_ACTIONS.SELECT_MULTIPLE:
      return {
        ...state,
        selectedAlertes: action.payload,
      };

    case ALERTE_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedAlertes: [],
        selectedAlerte: null,
      };

    // ===== STATISTICS =====
    case ALERTE_ACTIONS.FETCH_STATISTICS_REQUEST:
      return {
        ...state,
        isLoading: true,
      };

    case ALERTE_ACTIONS.FETCH_STATISTICS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        statistics: action.payload,
      };

    case ALERTE_ACTIONS.FETCH_STATISTICS_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== RESET =====
    case ALERTE_ACTIONS.RESET_ERRORS:
      return {
        ...state,
        error: null,
        errors: {},
      };

    case ALERTE_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

export default alerteReducer;
