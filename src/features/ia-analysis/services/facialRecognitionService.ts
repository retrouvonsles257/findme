/**
 * =====================================================
 * RETROUVONSLES - Facial Recognition Service
 * Specialized service for facial recognition operations
 * =====================================================
 */

import type { FacialRecognitionResult, FacialFeatures } from '../types';

/**
 * Extract facial features from result
 */
export const extractFacialFeatures = (result: FacialRecognitionResult): FacialFeatures => {
  return result.facial_features;
};

/**
 * Compare two sets of facial features
 */
export const compareFacialFeatures = (
  features1: FacialFeatures,
  features2: FacialFeatures,
): number => {
  let score = 0;
  let factors = 0;

  // Age comparison (if both available)
  if (features1.age_estimated !== undefined && features2.age_estimated !== undefined) {
    const ageDiff = Math.abs(features1.age_estimated - features2.age_estimated);
    const ageScore = Math.max(0, 100 - ageDiff * 5); // 5 points per year
    score += ageScore;
    factors++;
  }

  // Gender comparison
  if (features1.gender && features2.gender && features1.gender !== 'unknown' && features2.gender !== 'unknown') {
    score += features1.gender === features2.gender ? 100 : 0;
    factors++;
  }

  // Face quality average
  const qualityScore = (features1.face_quality + features2.face_quality) / 2;
  score += qualityScore;
  factors++;

  return factors > 0 ? score / factors : 0;
};

/**
 * Get facial landmarks distance
 */
export const getFacialLandmarksDistance = (
  landmarks1: Array<{ x: number; y: number; name: string }>,
  landmarks2: Array<{ x: number; y: number; name: string }>,
): number => {
  if (landmarks1.length === 0 || landmarks2.length === 0) return 0;

  let totalDistance = 0;
  let commonLandmarks = 0;

  for (const lm1 of landmarks1) {
    const lm2 = landmarks2.find((l) => l.name === lm1.name);
    if (lm2) {
      const dx = lm1.x - lm2.x;
      const dy = lm1.y - lm2.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
      commonLandmarks++;
    }
  }

  return commonLandmarks > 0 ? totalDistance / commonLandmarks : 0;
};

/**
 * Assess face quality
 */
export const assessFaceQuality = (features: FacialFeatures): string => {
  const quality = features.face_quality;

  if (quality >= 85) return 'Excellent';
  if (quality >= 70) return 'Good';
  if (quality >= 50) return 'Fair';
  if (quality >= 30) return 'Poor';
  return 'Very Poor';
};

/**
 * Get age category
 */
export const getAgeCategory = (age: number | undefined): string => {
  if (age === undefined) return 'Unknown';

  if (age < 13) return 'Child';
  if (age < 18) return 'Teenager';
  if (age < 65) return 'Adult';
  return 'Senior';
};

/**
 * Check if facial features are valid for recognition
 */
export const isFacialFeaturesValidForRecognition = (
  features: FacialFeatures,
  minConfidence: number = 70,
  minQuality: number = 50,
): boolean => {
  return (
    features.confidence_facial >= minConfidence &&
    features.face_quality >= minQuality
  );
};

/**
 * Aggregate similarity scores from multiple comparisons
 */
export const aggregateSimilarityScores = (
  scoresList: Record<string, number>[],
): Record<string, number> => {
  const aggregated: Record<string, number> = {};

  for (const scores of scoresList) {
    for (const [personId, score] of Object.entries(scores)) {
      if (!aggregated[personId]) {
        aggregated[personId] = 0;
      }
      aggregated[personId] += score;
    }
  }

  // Calculate averages
  for (const personId in aggregated) {
    aggregated[personId] /= scoresList.length;
  }

  return aggregated;
};

/**
 * Get top similarity matches
 */
export const getTopSimilarityMatches = (
  scores: Record<string, number>,
  limit: number = 5,
): Array<[string, number]> => {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
};
