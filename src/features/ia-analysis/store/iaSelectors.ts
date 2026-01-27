/**
 * =====================================================
 * RETROUVONSLES - IA Redux Selectors
 * Redux state selectors for IA analysis
 * Utilise le type ResultatIA selon le modèle de données
 * =====================================================
 */

import type { RootState } from '@/store/types';
import type { ResultatIA } from '../services/iaAPI';

// ============================================
// FACIAL RECOGNITION SELECTORS
// ============================================

export const selectFacialRecognitionResults = (state: RootState) =>
  state.ia?.facialRecognitionResults || [];

export const selectCurrentFacialAnalysis = (state: RootState) =>
  state.ia?.currentFacialAnalysis || null;

export const selectFacialResultsByPerson = (state: RootState, dossierId: string) => {
  return (state.ia?.facialRecognitionResults || []).filter(
    (result: ResultatIA) => result.id_dossier === dossierId,
  );
};

export const selectBestFacialMatch = (state: RootState) => {
  const results = state.ia?.facialRecognitionResults || [];
  if (results.length === 0) return null;

  return results.reduce((best: ResultatIA, current: ResultatIA) => {
    return current.score_confiance > best.score_confiance ? current : best;
  });
};

// ============================================
// IMAGE COMPARISON SELECTORS
// ============================================

export const selectImageComparisonResults = (state: RootState) =>
  state.ia?.imageComparisonResults || [];

export const selectCurrentComparison = (state: RootState) => state.ia?.currentComparison || null;

export const selectHighConfidenceComparisons = (state: RootState, threshold: number = 70) => {
  return (state.ia?.imageComparisonResults || []).filter(
    (result: ResultatIA) => result.score_confiance >= threshold,
  );
};

export const selectSamePeople = (state: RootState) => {
  return (state.ia?.imageComparisonResults || []).filter(
    (result: ResultatIA) => result.donnees_interpretees?.is_match === true,
  );
};

// ============================================
// LOCATION PREDICTION SELECTORS
// ============================================

export const selectLocationPredictions = (state: RootState) =>
  state.ia?.locationPredictions || [];

export const selectCurrentLocationPrediction = (state: RootState) =>
  state.ia?.currentLocationPrediction || null;

export const selectPredictionsByPerson = (state: RootState, dossierId: string) => {
  return (state.ia?.locationPredictions || []).filter(
    (prediction: ResultatIA) => prediction.id_dossier === dossierId,
  );
};

export const selectLatestPrediction = (state: RootState) => {
  const predictions = state.ia?.locationPredictions || [];
  if (predictions.length === 0) return null;

  return predictions.reduce((latest: ResultatIA, current: ResultatIA) => {
    return new Date(current.date_analyse) > new Date(latest.date_analyse) ? current : latest;
  });
};

// ============================================
// SIMILARITIES SELECTORS
// ============================================

export const selectSimilaritiesResults = (state: RootState) =>
  state.ia?.similaritiesResults || [];

export const selectCurrentSimilarities = (state: RootState) =>
  state.ia?.currentSimilarities || null;

export const selectTopSimilarMatches = (state: RootState, limit: number = 5) => {
  const results = state.ia?.similaritiesResults || [];
  return [...results]
    .sort((a: ResultatIA, b: ResultatIA) => b.score_confiance - a.score_confiance)
    .slice(0, limit);
};

// ============================================
// UI STATE SELECTORS
// ============================================

export const selectIALoading = (state: RootState) => state.ia?.loading || false;

export const selectIAError = (state: RootState) => state.ia?.error || null;

export const selectSelectedPersonId = (state: RootState) => state.ia?.selectedPersonId || null;

export const selectAnalysisMode = (state: RootState) => state.ia?.analysisMode || null;

export const selectConfidenceThreshold = (state: RootState) =>
  state.ia?.confidenceThreshold || 70;

// ============================================
// COMBINED SELECTORS
// ============================================

export const selectIAAnalysisSummary = (state: RootState) => {
  return {
    facialResultsCount: (state.ia?.facialRecognitionResults || []).length,
    comparisonResultsCount: (state.ia?.imageComparisonResults || []).length,
    predictionsCount: (state.ia?.locationPredictions || []).length,
    similaritiesCount: (state.ia?.similaritiesResults || []).length,
    isLoading: state.ia?.loading || false,
    hasError: !!state.ia?.error,
  };
};

export const selectPersonAnalyticsSummary = (state: RootState, dossierId: string) => {
  const facialResults = (state.ia?.facialRecognitionResults || []).filter(
    (r: ResultatIA) => r.id_dossier === dossierId,
  );
  const predictions = (state.ia?.locationPredictions || []).filter(
    (r: ResultatIA) => r.id_dossier === dossierId,
  );

  return {
    facialAnalysisCount: facialResults.length,
    predictionsCount: predictions.length,
    latestFacialAnalysis: facialResults[0] || null,
    latestPrediction: predictions[0] || null,
  };
};

export const selectAnalysisResults = (state: RootState) => {
  return {
    facialResults: state.ia?.facialRecognitionResults || [],
    comparisonResults: state.ia?.imageComparisonResults || [],
    locationPredictions: state.ia?.locationPredictions || [],
    similaritiesResults: state.ia?.similaritiesResults || [],
  };
};
