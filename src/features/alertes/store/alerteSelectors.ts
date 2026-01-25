/**
 * =====================================================
 * RETROUVONSLES - Alertes Redux Selectors
 * Sélecteurs pour accéder aux données du store
 * =====================================================
 */

import type { AlerteStoreState } from '../types';

// ============================================
// ROOT SELECTOR
// ============================================

export const selectAlerteState = (state: any): AlerteStoreState => state.alertes;

// ============================================
// ALERTES SELECTORS
// ============================================

/**
 * Obtenir toutes les alertes
 */
export const selectAlertes = (state: any): any[] => selectAlerteState(state).alertes;

/**
 * Obtenir les alertes filtrées
 */
export const selectFilteredAlertes = (state: any): any[] =>
  selectAlerteState(state).filteredAlertes;

/**
 * Obtenir les alertes paginées
 */
export const selectPaginatedAlertes = (state: any): any[] => {
  const alerteState = selectAlerteState(state);
  const start = (alerteState.currentPage - 1) * alerteState.pageSize;
  const end = start + alerteState.pageSize;
  return alerteState.filteredAlertes.slice(start, end);
};

/**
 * Obtenir une alerte spécifique
 */
export const selectAlerteById = (state: any, id: string): any | null => {
  return selectAlertes(state).find((a) => a.id === id) || null;
};

/**
 * Obtenir l'alerte sélectionnée
 */
export const selectSelectedAlerte = (state: any): any | null =>
  selectAlerteState(state).selectedAlerte;

/**
 * Obtenir les IDs des alertes sélectionnées
 */
export const selectSelectedAlerteIds = (state: any): string[] =>
  selectAlerteState(state).selectedAlertes;

/**
 * Obtenir les alertes par statut
 */
export const selectAlertesByStatus = (state: any, status: string): any[] => {
  return selectAlertes(state).filter((a) => a.statut_alerte === status);
};

/**
 * Obtenir les alertes par type
 */
export const selectAlertesByType = (state: any, type: string): any[] => {
  return selectAlertes(state).filter((a) => a.type_alerte === type);
};

/**
 * Obtenir les alertes actives
 */
export const selectActiveAlertes = (state: any): any[] => {
  return selectAlertes(state).filter((a) => a.statut_alerte === 'en_cours');
};

/**
 * Obtenir les alertes brouillon
 */
export const selectDraftAlertes = (state: any): any[] => {
  return selectAlertes(state).filter((a) => a.statut_alerte === 'brouillon');
};

/**
 * Rechercher des alertes par titre ou message
 */
export const selectAlertesBySearch = (state: any, searchTerm: string): any[] => {
  if (!searchTerm) return selectAlertes(state);
  const term = searchTerm.toLowerCase();
  return selectAlertes(state).filter(
    (a) =>
      a.titre.toLowerCase().includes(term) || a.message.toLowerCase().includes(term),
  );
};

// ============================================
// PAGINATION SELECTORS
// ============================================

/**
 * Obtenir la page courante
 */
export const selectCurrentPage = (state: any): number =>
  selectAlerteState(state).currentPage;

/**
 * Obtenir la taille de page
 */
export const selectPageSize = (state: any): number => selectAlerteState(state).pageSize;

/**
 * Obtenir le total d'alertes
 */
export const selectTotal = (state: any): number => selectAlerteState(state).total;

/**
 * Obtenir le nombre de pages
 */
export const selectTotalPages = (state: any): number => {
  const alerteState = selectAlerteState(state);
  return Math.ceil(alerteState.filteredAlertes.length / alerteState.pageSize);
};

/**
 * Vérifier si c'est la dernière page
 */
export const selectIsLastPage = (state: any): boolean => {
  const alerteState = selectAlerteState(state);
  return alerteState.currentPage >= selectTotalPages(state);
};

// ============================================
// FILTERS & SORTING SELECTORS
// ============================================

/**
 * Obtenir les filtres appliqués
 */
export const selectFilters = (state: any): any => selectAlerteState(state).filters;

/**
 * Obtenir la clé de tri
 */
export const selectSortBy = (state: any): string => selectAlerteState(state).sortBy;

/**
 * Obtenir l'ordre de tri
 */
export const selectSortOrder = (state: any): string => selectAlerteState(state).sortOrder;

// ============================================
// STATISTICS SELECTORS
// ============================================

/**
 * Obtenir les statistiques
 */
export const selectStatistics = (state: any): any | null =>
  selectAlerteState(state).statistics;

/**
 * Obtenir le nombre total d'alertes
 */
export const selectTotalAlertes = (state: any): number =>
  selectStatistics(state)?.total_alertes || 0;

/**
 * Obtenir le nombre d'alertes actives
 */
export const selectActiveAlertesCount = (state: any): number =>
  selectStatistics(state)?.alertes_actives || 0;

/**
 * Obtenir la répartition par type
 */
export const selectAlertesByTypeStats = (state: any): Record<string, number> =>
  selectStatistics(state)?.alertes_par_type || {};

/**
 * Obtenir la répartition par statut
 */
export const selectAlertesByStatusStats = (state: any): Record<string, number> =>
  selectStatistics(state)?.alertes_par_statut || {};

// ============================================
// LOADING & ERROR SELECTORS
// ============================================

/**
 * Obtenir l'état de chargement
 */
export const selectIsLoading = (state: any): boolean =>
  selectAlerteState(state).isLoading;

/**
 * Obtenir l'état de création
 */
export const selectIsCreating = (state: any): boolean =>
  selectAlerteState(state).isCreating;

/**
 * Obtenir l'état de mise à jour
 */
export const selectIsUpdating = (state: any): boolean =>
  selectAlerteState(state).isUpdating;

/**
 * Obtenir l'état de suppression
 */
export const selectIsDeleting = (state: any): boolean =>
  selectAlerteState(state).isDeleting;

/**
 * Obtenir l'état de diffusion
 */
export const selectIsDiffusing = (state: any): boolean =>
  selectAlerteState(state).isDiffusing;

/**
 * Obtenir le message d'erreur
 */
export const selectError = (state: any): string | null => selectAlerteState(state).error;

/**
 * Obtenir les erreurs de champ
 */
export const selectFieldErrors = (state: any): Record<string, string> =>
  selectAlerteState(state).errors;

/**
 * Obtenir une erreur de champ spécifique
 */
export const selectFieldError = (state: any, field: string): string | undefined =>
  selectFieldErrors(state)[field];

// ============================================
// COMPUTED SELECTORS
// ============================================

/**
 * Vérifier s'il y a des alertes
 */
export const selectHasAlertes = (state: any): boolean => selectAlertes(state).length > 0;

/**
 * Vérifier s'il y a des alertes sélectionnées
 */
export const selectHasSelection = (state: any): boolean =>
  selectSelectedAlerteIds(state).length > 0;

/**
 * Obtenir le nombre d'alertes sélectionnées
 */
export const selectSelectionCount = (state: any): number =>
  selectSelectedAlerteIds(state).length;

/**
 * Vérifier si toutes les alertes sont sélectionnées
 */
export const selectAllAlertsSelected = (state: any): boolean => {
  const alerteState = selectAlerteState(state);
  const filtered = alerteState.filteredAlertes;
  return filtered.length > 0 && alerteState.selectedAlertes.length === filtered.length;
};

/**
 * Obtenir l'état de chargement global
 */
export const selectIsProcessing = (state: any): boolean => {
  const alerteState = selectAlerteState(state);
  return (
    alerteState.isLoading ||
    alerteState.isCreating ||
    alerteState.isUpdating ||
    alerteState.isDeleting ||
    alerteState.isDiffusing
  );
};
