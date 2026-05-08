/**
 * =====================================================
 * RETROUVONSLES - Personne Selectors
 * Redux selectors for personne state
 * =====================================================
 */

import type { RootState } from '../../../store/types';
import type { Personne, PersonnePhoto, PersonneState } from '../types';

// Helper function to safely access personne state
const personneState = (state: RootState) => (state.personnes as PersonneState) || {};

// ============================================
// BASIC SELECTORS
// ============================================

export const selectAllPersonnes = (state: RootState): Personne[] =>
  personneState(state).personnes || [];

export const selectSelectedPersonne = (state: RootState): Personne | null =>
  personneState(state).selectedPersonne || null;

export const selectPersonnePhotos = (state: RootState): PersonnePhoto[] =>
  personneState(state).photos || [];

export const selectPersonneFiliations = (state: RootState) =>
  personneState(state).filions;

export const selectIsLoading = (state: RootState): boolean =>
  personneState(state).isLoading || false;

export const selectError = (state: RootState): string | null =>
  personneState(state).error || null;

export const selectPersonneFilter = (state: RootState) =>
  personneState(state).filter;

export const selectPagination = (state: RootState) =>
  personneState(state).pagination;

export const selectPersonneStats = (state: RootState) =>
  personneState(state).stats;

// ============================================
// FILTERED SELECTORS
// ============================================

export const selectPersonnesBySex = (state: RootState, sexe: string): Personne[] =>
  personneState(state).personnes?.filter((p: Personne) => p.sexe === sexe) || [];

export const selectPersonnesByNationality = (state: RootState, nationalite: string): Personne[] =>
  personneState(state).personnes?.filter((p: Personne) => p.nationalite === nationalite) || [];

export const selectPersonneById = (state: RootState, id: string): Personne | undefined =>
  personneState(state).personnes?.find((p: Personne) => p.id === id);

export const selectPersonnesWithPhotos = (state: RootState): Personne[] =>
  personneState(state).personnes?.filter((p: Personne) => p.photo_principale) || [];

export const selectIncompletePersonnes = (state: RootState): Personne[] =>
  personneState(state).personnes?.filter((p: Personne) => !p.statut_identite || p.statut_identite === 'non_identifie') || [];

export const selectConfirmedPersonnes = (state: RootState): Personne[] =>
  personneState(state).personnes?.filter((p: Personne) => p.statut_identite === 'identifie') || [];

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectPersonneCount = (state: RootState): number =>
  personneState(state).personnes?.length || 0;

export const selectPhotoCount = (state: RootState): number =>
  personneState(state).photos?.length || 0;

export const selectFiliationCount = (state: RootState): number =>
  personneState(state).filions?.length || 0;

export const selectPersonnesGroupedByNationality = (state: RootState): Record<string, Personne[]> => {
  const grouped: Record<string, Personne[]> = {};
  (personneState(state).personnes || []).forEach((p: Personne) => {
    const key = p.nationalite || 'Unknown';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(p);
  });
  return grouped;
};

export const selectPersonnesGroupedBySex = (state: RootState): Record<string, Personne[]> => {
  const grouped: Record<string, Personne[]> = {};
  (personneState(state).personnes || []).forEach((p: Personne) => {
    const key = p.sexe || 'non_precise';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(p);
  });
  return grouped;
};

export const selectRecentPersonnes = (state: RootState, limit: number = 5): Personne[] =>
  (personneState(state).personnes || []).slice(0, limit);

export const selectPersonnesWithIncompleteDescription = (state: RootState): Personne[] =>
  (personneState(state).personnes || []).filter((p: Personne) => !p.description_physique || p.description_physique.length < 10);

export const selectPhotosByPersonne = (state: RootState, personneId: string): PersonnePhoto[] =>
  (personneState(state).photos || []).filter((p: PersonnePhoto) => p.personne_id === personneId);

export const selectGenderDistribution = (state: RootState) => {
  const stats = personneState(state).stats;
  if (!stats) return null;

  return {
    male: stats.parSexe.masculin,
    female: stats.parSexe.feminin,
    unknown: stats.parSexe.inconnu,
    notSpecified: stats.parSexe.non_precise,
  };
};

export const selectIdentityStatusDistribution = (state: RootState) => {
  const stats = personneState(state).stats;
  if (!stats) return null;

  return {
    identified: stats.parStatutIdentite.identifie,
    partiallyIdentified: stats.parStatutIdentite.partiellement_identifie,
    unidentified: stats.parStatutIdentite.non_identifie,
  };
};
