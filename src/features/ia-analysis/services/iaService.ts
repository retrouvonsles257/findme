/**
 * =====================================================
 * RETROUVONSLES - IA Service
 * Business logic for IA analysis operations
 * =====================================================
 */

import type {
  FacialFeatures,
  FacialRecognitionResult,
  ImageComparisonResult,
  LocationPredictionResult,
  SimilarityMatch,
} from '../types';

/**
 * Validate facial features data
 */
export const validateFacialFeatures = (features: FacialFeatures): boolean => {
  if (!features || typeof features !== 'object') return false;

  if (features.confidence_facial < 0 || features.confidence_facial > 100) return false;
  if (features.face_quality < 0 || features.face_quality > 100) return false;

  return true;
};

/**
 * Calculate weighted confidence score
 */
export const calculateWeightedConfidence = (
  facialConfidence: number,
  qualityScore: number,
  similarityScores: Record<string, number> = {},
): number => {
  const weights = {
    facial: 0.4,
    quality: 0.3,
    similarity: 0.3,
  };

  const avgSimilarity =
    Object.values(similarityScores).length > 0
      ? Object.values(similarityScores).reduce((a, b) => a + b, 0) /
        Object.values(similarityScores).length
      : 0;

  return (
    facialConfidence * weights.facial +
    qualityScore * weights.quality +
    avgSimilarity * weights.similarity
  );
};

/**
 * Filter results by confidence threshold
 */
export const filterByConfidence = (
  results: FacialRecognitionResult[],
  threshold: number,
): FacialRecognitionResult[] => {
  return results.filter((result) => result.facial_features.confidence_facial >= threshold);
};

/**
 * Group results by person
 */
export const groupResultsByPerson = (
  results: FacialRecognitionResult[],
): Record<string, FacialRecognitionResult[]> => {
  return results.reduce(
    (acc, result) => {
      const personId = result.person_id || 'unknown';
      if (!acc[personId]) {
        acc[personId] = [];
      }
      acc[personId].push(result);
      return acc;
    },
    {} as Record<string, FacialRecognitionResult[]>,
  );
};

/**
 * Get best matching result
 */
export const getBestMatch = (results: FacialRecognitionResult[]): FacialRecognitionResult | null => {
  if (results.length === 0) return null;

  return results.reduce((best, current) => {
    const currentScore = calculateWeightedConfidence(
      current.facial_features.confidence_facial,
      current.facial_features.face_quality,
      current.similarity_scores,
    );
    const bestScore = calculateWeightedConfidence(
      best.facial_features.confidence_facial,
      best.facial_features.face_quality,
      best.similarity_scores,
    );

    return currentScore > bestScore ? current : best;
  });
};

/**
 * Calculate average similarity between comparisons
 */
export const calculateAverageSimilarity = (
  comparisons: ImageComparisonResult[],
): number => {
  if (comparisons.length === 0) return 0;
  const sum = comparisons.reduce((acc, comp) => acc + comp.similarity_score, 0);
  return sum / comparisons.length;
};

/**
 * Extract movement pattern from predictions
 */
export const identifyMovementPattern = (predictions: LocationPredictionResult[]) => {
  if (predictions.length === 0) {
    return {
      type: 'unknown' as const,
      confidence: 0,
    };
  }

  const latestPrediction = predictions[0];
  return latestPrediction.movement_pattern;
};

/**
 * Filter similarity matches by score
 */
export const filterSimilarityMatches = (
  matches: SimilarityMatch[],
  minScore: number,
): SimilarityMatch[] => {
  return matches.filter((match) => match.similarity_score >= minScore);
};

/**
 * Sort similarity matches by score
 */
export const sortSimilarityMatches = (matches: SimilarityMatch[]): SimilarityMatch[] => {
  return [...matches].sort((a, b) => b.similarity_score - a.similarity_score);
};

/**
 * Validate image comparison result
 */
export const isReliableComparison = (
  result: ImageComparisonResult,
  minConfidence: number = 70,
): boolean => {
  return (
    result.facial_match_confidence >= minConfidence &&
    result.structural_similarity >= minConfidence
  );
};

/**
 * Get confidence level text
 */
export const getConfidenceLevelText = (score: number): string => {
  if (score >= 90) return 'Very High';
  if (score >= 75) return 'High';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'Low';
  return 'Very Low';
};

/**
 * Calculate analysis duration
 */
export const calculateAnalysisDuration = (startDate: string, endDate: string): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.round((end - start) / 1000); // in seconds
};
