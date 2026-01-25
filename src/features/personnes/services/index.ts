/**
 * =====================================================
 * RETROUVONSLES - Personne Services Barrel Export
 * =====================================================
 */

// API Functions
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
} from './personneAPI';

// Service Functions
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
} from './personneService';
