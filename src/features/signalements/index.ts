/**
 * Signalements Feature - Main Barrel Export
 */

// Types
export type {
  Signalement,
  SignalementContact,
  SignalementVerification,
  SignalementFilter,
  SignalementCreatePayload,
  SignalementUpdatePayload,
  SignalementValidationPayload,
  SignalementStats,
  SignalementState,
} from './types/signalement.types';

// Services
export {
  getSignalements,
  getSignalementById,
  createSignalement,
  updateSignalement,
  deleteSignalement,
  searchSignalements,
  getSignalementsByLocation,
  getSignalementContacts,
  addSignalementContact,
  deleteSignalementContact,
  getSignalementVerifications,
  addSignalementVerification,
  getSignalementStats,
  getSignalementsEnAttente,
} from './services/signalementAPI';

export {
  getEtatLabel,
  getEtatColor,
  getContactTypeLabel,
  getReliabilityLabel,
  getDecisionLabel,
  getDaysAgo,
  formatSignalementDate,
  filterSignalements,
  calculateMatchScore,
} from './services/signalementService';

// Redux Store
export {
  fetchSignalements,
  fetchSignalementById,
  createNewSignalement,
  updateSignalementData,
  deleteSignalementData,
  searchSignalementsData,
  fetchSignalementContacts,
  fetchSignalementVerifications,
  addSignalementVerificationData,
  fetchSignalementStats,
  clearSelectedSignalement,
  clearError,
} from './store/signalementSlice';

export {
  selectAllSignalements,
  selectSelectedSignalement,
  selectIsLoading,
  selectError,
  selectPagination,
  selectStats,
  selectSignalementsByEtat,
  selectNewSignalements,
  selectValidSignalements,
  selectHighScoreSignalements,
  selectSignalementsByDossier,
  selectSignalementCount,
} from './store/signalementSelectors';

// Hooks
export {
  useSignalements,
  useSignalementDetail,
  useSignalementCreate,
  useSignalementValidation,
} from './hooks';

// Components
export {
  SignalementList,
  SignalementDetail,
  SignalementFilters,
  NewSignalement,
  SignalementMap,
  SignalementStatus,
  SignalementValidation,
} from './components';
