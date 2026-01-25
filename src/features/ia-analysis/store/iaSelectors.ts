/**
 * =====================================================
 * RETROUVONSLES - IA Redux Selectors
 * Redux state selectors for IA analysis
 * =====================================================
 */

import type { RootState } from '@/store/types';
import type {
  FacialRecognitionResult,
  ImageComparisonResult,
  LocationPredictionResult,
} from '../types';

// ============================================
// FACIAL RECOGNITION SELECTORS
// ============================================

export const selectFacialRecognitionResults = (state: RootState) =>
  state.ia?.facialRecognitionResults || [];

export const selectCurrentFacialAnalysis = (state: RootState) =>
  state.ia?.currentFacialAnalysis || null;

export const selectFacialResultsByPerson = (state: RootState, personId: string) => {
  return (state.ia?.facialRecognitionResults || []).filter(
    (result: FacialRecognitionResult) => result.person_id === personId,
  );
};

export const selectBestFacialMatch = (state: RootState) => {
  const results = state.ia?.facialRecognitionResults || [];
  if (results.length === 0) return null;

  return results.reduce((best: FacialRecognitionResult, current: FacialRecognitionResult) => {
    const currentConfidence = current.facial_features.confidence_facial;
    const bestConfidence = best.facial_features.confidence_facial;
    return currentConfidence > bestConfidence ? current : best;
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
    (result: ImageComparisonResult) => result.similarity_score >= threshold,
  );
};

export const selectSamePeople = (state: RootState) => {
  return (state.ia?.imageComparisonResults || []).filter(
    (result: ImageComparisonResult) => result.is_same_person,
  );
};

// ============================================
// LOCATION PREDICTION SELECTORS
// ============================================

export const selectLocationPredictions = (state: RootState) =>
  state.ia?.locationPredictions || [];

export const selectCurrentLocationPrediction = (state: RootState) =>
  state.ia?.currentLocationPrediction || null;

export const selectPredictionsByPerson = (state: RootState, personId: string) => {
  return (state.ia?.locationPredictions || []).filter(
    (prediction: LocationPredictionResult) => prediction.person_id === personId,
  );
};

export const selectLatestPrediction = (state: RootState) => {
  const predictions = state.ia?.locationPredictions || [];
  return predictions.length > 0 ? predictions[0] : null;
};

// ============================================
// SIMILARITIES DETECTION SELECTORS
// ============================================

export const selectSimilaritiesResults = (state: RootState) =>
  state.ia?.similaritiesResults || [];

export const selectCurrentSimilarities = (state: RootState) =>
  state.ia?.currentSimilarities || null;

export const selectTopSimilarMatches = (state: RootState, limit: number = 5) => {
  const current = state.ia?.currentSimilarities;
  if (!current) return [];

  return current.matches.slice(0, limit);
};

// ============================================
// GLOBAL IA STATE SELECTORS
// ============================================

export const selectIALoading = (state: RootState) => state.ia?.loading || false;

export const selectIAError = (state: RootState) => state.ia?.error || null;

export const selectSelectedPersonId = (state: RootState) => state.ia?.selectedPersonId || null;

export const selectAnalysisMode = (state: RootState) => state.ia?.analysisMode || null;

export const selectConfidenceThreshold = (state: RootState) => state.ia?.confidenceThreshold || 70;

// ============================================
// COMPUTED SELECTORS
// ============================================

export const selectIAAnalysisSummary = (state: RootState) => {
  const facialResults = state.ia?.facialRecognitionResults || [];
  const comparisonResults = state.ia?.imageComparisonResults || [];
  const predictions = state.ia?.locationPredictions || [];
  const similarities = state.ia?.similaritiesResults || [];

  const avgFacialConfidence =
    facialResults.length > 0
      ? facialResults.reduce((sum: number, r: FacialRecognitionResult) => sum + r.facial_features.confidence_facial, 0) /
        facialResults.length
      : 0;

  const avgSimilarityScore =
    comparisonResults.length > 0
      ? comparisonResults.reduce((sum: number, r: ImageComparisonResult) => sum + r.similarity_score, 0) / comparisonResults.length
      : 0;

  return {
    totalFacialAnalyses: facialResults.length,
    totalComparisons: comparisonResults.length,
    totalPredictions: predictions.length,
    totalSimilaritiesDetections: similarities.length,
    avgFacialConfidence: Math.round(avgFacialConfidence),
    avgSimilarityScore: Math.round(avgSimilarityScore),
    accuracyRate: Math.round(
      ((avgFacialConfidence + avgSimilarityScore) / 2 || 0),
    ),
  };
};

export const selectPersonAnalyticsSummary = (state: RootState, personId: string) => {
  const facialResults = (state.ia?.facialRecognitionResults || []).filter(
    (r: FacialRecognitionResult) => r.person_id === personId,
  );
  const predictions = (state.ia?.locationPredictions || []).filter(
    (p: LocationPredictionResult) => p.person_id === personId,
  );

  return {
    totalAnalyses: facialResults.length,
    totalPredictions: predictions.length,
    lastAnalysisDate: facialResults.length > 0 ? facialResults[0].analysis_date : null,
    lastPredictionDate: predictions.length > 0 ? predictions[0].prediction_date : null,
  };
};

export const selectAnalysisResults = (state: RootState, type: string) => {
  switch (type) {
    case 'facial':
      return state.ia?.facialRecognitionResults || [];
    case 'comparison':
      return state.ia?.imageComparisonResults || [];
    case 'location':
      return state.ia?.locationPredictions || [];
    case 'similarities':
      return state.ia?.similaritiesResults || [];
    default:
      return [];
  }
};
