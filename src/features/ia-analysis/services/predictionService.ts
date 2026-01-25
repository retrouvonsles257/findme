/**
 * =====================================================
 * RETROUVONSLES - Location Prediction Service
 * Specialized service for location prediction operations
 * =====================================================
 */

import type { LocationPredictionResult } from '../types';

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Analyze movement pattern from prediction
 */
export const analyzeMovementPattern = (prediction: LocationPredictionResult) => {
  const pattern = prediction.movement_pattern;

  return {
    type: pattern.type,
    confidence: pattern.confidence,
    description: getMovementPatternDescription(pattern.type),
  };
};

/**
 * Get description for movement pattern type
 */
export const getMovementPatternDescription = (
  type: 'stationary' | 'nomadic' | 'routine' | 'erratic',
): string => {
  const descriptions: Record<string, string> = {
    stationary: 'Person tends to stay in one location',
    nomadic: 'Person moves frequently between multiple locations',
    routine: 'Person follows a predictable daily/weekly pattern',
    erratic: 'Person movement is unpredictable and random',
  };

  return descriptions[type] || 'Unknown pattern';
};

/**
 * Get most likely location from predictions
 */
export const getMostLikelyLocation = (prediction: LocationPredictionResult) => {
  if (!prediction.predicted_locations || prediction.predicted_locations.length === 0) {
    return null;
  }

  return prediction.predicted_locations.reduce((prev, current) =>
    prev.probability > current.probability ? prev : current,
  );
};

/**
 * Filter predictions by probability threshold
 */
export const filterPredictionsByProbability = (
  prediction: LocationPredictionResult,
  minProbability: number,
) => {
  return {
    ...prediction,
    predicted_locations: prediction.predicted_locations.filter(
      (loc) => loc.probability >= minProbability,
    ),
  };
};

/**
 * Calculate coverage area from predictions
 */
export const calculateCoverageArea = (prediction: LocationPredictionResult): number => {
  if (prediction.predicted_locations.length < 2) return 0;

  let maxDistance = 0;
  const locations = prediction.predicted_locations;

  for (let i = 0; i < locations.length; i++) {
    for (let j = i + 1; j < locations.length; j++) {
      const distance = calculateDistance(
        locations[i].latitude,
        locations[i].longitude,
        locations[j].latitude,
        locations[j].longitude,
      );
      maxDistance = Math.max(maxDistance, distance);
    }
  }

  return maxDistance;
};

/**
 * Get prediction confidence level
 */
export const getPredictionConfidenceLevel = (
  averageProbability: number,
): 'High' | 'Medium' | 'Low' => {
  if (averageProbability >= 75) return 'High';
  if (averageProbability >= 50) return 'Medium';
  return 'Low';
};

/**
 * Check if prediction is reliable
 */
export const isPredictionReliable = (
  prediction: LocationPredictionResult,
  minConfidence: number = 60,
): boolean => {
  if (prediction.predicted_locations.length === 0) return false;

  const avgProbability =
    prediction.predicted_locations.reduce((sum, loc) => sum + loc.probability, 0) /
    prediction.predicted_locations.length;

  return avgProbability >= minConfidence && prediction.movement_pattern.confidence >= minConfidence;
};

/**
 * Get location from coordinates with distance
 */
export const getLocationWithDistance = (
  referenceLocation: { latitude: number; longitude: number },
  otherLocation: { latitude: number; longitude: number },
) => {
  const distance = calculateDistance(
    referenceLocation.latitude,
    referenceLocation.longitude,
    otherLocation.latitude,
    otherLocation.longitude,
  );

  return {
    ...otherLocation,
    distance_km: distance,
  };
};
