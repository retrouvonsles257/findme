/**
 * =====================================================
 * RETROUVONSLES - Personne Store Barrel Export
 * =====================================================
 */

// Thunks
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
} from './personneSlice';

// Actions
export {
  setSelectedPersonne,
  setFilter,
  setCurrentPage,
  clearError,
  resetPersonneState,
} from './personneSlice';

// Selectors
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
} from './personneSelectors';

// Reducer
export { default as personneReducer } from './personneSlice';
