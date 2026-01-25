/**
 * =====================================================
 * RETROUVONSLES - Dons Redux Slice
 * Gestion d'état Redux pour les dons
 * =====================================================
 */

import type { DonStoreState } from '../types';

// ============================================
// INITIAL STATE
// ============================================

const initialState: DonStoreState = {
  dons: [],
  filteredDons: [],
  selectedDon: null,
  selectedDons: [],
  currentPage: 1,
  pageSize: 10,
  total: 0,
  filters: {},
  statistics: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isProcessingPayment: false,
  error: null,
  errors: {},
  sortBy: 'date',
  sortOrder: 'desc',
};

// ============================================
// ACTIONS
// ============================================

export const DON_ACTIONS = {
  // Fetch
  FETCH_DONS_REQUEST: 'FETCH_DONS_REQUEST',
  FETCH_DONS_SUCCESS: 'FETCH_DONS_SUCCESS',
  FETCH_DONS_ERROR: 'FETCH_DONS_ERROR',

  // Detail
  FETCH_DON_REQUEST: 'FETCH_DON_REQUEST',
  FETCH_DON_SUCCESS: 'FETCH_DON_SUCCESS',
  FETCH_DON_ERROR: 'FETCH_DON_ERROR',

  // Create
  CREATE_DON_REQUEST: 'CREATE_DON_REQUEST',
  CREATE_DON_SUCCESS: 'CREATE_DON_SUCCESS',
  CREATE_DON_ERROR: 'CREATE_DON_ERROR',

  // Update
  UPDATE_DON_REQUEST: 'UPDATE_DON_REQUEST',
  UPDATE_DON_SUCCESS: 'UPDATE_DON_SUCCESS',
  UPDATE_DON_ERROR: 'UPDATE_DON_ERROR',

  // Delete
  DELETE_DON_REQUEST: 'DELETE_DON_REQUEST',
  DELETE_DON_SUCCESS: 'DELETE_DON_SUCCESS',
  DELETE_DON_ERROR: 'DELETE_DON_ERROR',

  // Payment
  PROCESS_PAYMENT_REQUEST: 'PROCESS_PAYMENT_REQUEST',
  PROCESS_PAYMENT_SUCCESS: 'PROCESS_PAYMENT_SUCCESS',
  PROCESS_PAYMENT_ERROR: 'PROCESS_PAYMENT_ERROR',

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
  SELECT_DON: 'SELECT_DON',
  DESELECT_DON: 'DESELECT_DON',
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

export const donReducer = (
  state: DonStoreState = initialState,
  action: any,
): DonStoreState => {
  switch (action.type) {
    // ===== FETCH DONS =====
    case DON_ACTIONS.FETCH_DONS_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case DON_ACTIONS.FETCH_DONS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        dons: action.payload.data,
        filteredDons: action.payload.data,
        total: action.payload.total,
        error: null,
      };

    case DON_ACTIONS.FETCH_DONS_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== FETCH SINGLE DON =====
    case DON_ACTIONS.FETCH_DON_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case DON_ACTIONS.FETCH_DON_SUCCESS:
      return {
        ...state,
        isLoading: false,
        selectedDon: action.payload,
        error: null,
      };

    case DON_ACTIONS.FETCH_DON_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== CREATE DON =====
    case DON_ACTIONS.CREATE_DON_REQUEST:
      return {
        ...state,
        isCreating: true,
        error: null,
        errors: {},
      };

    case DON_ACTIONS.CREATE_DON_SUCCESS:
      return {
        ...state,
        isCreating: false,
        dons: [action.payload, ...state.dons],
        filteredDons: [action.payload, ...state.filteredDons],
        total: state.total + 1,
        error: null,
      };

    case DON_ACTIONS.CREATE_DON_ERROR:
      return {
        ...state,
        isCreating: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    // ===== UPDATE DON =====
    case DON_ACTIONS.UPDATE_DON_REQUEST:
      return {
        ...state,
        isUpdating: true,
        error: null,
        errors: {},
      };

    case DON_ACTIONS.UPDATE_DON_SUCCESS:
      return {
        ...state,
        isUpdating: false,
        dons: state.dons.map((d) => (d.id === action.payload.id ? action.payload : d)),
        filteredDons: state.filteredDons.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        ),
        selectedDon: state.selectedDon?.id === action.payload.id ? action.payload : state.selectedDon,
        error: null,
      };

    case DON_ACTIONS.UPDATE_DON_ERROR:
      return {
        ...state,
        isUpdating: false,
        error: action.payload.message,
        errors: action.payload.errors || {},
      };

    // ===== DELETE DON =====
    case DON_ACTIONS.DELETE_DON_REQUEST:
      return {
        ...state,
        isDeleting: true,
        error: null,
      };

    case DON_ACTIONS.DELETE_DON_SUCCESS:
      return {
        ...state,
        isDeleting: false,
        dons: state.dons.filter((d) => d.id !== action.payload),
        filteredDons: state.filteredDons.filter((d) => d.id !== action.payload),
        selectedDon: state.selectedDon?.id === action.payload ? null : state.selectedDon,
        total: Math.max(0, state.total - 1),
        error: null,
      };

    case DON_ACTIONS.DELETE_DON_ERROR:
      return {
        ...state,
        isDeleting: false,
        error: action.payload,
      };

    // ===== PAYMENT PROCESSING =====
    case DON_ACTIONS.PROCESS_PAYMENT_REQUEST:
      return {
        ...state,
        isProcessingPayment: true,
        error: null,
      };

    case DON_ACTIONS.PROCESS_PAYMENT_SUCCESS:
      return {
        ...state,
        isProcessingPayment: false,
        selectedDon: action.payload,
        error: null,
      };

    case DON_ACTIONS.PROCESS_PAYMENT_ERROR:
      return {
        ...state,
        isProcessingPayment: false,
        error: action.payload,
      };

    // ===== UPDATE STATUS =====
    case DON_ACTIONS.UPDATE_STATUS_REQUEST:
      return {
        ...state,
        isUpdating: true,
        error: null,
      };

    case DON_ACTIONS.UPDATE_STATUS_SUCCESS:
      return {
        ...state,
        isUpdating: false,
        dons: state.dons.map((d) => (d.id === action.payload.id ? action.payload : d)),
        filteredDons: state.filteredDons.map((d) =>
          d.id === action.payload.id ? action.payload : d,
        ),
        error: null,
      };

    case DON_ACTIONS.UPDATE_STATUS_ERROR:
      return {
        ...state,
        isUpdating: false,
        error: action.payload,
      };

    // ===== FILTERS & SEARCH =====
    case DON_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: action.payload,
        currentPage: 1,
      };

    case DON_ACTIONS.CLEAR_FILTERS:
      return {
        ...state,
        filters: {},
        filteredDons: state.dons,
        currentPage: 1,
      };

    case DON_ACTIONS.SET_SEARCH:
      return {
        ...state,
        filters: {
          ...state.filters,
          search: action.payload,
        },
        currentPage: 1,
      };

    // ===== PAGINATION =====
    case DON_ACTIONS.SET_PAGE:
      return {
        ...state,
        currentPage: action.payload,
      };

    case DON_ACTIONS.SET_PAGE_SIZE:
      return {
        ...state,
        pageSize: action.payload,
        currentPage: 1,
      };

    // ===== SORTING =====
    case DON_ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    // ===== SELECTION =====
    case DON_ACTIONS.SELECT_DON:
      return {
        ...state,
        selectedDon: action.payload,
      };

    case DON_ACTIONS.DESELECT_DON:
      return {
        ...state,
        selectedDon: null,
      };

    case DON_ACTIONS.SELECT_MULTIPLE:
      return {
        ...state,
        selectedDons: action.payload,
      };

    case DON_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedDon: null,
        selectedDons: [],
      };

    // ===== STATISTICS =====
    case DON_ACTIONS.FETCH_STATISTICS_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case DON_ACTIONS.FETCH_STATISTICS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        statistics: action.payload,
        error: null,
      };

    case DON_ACTIONS.FETCH_STATISTICS_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // ===== RESET =====
    case DON_ACTIONS.RESET_ERRORS:
      return {
        ...state,
        error: null,
        errors: {},
      };

    case DON_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};

export default donReducer;
