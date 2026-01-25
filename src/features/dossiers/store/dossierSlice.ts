/**
 * =====================================================
 * RETROUVONSLES - Dossier Redux Slice
 * State management for dossiers feature
 * =====================================================
 */

import type { DossierStoreState } from '../types';

// ============================================
// INITIAL STATE
// ============================================

export const initialState: DossierStoreState = {
  dossiers: [],
  selectedDossier: null,
  loading: false,
  error: null,
  fieldErrors: {},

  filters: {},
  currentPage: 0,
  pageSize: 20,
  totalCount: 0,
  totalPages: 0,

  sortBy: 'date',
  sortOrder: 'desc',

  selectedDossierIds: [],

  statistics: null,
  statistics_loading: false,

  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isProcessingAction: false,

  modal: {
    isOpen: false,
    type: 'view',
  },

  recentDossiers: [],
  urgentDossiers: [],
};

// ============================================
// ACTION TYPES
// ============================================

export const DOSSIER_ACTIONS = {
  // Fetch operations
  FETCH_DOSSIERS_START: 'DOSSIERS/FETCH_DOSSIERS_START',
  FETCH_DOSSIERS_SUCCESS: 'DOSSIERS/FETCH_DOSSIERS_SUCCESS',
  FETCH_DOSSIERS_ERROR: 'DOSSIERS/FETCH_DOSSIERS_ERROR',

  FETCH_DOSSIER_BY_ID_START: 'DOSSIERS/FETCH_DOSSIER_BY_ID_START',
  FETCH_DOSSIER_BY_ID_SUCCESS: 'DOSSIERS/FETCH_DOSSIER_BY_ID_SUCCESS',
  FETCH_DOSSIER_BY_ID_ERROR: 'DOSSIERS/FETCH_DOSSIER_BY_ID_ERROR',

  // Create operations
  CREATE_DOSSIER_START: 'DOSSIERS/CREATE_DOSSIER_START',
  CREATE_DOSSIER_SUCCESS: 'DOSSIERS/CREATE_DOSSIER_SUCCESS',
  CREATE_DOSSIER_ERROR: 'DOSSIERS/CREATE_DOSSIER_ERROR',

  // Update operations
  UPDATE_DOSSIER_START: 'DOSSIERS/UPDATE_DOSSIER_START',
  UPDATE_DOSSIER_SUCCESS: 'DOSSIERS/UPDATE_DOSSIER_SUCCESS',
  UPDATE_DOSSIER_ERROR: 'DOSSIERS/UPDATE_DOSSIER_ERROR',

  // Delete operations
  DELETE_DOSSIER_START: 'DOSSIERS/DELETE_DOSSIER_START',
  DELETE_DOSSIER_SUCCESS: 'DOSSIERS/DELETE_DOSSIER_SUCCESS',
  DELETE_DOSSIER_ERROR: 'DOSSIERS/DELETE_DOSSIER_ERROR',

  // Filters & Pagination
  SET_FILTERS: 'DOSSIERS/SET_FILTERS',
  SET_CURRENT_PAGE: 'DOSSIERS/SET_CURRENT_PAGE',
  SET_PAGE_SIZE: 'DOSSIERS/SET_PAGE_SIZE',
  SET_SORT: 'DOSSIERS/SET_SORT',

  // Selection
  SELECT_DOSSIER: 'DOSSIERS/SELECT_DOSSIER',
  SELECT_MULTIPLE: 'DOSSIERS/SELECT_MULTIPLE',
  CLEAR_SELECTION: 'DOSSIERS/CLEAR_SELECTION',

  // Statistics
  FETCH_STATISTICS_START: 'DOSSIERS/FETCH_STATISTICS_START',
  FETCH_STATISTICS_SUCCESS: 'DOSSIERS/FETCH_STATISTICS_SUCCESS',
  FETCH_STATISTICS_ERROR: 'DOSSIERS/FETCH_STATISTICS_ERROR',

  // Modal
  OPEN_MODAL: 'DOSSIERS/OPEN_MODAL',
  CLOSE_MODAL: 'DOSSIERS/CLOSE_MODAL',

  // Field errors
  SET_FIELD_ERRORS: 'DOSSIERS/SET_FIELD_ERRORS',
  CLEAR_FIELD_ERRORS: 'DOSSIERS/CLEAR_FIELD_ERRORS',

  // Reset
  RESET_STATE: 'DOSSIERS/RESET_STATE',

  // Fetch recent
  FETCH_RECENT_SUCCESS: 'DOSSIERS/FETCH_RECENT_SUCCESS',
  FETCH_URGENT_SUCCESS: 'DOSSIERS/FETCH_URGENT_SUCCESS',
};

// ============================================
// REDUCER
// ============================================

export const dossierReducer = (
  state: DossierStoreState = initialState,
  action: any,
): DossierStoreState => {
  switch (action.type) {
    // ---- FETCH ----
    case DOSSIER_ACTIONS.FETCH_DOSSIERS_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case DOSSIER_ACTIONS.FETCH_DOSSIERS_SUCCESS:
      return {
        ...state,
        dossiers: action.payload.data,
        totalCount: action.payload.count,
        totalPages: Math.ceil(action.payload.count / state.pageSize),
        loading: false,
        error: null,
      };

    case DOSSIER_ACTIONS.FETCH_DOSSIERS_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case DOSSIER_ACTIONS.FETCH_DOSSIER_BY_ID_START:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case DOSSIER_ACTIONS.FETCH_DOSSIER_BY_ID_SUCCESS:
      return {
        ...state,
        selectedDossier: action.payload,
        loading: false,
        error: null,
      };

    case DOSSIER_ACTIONS.FETCH_DOSSIER_BY_ID_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    // ---- CREATE ----
    case DOSSIER_ACTIONS.CREATE_DOSSIER_START:
      return {
        ...state,
        isCreating: true,
        error: null,
        fieldErrors: {},
      };

    case DOSSIER_ACTIONS.CREATE_DOSSIER_SUCCESS:
      return {
        ...state,
        dossiers: [action.payload, ...state.dossiers],
        isCreating: false,
        error: null,
        fieldErrors: {},
        totalCount: state.totalCount + 1,
      };

    case DOSSIER_ACTIONS.CREATE_DOSSIER_ERROR:
      return {
        ...state,
        isCreating: false,
        error: action.payload.message,
        fieldErrors: action.payload.fieldErrors || {},
      };

    // ---- UPDATE ----
    case DOSSIER_ACTIONS.UPDATE_DOSSIER_START:
      return {
        ...state,
        isUpdating: true,
        error: null,
      };

    case DOSSIER_ACTIONS.UPDATE_DOSSIER_SUCCESS: {
      const updatedDossiers = state.dossiers.map((d) =>
        d.id === action.payload.id ? action.payload : d,
      );
      return {
        ...state,
        dossiers: updatedDossiers,
        selectedDossier:
          state.selectedDossier?.id === action.payload.id ? action.payload : state.selectedDossier,
        isUpdating: false,
        error: null,
      };
    }

    case DOSSIER_ACTIONS.UPDATE_DOSSIER_ERROR:
      return {
        ...state,
        isUpdating: false,
        error: action.payload,
      };

    // ---- DELETE ----
    case DOSSIER_ACTIONS.DELETE_DOSSIER_START:
      return {
        ...state,
        isDeleting: true,
        error: null,
      };

    case DOSSIER_ACTIONS.DELETE_DOSSIER_SUCCESS: {
      const filteredDossiers = state.dossiers.filter((d) => d.id !== action.payload);
      return {
        ...state,
        dossiers: filteredDossiers,
        selectedDossier: state.selectedDossier?.id === action.payload ? null : state.selectedDossier,
        selectedDossierIds: state.selectedDossierIds.filter((id) => id !== action.payload),
        isDeleting: false,
        error: null,
        totalCount: Math.max(0, state.totalCount - 1),
      };
    }

    case DOSSIER_ACTIONS.DELETE_DOSSIER_ERROR:
      return {
        ...state,
        isDeleting: false,
        error: action.payload,
      };

    // ---- FILTERS ----
    case DOSSIER_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: action.payload,
        currentPage: 0,
      };

    case DOSSIER_ACTIONS.SET_CURRENT_PAGE:
      return {
        ...state,
        currentPage: action.payload,
      };

    case DOSSIER_ACTIONS.SET_PAGE_SIZE:
      return {
        ...state,
        pageSize: action.payload,
        currentPage: 0,
        totalPages: Math.ceil(state.totalCount / action.payload),
      };

    case DOSSIER_ACTIONS.SET_SORT:
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortOrder: action.payload.sortOrder,
      };

    // ---- SELECTION ----
    case DOSSIER_ACTIONS.SELECT_DOSSIER:
      return {
        ...state,
        selectedDossierIds: [action.payload],
      };

    case DOSSIER_ACTIONS.SELECT_MULTIPLE:
      return {
        ...state,
        selectedDossierIds: action.payload,
      };

    case DOSSIER_ACTIONS.CLEAR_SELECTION:
      return {
        ...state,
        selectedDossierIds: [],
      };

    // ---- STATISTICS ----
    case DOSSIER_ACTIONS.FETCH_STATISTICS_START:
      return {
        ...state,
        statistics_loading: true,
      };

    case DOSSIER_ACTIONS.FETCH_STATISTICS_SUCCESS:
      return {
        ...state,
        statistics: action.payload,
        statistics_loading: false,
      };

    case DOSSIER_ACTIONS.FETCH_STATISTICS_ERROR:
      return {
        ...state,
        statistics_loading: false,
        error: action.payload,
      };

    // ---- MODAL ----
    case DOSSIER_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        modal: {
          isOpen: true,
          type: action.payload.type,
          dossierId: action.payload.dossierId,
          data: action.payload.data,
        },
      };

    case DOSSIER_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        modal: {
          isOpen: false,
          type: 'view',
        },
      };

    // ---- FIELD ERRORS ----
    case DOSSIER_ACTIONS.SET_FIELD_ERRORS:
      return {
        ...state,
        fieldErrors: action.payload,
      };

    case DOSSIER_ACTIONS.CLEAR_FIELD_ERRORS:
      return {
        ...state,
        fieldErrors: {},
      };

    // ---- RECENT ----
    case DOSSIER_ACTIONS.FETCH_RECENT_SUCCESS:
      return {
        ...state,
        recentDossiers: action.payload,
      };

    case DOSSIER_ACTIONS.FETCH_URGENT_SUCCESS:
      return {
        ...state,
        urgentDossiers: action.payload,
      };

    // ---- RESET ----
    case DOSSIER_ACTIONS.RESET_STATE:
      return initialState;

    default:
      return state;
  }
};
