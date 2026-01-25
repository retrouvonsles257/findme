/**
 * =====================================================
 * RETROUVONSLES - Filter Action Creators
 * Redux action creators for filter state
 * =====================================================
 */

import { FILTER_ACTIONS } from './filterSlice';

/**
 * Personnes filter actions
 */
export const setPersonnesFilters = (filters: any) => ({
  type: FILTER_ACTIONS.SET_PERSONNES_FILTERS,
  payload: filters,
});

export const updatePersonnesFilters = (filters: any) => ({
  type: FILTER_ACTIONS.UPDATE_PERSONNES_FILTERS,
  payload: filters,
});

export const resetPersonnesFilters = () => ({
  type: FILTER_ACTIONS.RESET_PERSONNES_FILTERS,
});

/**
 * Dossiers filter actions
 */
export const setDossiersFilters = (filters: any) => ({
  type: FILTER_ACTIONS.SET_DOSSIERS_FILTERS,
  payload: filters,
});

export const updateDossiersFilters = (filters: any) => ({
  type: FILTER_ACTIONS.UPDATE_DOSSIERS_FILTERS,
  payload: filters,
});

export const resetDossiersFilters = () => ({
  type: FILTER_ACTIONS.RESET_DOSSIERS_FILTERS,
});

/**
 * Signalements filter actions
 */
export const setSignalementFilters = (filters: any) => ({
  type: FILTER_ACTIONS.SET_SIGNALEMENT_FILTERS,
  payload: filters,
});

export const updateSignalementFilters = (filters: any) => ({
  type: FILTER_ACTIONS.UPDATE_SIGNALEMENT_FILTERS,
  payload: filters,
});

export const resetSignalementFilters = () => ({
  type: FILTER_ACTIONS.RESET_SIGNALEMENT_FILTERS,
});

/**
 * Organisations filter actions
 */
export const setOrganisationsFilters = (filters: any) => ({
  type: FILTER_ACTIONS.SET_ORGANISATIONS_FILTERS,
  payload: filters,
});

export const updateOrganisationsFilters = (filters: any) => ({
  type: FILTER_ACTIONS.UPDATE_ORGANISATIONS_FILTERS,
  payload: filters,
});

export const resetOrganisationsFilters = () => ({
  type: FILTER_ACTIONS.RESET_ORGANISATIONS_FILTERS,
});

/**
 * Users filter actions
 */
export const setUsersFilters = (filters: any) => ({
  type: FILTER_ACTIONS.SET_USERS_FILTERS,
  payload: filters,
});

export const updateUsersFilters = (filters: any) => ({
  type: FILTER_ACTIONS.UPDATE_USERS_FILTERS,
  payload: filters,
});

export const resetUsersFilters = () => ({
  type: FILTER_ACTIONS.RESET_USERS_FILTERS,
});

/**
 * Pagination actions
 */
export const setPagination = (pagination: any) => ({
  type: FILTER_ACTIONS.SET_PAGINATION,
  payload: pagination,
});

export const setPage = (page: number) => ({
  type: FILTER_ACTIONS.SET_PAGE,
  payload: page,
});

export const setPageSize = (pageSize: number) => ({
  type: FILTER_ACTIONS.SET_PAGE_SIZE,
  payload: pageSize,
});

/**
 * Advanced filters actions
 */
export const toggleAdvancedFilters = () => ({
  type: FILTER_ACTIONS.TOGGLE_ADVANCED_FILTERS,
});

export const setAdvancedFiltersTab = (tab: string) => ({
  type: FILTER_ACTIONS.SET_ADVANCED_FILTERS_TAB,
  payload: tab,
});

/**
 * Reset all filters
 */
export const resetAllFilters = () => ({
  type: FILTER_ACTIONS.RESET_ALL_FILTERS,
});

const filterActionsObj = {
  setPersonnesFilters,
  updatePersonnesFilters,
  resetPersonnesFilters,
  setDossiersFilters,
  updateDossiersFilters,
  resetDossiersFilters,
  setSignalementFilters,
  updateSignalementFilters,
  resetSignalementFilters,
  setOrganisationsFilters,
  updateOrganisationsFilters,
  resetOrganisationsFilters,
  setUsersFilters,
  updateUsersFilters,
  resetUsersFilters,
  setPagination,
  setPage,
  setPageSize,
  toggleAdvancedFilters,
  setAdvancedFiltersTab,
  resetAllFilters,
};

export default filterActionsObj;