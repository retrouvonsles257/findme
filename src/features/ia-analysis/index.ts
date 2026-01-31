// Components
export * from './components';
export type {
  FacialRecognitionPanelProps,
  ImageComparisonPanelProps,
  LocationPredictionProps,
  SimilaritiesDetectionProps,
  IAResultsPanelProps,
  IAConfidenceChartProps,
} from './components';

// Hooks
export { useFacialRecognition, useIAAnalysis, useLocationPrediction } from './hooks';
export type { UseFacialRecognitionReturn, UseIAAnalysisReturn, UseLocationPredictionReturn } from './types';

// Services
export {
  analyzeFacialImage,
  getFacialRecognitionResults,
  getFacialRecognitionById,
  compareImages,
  getImageComparisonResults,
  getImageComparisonById,
  predictLocation,
  getLocationPredictions,
  getLocationPredictionById,
  detectSimilarities,
  getSimilaritiesResults,
  getSimilaritiesById,
  getAnalysisByDossier,
  getAllAnalysisResults,
  checkIAServiceStatus,
  detectObjectsInImage,
} from './services/iaAPI';

export type {
  ResultatIA,
  CreateResultatIAInput,
  TypeAnalyse,
  StatutValidationIA,
  ActionGeneree,
} from './services/iaAPI';

export {
  validateFacialFeatures,
  calculateWeightedConfidence,
  filterByConfidence,
  groupResultsByPerson,
  getBestMatch,
  calculateAverageSimilarity,
  identifyMovementPattern,
  filterSimilarityMatches,
  sortSimilarityMatches,
  isReliableComparison,
  getConfidenceLevelText,
  calculateAnalysisDuration,
} from './services/iaService';

export {
  extractFacialFeatures,
  compareFacialFeatures,
  getFacialLandmarksDistance,
  assessFaceQuality,
  getAgeCategory,
  isFacialFeaturesValidForRecognition,
  aggregateSimilarityScores,
  getTopSimilarityMatches,
} from './services/facialRecognitionService';

export {
  calculateDistance,
  analyzeMovementPattern,
  getMovementPatternDescription,
  getMostLikelyLocation,
  filterPredictionsByProbability,
  calculateCoverageArea,
  getPredictionConfidenceLevel,
  isPredictionReliable,
  getLocationWithDistance,
} from './services/predictionService';

// Auto-trigger IA (déclenchement automatique)
export {
  triggerAutoAnalysis,
  triggerDossierAnalysis,
  triggerSignalementAnalysis,
  confirmIAResult,
  rejectIAResult,
  markNeedsVerification,
} from './services/iaAutoTrigger';

export type { PhotoAnalysisRequest, AutoTriggerResult } from './services/iaAutoTrigger';

// Store
export {
  fetchFacialRecognitionResults,
  fetchImageComparisonResults,
  fetchLocationPredictions,
  performLocationPrediction,
  fetchSimilaritiesResults,
  addFacialRecognitionResult,
  addImageComparisonResult,
  addSimilaritiesResult,
  setCurrentFacialAnalysis,
  setCurrentComparison,
  setCurrentLocationPrediction,
  setCurrentSimilarities,
  setSelectedPersonId,
  setAnalysisMode,
  setConfidenceThreshold,
  setLoading,
  setError,
  clearError,
  resetState,
} from './store/iaSlice';

export {
  selectFacialRecognitionResults,
  selectCurrentFacialAnalysis,
  selectFacialResultsByPerson,
  selectBestFacialMatch,
  selectImageComparisonResults,
  selectCurrentComparison,
  selectHighConfidenceComparisons,
  selectSamePeople,
  selectLocationPredictions,
  selectCurrentLocationPrediction,
  selectPredictionsByPerson,
  selectLatestPrediction,
  selectSimilaritiesResults,
  selectCurrentSimilarities,
  selectTopSimilarMatches,
  selectIALoading,
  selectIAError,
  selectSelectedPersonId,
  selectAnalysisMode,
  selectConfidenceThreshold,
  selectIAAnalysisSummary,
  selectPersonAnalyticsSummary,
  selectAnalysisResults,
} from './store/iaSelectors';

// Types
export * from './types';
