/**
 * =====================================================
 * RETROUVONSLES - IA API Service
 * Direct Supabase database operations for IA analysis
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  FacialRecognitionResult,
  ImageComparisonResult,
  LocationPredictionResult,
  SimilaritiesDetectionResult,
  FacialRecognitionFormData,
  ImageComparisonFormData,
  LocationPredictionFormData,
  SimilaritiesDetectionFormData,
} from '../types';

// Type-safe Supabase wrapper
const db = {
  from: (table: string) => (supabase.from(table) as any),
};

// ============================================
// FACIAL RECOGNITION OPERATIONS
// ============================================

export const analyzeFacialImage = async (
  data: FacialRecognitionFormData,
): Promise<FacialRecognitionResult> => {
  const { data: result, error } = await db
    .from('ia_facial_recognition')
    .insert({
      image_id: data.image_id,
      person_id: data.person_id,
      analysis_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const getFacialRecognitionResults = async (
  personId?: string,
): Promise<FacialRecognitionResult[]> => {
  let query = db.from('ia_facial_recognition');

  if (personId) {
    query = query.eq('person_id', personId);
  }

  const { data, error } = await query.select('*').order('analysis_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getFacialRecognitionById = async (
  id: string,
): Promise<FacialRecognitionResult> => {
  const { data, error } = await db
    .from('ia_facial_recognition')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// IMAGE COMPARISON OPERATIONS
// ============================================

export const compareImages = async (
  data: ImageComparisonFormData,
): Promise<ImageComparisonResult> => {
  const { data: result, error } = await db
    .from('ia_image_comparison')
    .insert({
      image_1_id: data.image_1_id,
      image_2_id: data.image_2_id,
      comparison_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const getImageComparisonResults = async (): Promise<ImageComparisonResult[]> => {
  const { data, error } = await db
    .from('ia_image_comparison')
    .select('*')
    .order('analysis_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getImageComparisonById = async (id: string): Promise<ImageComparisonResult> => {
  const { data, error } = await db
    .from('ia_image_comparison')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// LOCATION PREDICTION OPERATIONS
// ============================================

export const predictLocation = async (
  data: LocationPredictionFormData,
): Promise<LocationPredictionResult> => {
  const { data: result, error } = await db
    .from('ia_location_prediction')
    .insert({
      person_id: data.person_id,
      include_historical: data.include_historical ?? true,
      prediction_range_days: data.prediction_range_days ?? 30,
      prediction_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const getLocationPredictions = async (
  personId?: string,
): Promise<LocationPredictionResult[]> => {
  let query = db.from('ia_location_prediction');

  if (personId) {
    query = query.eq('person_id', personId);
  }

  const { data, error } = await query.select('*').order('prediction_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getLocationPredictionById = async (
  id: string,
): Promise<LocationPredictionResult> => {
  const { data, error } = await db
    .from('ia_location_prediction')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// SIMILARITIES DETECTION OPERATIONS
// ============================================

export const detectSimilarities = async (
  data: SimilaritiesDetectionFormData,
): Promise<SimilaritiesDetectionResult> => {
  const { data: result, error } = await db
    .from('ia_similarities_detection')
    .insert({
      image_id: data.image_id,
      similarity_threshold: data.similarity_threshold ?? 70,
      max_results: data.max_results ?? 10,
      analysis_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result;
};

export const getSimilaritiesResults = async (): Promise<SimilaritiesDetectionResult[]> => {
  const { data, error } = await db
    .from('ia_similarities_detection')
    .select('*')
    .order('analysis_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getSimilaritiesById = async (id: string): Promise<SimilaritiesDetectionResult> => {
  const { data, error } = await db
    .from('ia_similarities_detection')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// BATCH OPERATIONS
// ============================================

export const getAnalysisByPerson = async (personId: string) => {
  const [facialResults, locationPredictions] = await Promise.all([
    getFacialRecognitionResults(personId),
    getLocationPredictions(personId),
  ]);

  return {
    facialResults,
    locationPredictions,
  };
};

export const getAllAnalysisResults = async () => {
  const [facialResults, comparisonResults, locationPredictions, similaritiesResults] =
    await Promise.all([
      getFacialRecognitionResults(),
      getImageComparisonResults(),
      getLocationPredictions(),
      getSimilaritiesResults(),
    ]);

  return {
    facialResults,
    comparisonResults,
    locationPredictions,
    similaritiesResults,
  };
};
