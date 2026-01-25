/**
 * =====================================================
 * RETROUVONSLES - Don Selectors
 * Sélecteurs d'état pour les dons
 * =====================================================
 */

import type { DonStoreState } from '../types';

/**
 * Sélectionner l'état complet des dons
 */
export const selectDonState = (state: DonStoreState): DonStoreState => state;

/**
 * Sélectionner tous les dons
 */
export const selectDons = (state: DonStoreState) => state.dons;

/**
 * Sélectionner les dons filtrés
 */
export const selectFilteredDons = (state: DonStoreState) => state.filteredDons;

/**
 * Sélectionner les dons paginés
 */
export const selectPaginatedDons = (state: DonStoreState) => {
  const start = (state.currentPage - 1) * state.pageSize;
  const end = start + state.pageSize;
  return state.filteredDons.slice(start, end);
};

/**
 * Sélectionner un don par ID
 */
export const selectDonById = (state: DonStoreState, id: string) => {
  return state.dons.find((don) => don.id === id);
};

/**
 * Sélectionner le don sélectionné
 */
export const selectSelectedDon = (state: DonStoreState) => state.selectedDon;

/**
 * Sélectionner les IDs des dons sélectionnés
 */
export const selectSelectedDonIds = (state: DonStoreState) => state.selectedDons;

/**
 * Sélectionner les dons par statut
 */
export const selectDonsByStatus = (state: DonStoreState, statut: string) => {
  return state.dons.filter((don) => don.statut_paiement === statut);
};

/**
 * Sélectionner les dons par type
 */
export const selectDonsByType = (state: DonStoreState, type: string) => {
  return state.dons.filter((don) => don.type_don === type);
};

/**
 * Sélectionner les dons réussis
 */
export const selectSuccessfulDons = (state: DonStoreState) => {
  return state.dons.filter((don) => don.statut_paiement === 'reussi');
};

/**
 * Sélectionner les dons en attente
 */
export const selectPendingDons = (state: DonStoreState) => {
  return state.dons.filter((don) => don.statut_paiement === 'en_attente');
};

/**
 * Sélectionner les dons échoués
 */
export const selectFailedDons = (state: DonStoreState) => {
  return state.dons.filter((don) => don.statut_paiement === 'echoue');
};

/**
 * Sélectionner la page actuelle
 */
export const selectCurrentPage = (state: DonStoreState) => state.currentPage;

/**
 * Sélectionner la taille de la page
 */
export const selectPageSize = (state: DonStoreState) => state.pageSize;

/**
 * Sélectionner le total des dons
 */
export const selectTotal = (state: DonStoreState) => state.total;

/**
 * Sélectionner le nombre total de pages
 */
export const selectTotalPages = (state: DonStoreState) => {
  return Math.ceil(state.filteredDons.length / state.pageSize);
};

/**
 * Sélectionner si on est à la dernière page
 */
export const selectIsLastPage = (state: DonStoreState) => {
  const totalPages = Math.ceil(state.filteredDons.length / state.pageSize);
  return state.currentPage >= totalPages;
};

/**
 * Sélectionner les filtres
 */
export const selectFilters = (state: DonStoreState) => state.filters;

/**
 * Sélectionner le tri
 */
export const selectSortBy = (state: DonStoreState) => state.sortBy;

/**
 * Sélectionner l'ordre de tri
 */
export const selectSortOrder = (state: DonStoreState) => state.sortOrder;

/**
 * Sélectionner les statistiques
 */
export const selectStatistics = (state: DonStoreState) => state.statistics;

/**
 * Sélectionner le montant total des dons
 */
export const selectTotalAmount = (state: DonStoreState) => {
  return state.dons.reduce((total, don) => total + (don.montant || 0), 0);
};

/**
 * Sélectionner le nombre de dons réussis
 */
export const selectSuccessfulDonsCount = (state: DonStoreState) => {
  return state.dons.filter((don) => don.statut_paiement === 'reussi').length;
};

/**
 * Sélectionner le montant moyen des dons
 */
export const selectAverageDonAmount = (state: DonStoreState) => {
  if (state.dons.length === 0) return 0;
  const total = selectTotalAmount(state);
  return total / state.dons.length;
};

/**
 * Sélectionner le statut de chargement
 */
export const selectIsLoading = (state: DonStoreState) => state.isLoading;

/**
 * Sélectionner le statut de création
 */
export const selectIsCreating = (state: DonStoreState) => state.isCreating;

/**
 * Sélectionner le statut de mise à jour
 */
export const selectIsUpdating = (state: DonStoreState) => state.isUpdating;

/**
 * Sélectionner le statut de suppression
 */
export const selectIsDeleting = (state: DonStoreState) => state.isDeleting;

/**
 * Sélectionner le statut du traitement de paiement
 */
export const selectIsProcessingPayment = (state: DonStoreState) => state.isProcessingPayment;

/**
 * Sélectionner l'erreur
 */
export const selectError = (state: DonStoreState) => state.error;

/**
 * Sélectionner les erreurs de champ
 */
export const selectFieldErrors = (state: DonStoreState) => state.errors;

/**
 * Sélectionner l'erreur d'un champ spécifique
 */
export const selectFieldError = (state: DonStoreState, fieldName: string) => {
  return state.errors[fieldName];
};

/**
 * Sélectionner si y a des dons
 */
export const selectHasDons = (state: DonStoreState) => state.dons.length > 0;

/**
 * Sélectionner si y a une sélection
 */
export const selectHasSelection = (state: DonStoreState) => {
  return state.selectedDon !== null || state.selectedDons.length > 0;
};

/**
 * Sélectionner le nombre de dons sélectionnés
 */
export const selectSelectionCount = (state: DonStoreState) => {
  let count = 0;
  if (state.selectedDon) count += 1;
  count += state.selectedDons.length;
  return count;
};

/**
 * Sélectionner si tous les dons sont sélectionnés
 */
export const selectAllDonsSelected = (state: DonStoreState) => {
  if (state.dons.length === 0) return false;
  return state.selectedDons.length === state.dons.length;
};

/**
 * Sélectionner si un traitement est en cours
 */
export const selectIsProcessing = (state: DonStoreState) => {
  return (
    state.isLoading ||
    state.isCreating ||
    state.isUpdating ||
    state.isDeleting ||
    state.isProcessingPayment
  );
};

/**
 * Sélectionner les dons de la dernière semaine
 */
export const selectRecentDons = (state: DonStoreState) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return state.dons.filter((don) => {
    const donDate = new Date(don.date_don);
    return donDate > oneWeekAgo;
  });
};
