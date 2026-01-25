/**
 * =====================================================
 * RETROUVONSLES - Filter Selectors
 * Redux selectors for accessing filter state
 * =====================================================
 */

import type { FilterState } from './filterSlice';

/**
 * Root filter state selector
 */
export const selectFilterState = (state: any): FilterState => (state as any).filters;

/**
 * Personnes filter selectors
 */
export const selectPersonnesFilters = (state: any) =>
  (state as any).filters.personnesFilters;
export const selectPersonnesSearchQuery = (state: any) =>
  (state as any).filters.personnesFilters.searchQuery;
export const selectPersonnesSort = (state: any) =>
  (state as any).filters.personnesFilters.sortBy;

/**
 * Dossiers filter selectors
 */
export const selectDossiersFilters = (state: any) =>
  (state as any).filters.dossiersFilters;
export const selectDossiersSearchQuery = (state: any) =>
  (state as any).filters.dossiersFilters.searchQuery;
export const selectDossiersSort = (state: any) =>
  (state as any).filters.dossiersFilters.sortBy;

/**
 * Signalements filter selectors
 */
export const selectSignalementFilters = (state: any) =>
  (state as any).filters.signalementFilters;
export const selectSignalementSearchQuery = (state: any) =>
  (state as any).filters.signalementFilters.searchQuery;
export const selectSignalementSort = (state: any) =>
  (state as any).filters.signalementFilters.sortBy;

/**
 * Organisations filter selectors
 */
export const selectOrganisationsFilters = (state: any) =>
  (state as any).filters.organisationsFilters;
export const selectOrganisationsSearchQuery = (state: any) =>
  (state as any).filters.organisationsFilters.searchQuery;

/**
 * Users filter selectors
 */
export const selectUsersFilters = (state: any) =>
  (state as any).filters.usersFilters;
export const selectUsersSearchQuery = (state: any) =>
  (state as any).filters.usersFilters.searchQuery;

/**
 * Pagination selectors
 */
export const selectPagination = (state: any) =>
  (state as any).filters.pagination;
export const selectCurrentPage = (state: any) =>
  (state as any).filters.pagination.currentPage;
export const selectPageSize = (state: any) =>
  (state as any).filters.pagination.pageSize;
export const selectTotalItems = (state: any) =>
  (state as any).filters.pagination.totalItems;
export const selectTotalPages = (state: any) =>
  (state as any).filters.pagination.totalPages;

/**
 * Advanced filters selectors
 */
export const selectAdvancedFilters = (state: any) =>
  (state as any).filters.advancedFilters;
export const selectAdvancedFiltersOpen = (state: any) =>
  (state as any).filters.advancedFilters.isOpen;
export const selectAdvancedFiltersTab = (state: any) =>
  (state as any).filters.advancedFilters.activeTab;

const filterSelectors = {
  selectFilterState,
  selectPersonnesFilters,
  selectPersonnesSearchQuery,
  selectPersonnesSort,
  selectDossiersFilters,
  selectDossiersSearchQuery,
  selectDossiersSort,
  selectSignalementFilters,
  selectSignalementSearchQuery,
  selectSignalementSort,
  selectOrganisationsFilters,
  selectOrganisationsSearchQuery,
  selectUsersFilters,
  selectUsersSearchQuery,
  selectPagination,
  selectCurrentPage,
  selectPageSize,
  selectTotalItems,
  selectTotalPages,
  selectAdvancedFilters,
  selectAdvancedFiltersOpen,
  selectAdvancedFiltersTab,
};
export default filterSelectors;