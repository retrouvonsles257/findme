/**
 * =====================================================
 * RETROUVONSLES - Dossier Redux Selectors
 * Memoized selectors for efficient state access
 * =====================================================
 */

import type { DossierStoreState, DossierDisplayData } from '../types';
import { StatutDossier } from '../../../@types/enums.types';

// ============================================
// BASE SELECTORS
// ============================================

export const selectDossierState = (state: any): DossierStoreState =>
  state.dossiers || state;

// ============================================
// DOSSIER DATA SELECTORS
// ============================================

export const selectDossiers = (state: any): DossierDisplayData[] =>
  selectDossierState(state).dossiers || [];

export const selectSelectedDossier = (state: any): DossierDisplayData | null =>
  selectDossierState(state).selectedDossier || null;

export const selectDossierById =
  (dossierId: string) => (state: any): DossierDisplayData | undefined =>
    selectDossiers(state).find((d) => d.id === dossierId);

export const selectFilteredDossiers = (state: any): DossierDisplayData[] => {
  const dossierState = selectDossierState(state);
  const filters = dossierState.filters;
  let filtered = [...dossierState.dossiers];

  if (filters.statut && filters.statut.length > 0) {
    filtered = filtered.filter((d) => filters.statut!.includes(d.statut_dossier));
  }

  if (filters.type_disparition && filters.type_disparition.length > 0) {
    filtered = filtered.filter((d) => filters.type_disparition!.includes(d.type_disparition));
  }

  if (filters.niveau_urgence && filters.niveau_urgence.length > 0) {
    filtered = filtered.filter((d) => filters.niveau_urgence!.includes(d.niveau_urgence));
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (d) =>
        d.numero_dossier.toLowerCase().includes(search) ||
        (d.circonstances && d.circonstances.toLowerCase().includes(search)),
    );
  }

  if (filters.region && filters.region.length > 0) {
    filtered = filtered.filter((d) => filters.region!.includes(d.region_disparition || ''));
  }

  if (filters.date_min) {
    filtered = filtered.filter((d) => new Date(d.date_disparition) >= new Date(filters.date_min!));
  }

  if (filters.date_max) {
    filtered = filtered.filter((d) => new Date(d.date_disparition) <= new Date(filters.date_max!));
  }

  return filtered;
};

export const selectPaginatedDossiers = (state: any): DossierDisplayData[] => {
  const filtered = selectFilteredDossiers(state);
  const dossierState = selectDossierState(state);
  const start = dossierState.currentPage * dossierState.pageSize;
  const end = start + dossierState.pageSize;
  return filtered.slice(start, end);
};

// ============================================
// FILTER SELECTORS
// ============================================

export const selectFilters = (state: any) => selectDossierState(state).filters || {};

export const selectFilterBy = (field: string) => (state: any): any[] => {
  const filters = selectDossierState(state).filters;
  return (filters as any)?.[field] || [];
};

// ============================================
// PAGINATION SELECTORS
// ============================================

export const selectCurrentPage = (state: any): number =>
  selectDossierState(state).currentPage || 0;

export const selectPageSize = (state: any): number =>
  selectDossierState(state).pageSize || 20;

export const selectTotalCount = (state: any): number =>
  selectDossierState(state).totalCount || 0;

export const selectTotalPages = (state: any): number =>
  selectDossierState(state).totalPages || 0;

export const selectIsLastPage = (state: any): boolean => {
  const dossierState = selectDossierState(state);
  return dossierState.currentPage >= dossierState.totalPages - 1;
};

// ============================================
// SORTING SELECTORS
// ============================================

export const selectSortBy = (state: any): string =>
  selectDossierState(state).sortBy || 'date';

export const selectSortOrder = (state: any): string =>
  selectDossierState(state).sortOrder || 'desc';

// ============================================
// STATUS SELECTORS
// ============================================

export const selectIsLoading = (state: any): boolean =>
  selectDossierState(state).loading || false;

export const selectIsCreating = (state: any): boolean =>
  selectDossierState(state).isCreating || false;

export const selectIsUpdating = (state: any): boolean =>
  selectDossierState(state).isUpdating || false;

export const selectIsDeleting = (state: any): boolean =>
  selectDossierState(state).isDeleting || false;

export const selectIsProcessing = (state: any): boolean => {
  const s = selectDossierState(state);
  return s.loading || s.isCreating || s.isUpdating || s.isDeleting;
};

export const selectError = (state: any): string | null =>
  selectDossierState(state).error || null;

export const selectFieldErrors = (state: any) =>
  selectDossierState(state).fieldErrors || {};

export const selectFieldError =
  (field: string) => (state: any): string | undefined =>
    selectFieldErrors(state)[field as any];

// ============================================
// SELECTION SELECTORS
// ============================================

export const selectSelectedDossierIds = (state: any): string[] =>
  selectDossierState(state).selectedDossierIds || [];

export const selectHasSelection = (state: any): boolean =>
  selectSelectedDossierIds(state).length > 0;

export const selectSelectionCount = (state: any): number =>
  selectSelectedDossierIds(state).length;

export const selectAllDossiersSelected = (state: any): boolean => {
  const selected = selectSelectedDossierIds(state);
  const dossiers = selectDossiers(state);
  return selected.length === dossiers.length && dossiers.length > 0;
};

export const selectSelectedDossierObjects = (state: any): DossierDisplayData[] => {
  const selected = selectSelectedDossierIds(state);
  const dossiers = selectDossiers(state);
  return dossiers.filter((d) => selected.includes(d.id));
};

// ============================================
// STATISTICS SELECTORS
// ============================================

export const selectStatistics = (state: any) =>
  selectDossierState(state).statistics || null;

export const selectStatisticsLoading = (state: any): boolean =>
  selectDossierState(state).statistics_loading || false;

export const selectTotalDossiers = (state: any): number =>
  selectStatistics(state)?.total_dossiers || 0;

export const selectResolutionRate = (state: any): number =>
  selectStatistics(state)?.taux_resolution || 0;

// ============================================
// COMPUTED/FILTERED SELECTORS
// ============================================

export const selectRecentDossiers = (state: any): DossierDisplayData[] => {
  const dossiers = selectDossiers(state);
  return dossiers
    .filter((d) => d.is_recent)
    .sort((a, b) => new Date(b.date_disparition).getTime() - new Date(a.date_disparition).getTime())
    .slice(0, 10);
};

export const selectUrgentDossiers = (state: any): DossierDisplayData[] => {
  const dossiers = selectDossiers(state);
  return dossiers
    .filter((d) => d.is_urgent && d.statut_dossier === 'en_cours')
    .sort((a, b) => b.score_priorite! - a.score_priorite!)
    .slice(0, 10);
};

export const selectDossiersByStatus =
  (status: string) => (state: any): DossierDisplayData[] =>
    selectDossiers(state).filter((d) => d.statut_dossier === status);

export const selectDossiersByType =
  (type: string) => (state: any): DossierDisplayData[] =>
    selectDossiers(state).filter((d) => d.type_disparition === type);

export const selectDossiersByUrgency =
  (urgency: string) => (state: any): DossierDisplayData[] =>
    selectDossiers(state).filter((d) => d.niveau_urgence === urgency);

export const selectDossiersByRegion =
  (region: string) => (state: any): DossierDisplayData[] =>
    selectDossiers(state).filter((d) => d.region_disparition === region);

export const selectSuccessfullyResolvedDossiers = (state: any): DossierDisplayData[] =>
  selectDossiers(state).filter((d) => d.statut_dossier === StatutDossier.RETROUVE_VIVANT || d.statut_dossier === StatutDossier.RETROUVE_DECEDE);

export const selectOpenDossiers = (state: any): DossierDisplayData[] =>
  selectDossiers(state).filter((d) => d.statut_dossier === StatutDossier.EN_COURS);

export const selectCriticalDossiers = (state: any): DossierDisplayData[] =>
  selectDossiers(state).filter((d) => d.is_urgent && d.statut_dossier === StatutDossier.EN_COURS);

// ============================================
// MODAL SELECTORS
// ============================================

export const selectModalIsOpen = (state: any): boolean =>
  selectDossierState(state).modal?.isOpen || false;

export const selectModalType = (state: any): string =>
  selectDossierState(state).modal?.type || 'view';

export const selectModalData = (state: any) =>
  selectDossierState(state).modal?.data || null;

// ============================================
// COUNT SELECTORS
// ============================================

export const selectCount = (state: any): number =>
  selectDossiers(state).length;

export const selectCountByStatus =
  (status: string) => (state: any): number =>
    selectDossiers(state).filter((d) => d.statut_dossier === status).length;

export const selectCountByType =
  (type: string) => (state: any): number =>
    selectDossiers(state).filter((d) => d.type_disparition === type).length;

export const selectCountByUrgency =
  (urgency: string) => (state: any): number =>
    selectDossiers(state).filter((d) => d.niveau_urgence === urgency).length;

// ============================================
// EXISTENCE CHECKS
// ============================================

export const selectHasDossiers = (state: any): boolean =>
  selectDossiers(state).length > 0;

export const selectHasErrors = (state: any): boolean =>
  !!selectError(state) || Object.keys(selectFieldErrors(state)).length > 0;

export const selectHasFilters = (state: any): boolean => {
  const filters = selectFilters(state);
  return Object.keys(filters).length > 0;
};
