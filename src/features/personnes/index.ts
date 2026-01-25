/**
 * =====================================================
 * RETROUVONSLES - Personnes Feature Barrel Export
 * Complete personnes feature exports
 * =====================================================
 */

// Components
export {
  PersonneProfile,
  PersonneList,
  PersonneSearch,
  PersonnePhotos,
  PersonnePhysical,
  PersonneFiliation,
  PersonneHistory,
} from './components';

// Hooks
export { usePersonnes, usePersonneDetail, usePersonneCreate } from './hooks';
export type { UsePersonnesResult, UsePersonneDetailResult, UsePersonneCreateResult } from './hooks';

// Services
export {
  getPersonnes,
  getPersonneById,
  createPersonne,
  updatePersonne,
  deletePersonne,
  getPersonnePhotos,
  addPersonnePhoto,
  deletePersonnePhoto,
  getPersonneFiliations,
  createFiliation,
  updateFiliation,
  getPersonneStats,
  searchPersonnesByDescription,
} from './services';

export {
  calculateAge,
  getFullName,
  getDisplayAge,
  getStatutIdentiteColor,
  getFiabiliteColor,
  getSexDisplay,
  hasCompletePhysicalDescription,
  calculateCompletionPercentage,
  sortPersonnes,
  filterPersonnes,
  getFiliationTypeLabel,
  getVerificationStatusLabel,
  isFiliationConfirmed,
} from './services';

// Store - Thunks
export {
  fetchPersonnes,
  fetchPersonneById,
  createNewPersonne,
  updatePersonneData,
  deletePersonneData,
  fetchPersonnePhotos,
  addPersonnePhotoData,
  deletePersonnePhotoData,
  fetchPersonneFiliations,
  createNewFiliation,
  updateFiliationData,
  fetchPersonneStats,
  searchPersonnes,
} from './store';

// Store - Actions
export {
  setSelectedPersonne,
  setFilter,
  setCurrentPage,
  clearError,
  resetPersonneState,
} from './store';

// Store - Selectors
export {
  selectAllPersonnes,
  selectSelectedPersonne,
  selectPersonnePhotos,
  selectPersonneFiliations,
  selectIsLoading,
  selectError,
  selectPersonneFilter,
  selectPagination,
  selectPersonneStats,
  selectPersonnesBySex,
  selectPersonnesByNationality,
  selectPersonneById,
  selectPersonnesWithPhotos,
  selectIncompletePersonnes,
  selectConfirmedPersonnes,
  selectPersonneCount,
  selectPhotoCount,
  selectFiliationCount,
  selectPersonnesGroupedByNationality,
  selectPersonnesGroupedBySex,
  selectRecentPersonnes,
  selectPersonnesWithIncompleteDescription,
  selectPhotosByPersonne,
  selectGenderDistribution,
  selectIdentityStatusDistribution,
} from './store';

// Types
export type {
  Personne,
  PersonnePhoto,
  LienFiliation,
  PersonneCreatePayload,
  PersonneUpdatePayload,
  PersonneFilter,
  PersonneStats,
  PersonneState,
} from './types';

// Store
export { personneReducer } from './store';
