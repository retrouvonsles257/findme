/**
 * =====================================================
 * RETROUVONSLES - Signalement Redux Selectors
 * Redux selectors for signalements
 * =====================================================
 */

import type { Signalement, SignalementState } from '../types';

// Define a minimal RootState interface to avoid circular imports
interface RootState {
  signalements?: SignalementState;
  [key: string]: unknown;
}

// Helper function to safely access signalement state
const signalementState = (state: RootState) => (state.signalements as SignalementState) || {};

// ============================================
// BASIC SELECTORS
// ============================================

export const selectAllSignalements = (state: RootState) => signalementState(state).signalements || [];
export const selectSelectedSignalement = (state: RootState) => signalementState(state).selectedSignalement || null;
export const selectIsLoading = (state: RootState) => signalementState(state).isLoading || false;
export const selectError = (state: RootState) => signalementState(state).error || null;
export const selectPagination = (state: RootState) => signalementState(state).pagination;
export const selectStats = (state: RootState) => signalementState(state).stats;

// ============================================
// FILTERED SELECTORS
// ============================================

export const selectSignalementsByEtat = (etat: string) => (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => (s.statut_validation || s.etat) === etat) || [];

export const selectNewSignalements = (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => s.statut_validation === 'en_attente') || [];

export const selectValidSignalements = (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => s.statut_validation === 'valide') || [];

export const selectHighScoreSignalements = (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => (s.score_correspondance || 0) > 0.7) || [];

export const selectSignalementsByDossier = (dossierId: string) => (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => s.id_dossier === dossierId) || [];

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectSignalementCount = (state: RootState) => signalementState(state).signalements?.length || 0;

export const selectNewSignalementCount = (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => s.statut_validation === 'en_attente').length || 0;

export const selectValidSignalementCount = (state: RootState) =>
  signalementState(state).signalements?.filter((s: Signalement) => s.statut_validation === 'valide').length || 0;

export const selectAverageScore = (state: RootState) => {
  const signalements = signalementState(state).signalements || [];
  if (signalements.length === 0) return 0;
  const sum = signalements.reduce((acc: number, s: Signalement) => acc + (s.score_correspondance || 0), 0);
  return sum / signalements.length;
};

export const selectSignalementsByEtat2 = (state: RootState) => {
  const distribution: Record<string, number> = {
    nouveau: 0,
    en_cours: 0,
    valide: 0,
    rejete: 0,
    ferme: 0,
  };

  (signalementState(state).signalements || []).forEach((s: Signalement) => {
    const etat = s.etat || s.statut_validation || 'en_attente';
    if (distribution[etat] !== undefined) {
      distribution[etat]++;
    }
  });

  return distribution;
};
