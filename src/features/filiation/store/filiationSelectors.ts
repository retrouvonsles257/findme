/**
 * =====================================================
 * RETROUVONSLES - Filiation Redux Selectors
 * Redux state selectors for filiation
 * =====================================================
 */

import type { RootState } from '../../../store/types';
import type { FiliationState } from '../types';

const filiationState = (state: RootState) => (state.filiation as FiliationState) || {};

export const selectFiliationLiens = (state: RootState) => filiationState(state).liens || [];

export const selectFiliationLoading = (state: RootState) => filiationState(state).loading || false;

export const selectFiliationError = (state: RootState) => filiationState(state).error || null;

export const selectCurrentTree = (state: RootState) => filiationState(state).currentTree || null;

export const selectFiliationStatistics = (state: RootState) => filiationState(state).statistiques || null;

export const selectSelectedLien = (state: RootState) => filiationState(state).selectedLien || null;

export const selectFiliationFilters = (state: RootState) => filiationState(state).filters || {};

export const selectFilteredLiens = (state: RootState) => {
  const liens = selectFiliationLiens(state);
  const filters = selectFiliationFilters(state);

  return liens.filter((lien: any) => {
    if (filters.typeVerification && lien.statut_verification !== filters.typeVerification) {
      return false;
    }
    if (filters.typeLien && lien.type_lien !== filters.typeLien) {
      return false;
    }
    if (filters.natureFiliation && lien.nature_filiation !== filters.natureFiliation) {
      return false;
    }
    // Search functionality - could be enhanced
    if (filters.searchTerm) {
      // const searchLower = filters.searchTerm.toLowerCase();
      // Could search in personne names if available
    }
    return true;
  });
};

export const selectVerificationStats = (state: RootState) => {
  const liens = selectFiliationLiens(state);
  const total = liens.length;
  const verified = liens.filter((l: any) =>
    ['confirme_officiellement', 'confirme_genetiquement'].includes(l.statut_verification),
  ).length;
  const inVerification = liens.filter((l: any) => l.statut_verification === 'en_verification').length;

  return {
    total,
    verified,
    inVerification,
    taux: total > 0 ? (verified / total) * 100 : 0,
  };
};
