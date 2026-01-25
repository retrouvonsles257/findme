/**
 * =====================================================
 * RETROUVONSLES - Filter State Slice
 * Global filter state for search, pagination, sorting, etc.
 * =====================================================
 */

// ============================================
// TYPES
// ============================================

export interface FilterState {
  // Personnes filters
  personnesFilters: {
    searchQuery: string;
    statut?: string;
    ageMin?: number;
    ageMax?: number;
    genre?: string;
    localiteDispariton?: string;
    dateDebut?: string;
    dateFin?: string;
    sortBy: 'date_desc' | 'date_asc' | 'nom' | 'pertinence';
  };

  // Dossiers filters
  dossiersFilters: {
    searchQuery: string;
    statut?: string;
    priorite?: string;
    assigneA?: string;
    dateCreationDebut?: string;
    dateCreationFin?: string;
    sortBy: 'date_desc' | 'date_asc' | 'priorite' | 'nom';
  };

  // Signalements filters
  signalementFilters: {
    searchQuery: string;
    statut?: string;
    fiabilite?: string;
    lieu?: string;
    dateDebut?: string;
    dateFin?: string;
    sortBy: 'date_desc' | 'date_asc' | 'fiabilite';
  };

  // Organisations filters
  organisationsFilters: {
    searchQuery: string;
    type?: string;
    statut?: string;
    sortBy: 'nom' | 'date';
  };

  // Users filters
  usersFilters: {
    searchQuery: string;
    role?: string;
    statut?: string;
    organisation?: string;
    sortBy: 'nom' | 'email' | 'date';
  };

  // Global pagination
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems?: number;
    totalPages?: number;
  };

  // Advanced filters
  advancedFilters: {
    isOpen: boolean;
    activeTab?: string;
  };
}

// ============================================
// INITIAL STATE
// ============================================

const initialState: FilterState = {
  personnesFilters: {
    searchQuery: '',
    sortBy: 'date_desc',
  },
  dossiersFilters: {
    searchQuery: '',
    sortBy: 'date_desc',
  },
  signalementFilters: {
    searchQuery: '',
    sortBy: 'date_desc',
  },
  organisationsFilters: {
    searchQuery: '',
    sortBy: 'nom',
  },
  usersFilters: {
    searchQuery: '',
    sortBy: 'nom',
  },
  pagination: {
    currentPage: 1,
    pageSize: 20,
  },
  advancedFilters: {
    isOpen: false,
  },
};

// ============================================
// ACTIONS
// ============================================

export const FILTER_ACTIONS = {
  // Personnes
  SET_PERSONNES_FILTERS: 'filter/setPersonnesFilters',
  UPDATE_PERSONNES_FILTERS: 'filter/updatePersonnesFilters',
  RESET_PERSONNES_FILTERS: 'filter/resetPersonnesFilters',

  // Dossiers
  SET_DOSSIERS_FILTERS: 'filter/setDossiersFilters',
  UPDATE_DOSSIERS_FILTERS: 'filter/updateDossiersFilters',
  RESET_DOSSIERS_FILTERS: 'filter/resetDossiersFilters',

  // Signalements
  SET_SIGNALEMENT_FILTERS: 'filter/setSignalementFilters',
  UPDATE_SIGNALEMENT_FILTERS: 'filter/updateSignalementFilters',
  RESET_SIGNALEMENT_FILTERS: 'filter/resetSignalementFilters',

  // Organisations
  SET_ORGANISATIONS_FILTERS: 'filter/setOrganisationsFilters',
  UPDATE_ORGANISATIONS_FILTERS: 'filter/updateOrganisationsFilters',
  RESET_ORGANISATIONS_FILTERS: 'filter/resetOrganisationsFilters',

  // Users
  SET_USERS_FILTERS: 'filter/setUsersFilters',
  UPDATE_USERS_FILTERS: 'filter/updateUsersFilters',
  RESET_USERS_FILTERS: 'filter/resetUsersFilters',

  // Pagination
  SET_PAGINATION: 'filter/setPagination',
  SET_PAGE: 'filter/setPage',
  SET_PAGE_SIZE: 'filter/setPageSize',

  // Advanced filters
  TOGGLE_ADVANCED_FILTERS: 'filter/toggleAdvancedFilters',
  SET_ADVANCED_FILTERS_TAB: 'filter/setAdvancedFiltersTab',

  // Reset all
  RESET_ALL_FILTERS: 'filter/resetAllFilters',
};

// ============================================
// REDUCER
// ============================================

export const filterReducer = (state = initialState, action: any): FilterState => {
  switch (action.type) {
    // Personnes
    case FILTER_ACTIONS.SET_PERSONNES_FILTERS:
      return {
        ...state,
        personnesFilters: action.payload,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.UPDATE_PERSONNES_FILTERS:
      return {
        ...state,
        personnesFilters: { ...state.personnesFilters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.RESET_PERSONNES_FILTERS:
      return {
        ...state,
        personnesFilters: initialState.personnesFilters,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    // Dossiers
    case FILTER_ACTIONS.SET_DOSSIERS_FILTERS:
      return {
        ...state,
        dossiersFilters: action.payload,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.UPDATE_DOSSIERS_FILTERS:
      return {
        ...state,
        dossiersFilters: { ...state.dossiersFilters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.RESET_DOSSIERS_FILTERS:
      return {
        ...state,
        dossiersFilters: initialState.dossiersFilters,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    // Signalements
    case FILTER_ACTIONS.SET_SIGNALEMENT_FILTERS:
      return {
        ...state,
        signalementFilters: action.payload,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.UPDATE_SIGNALEMENT_FILTERS:
      return {
        ...state,
        signalementFilters: { ...state.signalementFilters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.RESET_SIGNALEMENT_FILTERS:
      return {
        ...state,
        signalementFilters: initialState.signalementFilters,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    // Organisations
    case FILTER_ACTIONS.SET_ORGANISATIONS_FILTERS:
      return {
        ...state,
        organisationsFilters: action.payload,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.UPDATE_ORGANISATIONS_FILTERS:
      return {
        ...state,
        organisationsFilters: { ...state.organisationsFilters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.RESET_ORGANISATIONS_FILTERS:
      return {
        ...state,
        organisationsFilters: initialState.organisationsFilters,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    // Users
    case FILTER_ACTIONS.SET_USERS_FILTERS:
      return {
        ...state,
        usersFilters: action.payload,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.UPDATE_USERS_FILTERS:
      return {
        ...state,
        usersFilters: { ...state.usersFilters, ...action.payload },
        pagination: { ...state.pagination, currentPage: 1 },
      };

    case FILTER_ACTIONS.RESET_USERS_FILTERS:
      return {
        ...state,
        usersFilters: initialState.usersFilters,
        pagination: { ...state.pagination, currentPage: 1 },
      };

    // Pagination
    case FILTER_ACTIONS.SET_PAGINATION:
      return {
        ...state,
        pagination: action.payload,
      };

    case FILTER_ACTIONS.SET_PAGE:
      return {
        ...state,
        pagination: { ...state.pagination, currentPage: action.payload },
      };

    case FILTER_ACTIONS.SET_PAGE_SIZE:
      return {
        ...state,
        pagination: { ...state.pagination, pageSize: action.payload, currentPage: 1 },
      };

    // Advanced filters
    case FILTER_ACTIONS.TOGGLE_ADVANCED_FILTERS:
      return {
        ...state,
        advancedFilters: {
          ...state.advancedFilters,
          isOpen: !state.advancedFilters.isOpen,
        },
      };

    case FILTER_ACTIONS.SET_ADVANCED_FILTERS_TAB:
      return {
        ...state,
        advancedFilters: {
          ...state.advancedFilters,
          activeTab: action.payload,
        },
      };

    // Reset all
    case FILTER_ACTIONS.RESET_ALL_FILTERS:
      return initialState;

    default:
      return state;
  }
};

export default filterReducer;
