/**
 * =====================================================
 * RETROUVONSLES - IA Analysis Types
 * Types for facial recognition and IA analysis
 * =====================================================
 */

// ============================================
// FACIAL RECOGNITION TYPES
// ============================================

export interface FacialFeatures {
  age_estimated?: number;
  gender?: 'male' | 'female' | 'unknown';
  confidence_facial: number; // 0-100
  face_quality: number; // 0-100
  landmarks?: Array<{
    x: number;
    y: number;
    name: string;
  }>;
}

export interface FacialRecognitionResult {
  id: string;
  image_id: string;
  person_id?: string;
  facial_features: FacialFeatures;
  similarity_scores: Record<string, number>; // person_id -> similarity score
  best_match?: {
    person_id: string;
    similarity: number;
  };
  analysis_date: string;
  model_version: string;
}

// ============================================
// IMAGE COMPARISON TYPES
// ============================================

export interface ImageComparisonResult {
  id: string;
  image_1_id: string;
  image_2_id: string;
  similarity_score: number; // 0-100
  facial_match_confidence: number; // 0-100
  structural_similarity: number; // 0-100
  comparison_details: {
    eyes_alignment: number;
    nose_alignment: number;
    mouth_alignment: number;
    face_shape_similarity: number;
    skin_tone_similarity: number;
  };
  analysis_date: string;
  is_same_person: boolean;
}

// ============================================
// LOCATION PREDICTION TYPES
// ============================================

export interface LocationPredictionResult {
  id: string;
  person_id: string;
  last_known_location: {
    latitude: number;
    longitude: number;
    address: string;
    date: string;
  };
  predicted_locations: Array<{
    latitude: number;
    longitude: number;
    probability: number; // 0-100
    reason: string;
  }>;
  movement_pattern: {
    type: 'stationary' | 'nomadic' | 'routine' | 'erratic';
    confidence: number;
  };
  prediction_date: string;
}

// ============================================
// SIMILARITIES DETECTION TYPES
// ============================================

export interface SimilarityMatch {
  person_id: string;
  name: string;
  similarity_score: number; // 0-100
  matched_features: string[];
  images_count: number;
  last_updated: string;
}

export interface SimilaritiesDetectionResult {
  id: string;
  source_image_id: string;
  source_person_id?: string;
  matches: SimilarityMatch[];
  total_analyzed: number;
  analysis_date: string;
  threshold_used: number;
}

// ============================================
// IA ANALYSIS STATE TYPES
// ============================================

export interface IAAnalysisState {
  // Facial Recognition
  facialRecognitionResults: FacialRecognitionResult[];
  currentFacialAnalysis: FacialRecognitionResult | null;

  // Image Comparison
  imageComparisonResults: ImageComparisonResult[];
  currentComparison: ImageComparisonResult | null;

  // Location Prediction
  locationPredictions: LocationPredictionResult[];
  currentLocationPrediction: LocationPredictionResult | null;

  // Similarities
  similaritiesResults: SimilaritiesDetectionResult[];
  currentSimilarities: SimilaritiesDetectionResult | null;

  // UI State
  loading: boolean;
  error: string | null;
  selectedPersonId: string | null;
  analysisMode: 'facial' | 'comparison' | 'location' | 'similarities' | null;
  confidenceThreshold: number; // 0-100
}

// ============================================
// FORM TYPES
// ============================================

export interface FacialRecognitionFormData {
  image_id: string;
  person_id?: string;
  confidence_threshold?: number;
}

export interface ImageComparisonFormData {
  image_1_id: string;
  image_2_id: string;
}

export interface LocationPredictionFormData {
  person_id: string;
  include_historical?: boolean;
  prediction_range_days?: number;
}

export interface SimilaritiesDetectionFormData {
  image_id: string;
  similarity_threshold?: number;
  max_results?: number;
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseFacialRecognitionReturn {
  results: FacialRecognitionResult[];
  currentAnalysis: FacialRecognitionResult | null;
  analyzeFacial: (data: FacialRecognitionFormData) => Promise<FacialRecognitionResult>;
  getFacialHistory: (personId: string) => Promise<FacialRecognitionResult[]>;
  setCurrentAnalysis: (result: FacialRecognitionResult | null) => void;
  isLoading: boolean;
  error: string | null;
}

export interface UseIAAnalysisReturn {
  facialResults: FacialRecognitionResult[];
  comparisonResults: ImageComparisonResult[];
  locationPredictions: LocationPredictionResult[];
  similaritiesResults: SimilaritiesDetectionResult[];
  isLoading: boolean;
  error: string | null;
  analysisMode: 'facial' | 'comparison' | 'location' | 'similarities' | null;
  setAnalysisMode: (mode: 'facial' | 'comparison' | 'location' | 'similarities' | null) => void;
  confidenceThreshold: number;
  setConfidenceThreshold: (threshold: number) => void;
}

export interface UseLocationPredictionReturn {
  predictions: LocationPredictionResult[];
  currentPrediction: LocationPredictionResult | null;
  predictLocation: (data: LocationPredictionFormData) => Promise<LocationPredictionResult>;
  getPredictionHistory: (personId: string) => Promise<LocationPredictionResult[]>;
  setCurrentPrediction: (result: LocationPredictionResult | null) => void;
  isLoading: boolean;
  error: string | null;
}

// ============================================
// ERROR TYPES
// ============================================

export interface IAFormErrors {
  image_id?: string;
  person_id?: string;
  confidence_threshold?: string;
  similarity_score?: string;
  general?: string;
}

// ============================================
// COMPONENT PROP TYPES
// ============================================

export interface FacialRecognitionPanelProps {
  className?: string;
  onAnalysisComplete?: (result: FacialRecognitionResult) => void;
}

export interface ImageComparisonPanelProps {
  className?: string;
  onComparisonComplete?: (result: ImageComparisonResult) => void;
}

export interface LocationPredictionProps {
  personId?: string;
  className?: string;
  onPredictionComplete?: (result: LocationPredictionResult) => void;
}

export interface SimilaritiesDetectionProps {
  imageId?: string;
  className?: string;
  onDetectionComplete?: (result: SimilaritiesDetectionResult) => void;
}

export interface IAResultsPanelProps {
  results: FacialRecognitionResult | ImageComparisonResult | LocationPredictionResult | SimilaritiesDetectionResult | null;
  type: 'facial' | 'comparison' | 'location' | 'similarities';
  className?: string;
}

export interface IAConfidenceChartProps {
  confidenceScore: number;
  title?: string;
  showDetails?: boolean;
  className?: string;
}
