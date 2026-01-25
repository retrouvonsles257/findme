/**
 * =====================================================
 * RETROUVONSLES - Dossier Utils Export
 * Central export point for all utility functions
 * =====================================================
 */

// Validation utilities
export {
  isValidEmail,
  isValidPhoneNumber,
  validateField,
  validateDossierFormComplete,
  hasValidationErrors,
  getFieldError,
  isValidDateRange,
  isValidForCreation,
  isValidCoordinates,
  isValidFileSize,
  isValidImageFile,
  sanitizeInput,
  isValidSearchQuery,
} from './dossierValidation';

// Helper utilities
export {
  formatDate,
  formatDateTime,
  getRelativeDate,
  formatLocation,
  getDaysSince,
  isRecentDossier,
  isUrgentDossier,
  isResolvedDossier,
  isClosedDossier,
  isActiveDossier,
  getStatusColor,
  getUrgencyColor,
  getUrgencySeverity,
  getTypeIcon,
  calculateProgressPercentage,
  getStateLabel,
  getPrecisionLabel,
  sortByUrgency,
  sortByRecency,
  groupByStatus,
  generateDossierNumber,
  exportDossierAsText,
  canEditDossier,
  canDeleteDossier,
} from './dossierHelpers';
