/**
 * =====================================================
 * RETROUVONSLES - Filiation Feature Export
 * Main feature export barrel file
 * =====================================================
 */

// ============================================
// COMPONENTS
// ============================================

export { FiliationTree } from './components/FiliationTree';
export { FiliationNode } from './components/FiliationNode';
export { FiliationLink } from './components/FiliationLink';
export { FiliationMatching } from './components/FiliationMatching';
export { FiliationVerification } from './components/FiliationVerification';

// ============================================
// SERVICES
// ============================================

export {
  createFiliationLien,
  getFiliationLiensByPersonne,
  updateFiliationLien as updateFiliationLienAPI,
  deleteFiliationLien as deleteFiliationLienAPI,
  getParents,
  getEnfants,
  getFratrie,
  getFamilyTree,
  verifyFiliationLien,
  findPotentialMatches,
  getFiliationStatistics,
  getExtendedFamily,
} from './services/filiationAPI';

export {
  createFiliationLink,
  buildFamilyTree,
  getPersonneFamilyRelations,
  verifyLinkWithProof,
  calculateCompatibilityScore,
  findFamilyMembersByCharacteristics,
} from './services/filiationService';

// ============================================
// STORE (Redux)
// ============================================

export {
  fetchFiliationLiens,
  fetchFamilyTree,
  fetchFiliationStatistics,
  createNewFiliationLien,
  updateFiliationLien,
  deleteFiliationLien,
  setSelectedLien,
  setFilters,
  clearError,
  resetState,
} from './store/filiationSlice';

export {
  selectFiliationLiens,
  selectFiliationLoading,
  selectFiliationError,
  selectCurrentTree,
  selectFiliationStatistics,
  selectSelectedLien,
  selectFiliationFilters,
  selectFilteredLiens,
  selectVerificationStats,
} from './store/filiationSelectors';

export { default as filiationReducer } from './store/filiationSlice';

// ============================================
// HOOKS
// ============================================

export { useFiliation } from './hooks/useFiliation';
export { useFiliationCreate } from './hooks/useFiliationCreate';
export { useFiliationTree } from './hooks/useFiliationTree';

// ============================================
// TYPES
// ============================================

export type {
  FiliationLienDatabase,
  FiliationLienInput,
  FiliationLienUpdate,
  FiliationLienDisplay,
  FiliationMatch,
  FiliationNode as FiliationNodeType,
  FiliationTree as FiliationTreeType,
  FiliationStatistics,
  FiliationState,
  FiliationFormErrors,
} from './types';
