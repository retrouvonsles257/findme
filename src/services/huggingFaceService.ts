/**
 * =====================================================
 * RETROUVONSLES - Hugging Face AI Service
 * Service pour les appels réels à l'API Hugging Face
 * =====================================================
 */

import { envConfig } from '../config/env.config';

// ============================================
// CONFIGURATION
// ============================================

const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
const API_KEY = envConfig.REACT_APP_HUGGINGFACE_API_KEY;

// Modèles utilisés
export const HF_MODELS = {
  // Détection d'objets (inclut les visages)
  OBJECT_DETECTION: 'facebook/detr-resnet-50',
  
  // Classification d'images
  IMAGE_CLASSIFICATION: 'google/vit-base-patch16-224',
  
  // Estimation d'âge
  AGE_ESTIMATION: 'nateraw/vit-age-classifier',
  
  // Classification de genre
  GENDER_CLASSIFICATION: 'rizvandwiki/gender-classification',
  
  // Embeddings d'images (pour similarités)
  IMAGE_EMBEDDINGS: 'openai/clip-vit-base-patch32',
  
  // Détection de visages spécialisée
  FACE_DETECTION: 'dima806/facial_emotions_image_detection',
  
  // Caption d'images
  IMAGE_CAPTIONING: 'Salesforce/blip-image-captioning-base',
  
  // Analyse de sentiments/émotions sur les visages
  EMOTION_DETECTION: 'trpakov/vit-face-expression',
};

// ============================================
// TYPES
// ============================================

export interface HuggingFaceResponse {
  success: boolean;
  data: any;
  error?: string;
  model: string;
  processingTime: number;
}

export interface ObjectDetectionResult {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export interface ClassificationResult {
  label: string;
  score: number;
}

export interface FaceAnalysisResult {
  faceDetected: boolean;
  faces: Array<{
    box?: { xmin: number; ymin: number; xmax: number; ymax: number };
    confidence: number;
    emotions?: ClassificationResult[];
    age?: string;
    gender?: string;
  }>;
  overallQuality: number;
}

export interface SimilarityResult {
  embeddings: number[];
  similarity?: number;
  comparedWith?: string;
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Convertit un File en base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Retirer le préfixe data:image/...;base64,
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Convertit une URL d'image en Blob
 */
export const urlToBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return await response.blob();
};

/**
 * Vérifie si l'API Hugging Face est configurée
 */
export const isHuggingFaceConfigured = (): boolean => {
  return !!API_KEY && API_KEY.length > 0;
};

// ============================================
// APPELS API HUGGING FACE
// ============================================

/**
 * Appel générique à l'API Hugging Face
 */
const callHuggingFaceAPI = async (
  model: string,
  imageData: Blob | string,
  options?: { wait_for_model?: boolean }
): Promise<HuggingFaceResponse> => {
  const startTime = Date.now();

  if (!isHuggingFaceConfigured()) {
    return {
      success: false,
      data: null,
      error: 'API Hugging Face non configurée. Vérifiez REACT_APP_HUGGINGFACE_API_KEY.',
      model,
      processingTime: 0,
    };
  }

  try {
    let body: BodyInit;
    
    if (typeof imageData === 'string') {
      // C'est du base64
      body = JSON.stringify({ inputs: imageData });
    } else {
      // C'est un Blob
      body = imageData;
    }

    const response = await fetch(`${HUGGINGFACE_API_URL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        ...(typeof imageData === 'string' ? { 'Content-Type': 'application/json' } : {}),
      },
      body,
    });

    const processingTime = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Si le modèle est en train de charger, on peut réessayer
      if (response.status === 503 && errorData.error?.includes('loading')) {
        return {
          success: false,
          data: null,
          error: `Le modèle ${model} est en cours de chargement. Réessayez dans quelques secondes.`,
          model,
          processingTime,
        };
      }

      return {
        success: false,
        data: null,
        error: errorData.error || `Erreur API: ${response.status}`,
        model,
        processingTime,
      };
    }

    const data = await response.json();

    return {
      success: true,
      data,
      model,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      model,
      processingTime,
    };
  }
};

// ============================================
// FONCTIONS D'ANALYSE IA
// ============================================

/**
 * Détection d'objets dans une image (inclut les personnes/visages)
 */
export const detectObjects = async (
  imageFile: File
): Promise<HuggingFaceResponse & { objects?: ObjectDetectionResult[] }> => {
  const blob = imageFile;
  const result = await callHuggingFaceAPI(HF_MODELS.OBJECT_DETECTION, blob);

  if (result.success && Array.isArray(result.data)) {
    return {
      ...result,
      objects: result.data as ObjectDetectionResult[],
    };
  }

  return result;
};

/**
 * Classification générale d'une image
 */
export const classifyImage = async (
  imageFile: File
): Promise<HuggingFaceResponse & { classifications?: ClassificationResult[] }> => {
  const blob = imageFile;
  const result = await callHuggingFaceAPI(HF_MODELS.IMAGE_CLASSIFICATION, blob);

  if (result.success && Array.isArray(result.data)) {
    return {
      ...result,
      classifications: result.data as ClassificationResult[],
    };
  }

  return result;
};

/**
 * Estimation de l'âge d'une personne
 */
export const estimateAge = async (
  imageFile: File
): Promise<HuggingFaceResponse & { ageEstimate?: string; confidence?: number }> => {
  const blob = imageFile;
  const result = await callHuggingFaceAPI(HF_MODELS.AGE_ESTIMATION, blob);

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    // Trier par score et prendre le meilleur
    const sorted = (result.data as ClassificationResult[]).sort((a, b) => b.score - a.score);
    return {
      ...result,
      ageEstimate: sorted[0].label,
      confidence: sorted[0].score,
    };
  }

  return result;
};

/**
 * Classification du genre
 */
export const classifyGender = async (
  imageFile: File
): Promise<HuggingFaceResponse & { gender?: string; confidence?: number }> => {
  const blob = imageFile;
  const result = await callHuggingFaceAPI(HF_MODELS.GENDER_CLASSIFICATION, blob);

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    const sorted = (result.data as ClassificationResult[]).sort((a, b) => b.score - a.score);
    return {
      ...result,
      gender: sorted[0].label,
      confidence: sorted[0].score,
    };
  }

  return result;
};

/**
 * Détection des émotions sur un visage
 */
export const detectEmotions = async (
  imageFile: File
): Promise<HuggingFaceResponse & { emotions?: ClassificationResult[] }> => {
  const blob = imageFile;
  const result = await callHuggingFaceAPI(HF_MODELS.EMOTION_DETECTION, blob);

  if (result.success && Array.isArray(result.data)) {
    return {
      ...result,
      emotions: (result.data as ClassificationResult[]).sort((a, b) => b.score - a.score),
    };
  }

  return result;
};

/**
 * Génération de caption pour une image
 */
export const generateCaption = async (
  imageFile: File
): Promise<HuggingFaceResponse & { caption?: string }> => {
  const blob = imageFile;
  const result = await callHuggingFaceAPI(HF_MODELS.IMAGE_CAPTIONING, blob);

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    return {
      ...result,
      caption: result.data[0].generated_text,
    };
  }

  return result;
};

/**
 * Analyse complète d'un visage (combine plusieurs modèles)
 */
export const analyzeFace = async (
  imageFile: File
): Promise<FaceAnalysisResult & { processingTime: number; rawResponses: any[] }> => {
  const startTime = Date.now();
  const rawResponses: any[] = [];

  // Exécuter plusieurs analyses en parallèle
  const [objectsResult, ageResult, genderResult, emotionsResult] = await Promise.all([
    detectObjects(imageFile),
    estimateAge(imageFile),
    classifyGender(imageFile),
    detectEmotions(imageFile),
  ]);

  rawResponses.push(
    { type: 'objects', ...objectsResult },
    { type: 'age', ...ageResult },
    { type: 'gender', ...genderResult },
    { type: 'emotions', ...emotionsResult }
  );

  // Extraire les personnes/visages détectés
  const persons = (objectsResult.objects || []).filter(
    (obj) => obj.label.toLowerCase() === 'person' || obj.label.toLowerCase() === 'face'
  );

  const faceDetected = persons.length > 0 || (ageResult.success && !!ageResult.ageEstimate);

  // Construire le résultat
  const faces = faceDetected
    ? [
        {
          box: persons[0]?.box,
          confidence: persons[0]?.score || (ageResult.confidence || 0.5),
          emotions: emotionsResult.emotions,
          age: ageResult.ageEstimate,
          gender: genderResult.gender,
        },
      ]
    : [];

  // Calculer un score de qualité global
  const qualityFactors = [
    ageResult.success ? 1 : 0,
    genderResult.success ? 1 : 0,
    emotionsResult.success ? 1 : 0,
    persons.length > 0 ? 1 : 0,
  ];
  const overallQuality = (qualityFactors.reduce((a, b) => a + b, 0) / qualityFactors.length) * 100;

  return {
    faceDetected,
    faces,
    overallQuality,
    processingTime: Date.now() - startTime,
    rawResponses,
  };
};

/**
 * Calcul de similarité entre deux images (via embeddings CLIP)
 */
export const calculateImageSimilarity = async (
  image1: File,
  image2: File
): Promise<{ similarity: number; processingTime: number; success: boolean; error?: string }> => {
  const startTime = Date.now();

  // Note: CLIP ne supporte pas directement la comparaison
  // On utilise une approche alternative avec la classification

  try {
    // Générer des captions pour les deux images
    const [caption1, caption2] = await Promise.all([
      generateCaption(image1),
      generateCaption(image2),
    ]);

    if (!caption1.success || !caption2.success) {
      return {
        similarity: 0,
        processingTime: Date.now() - startTime,
        success: false,
        error: 'Impossible de générer les descriptions des images',
      };
    }

    // Calculer une similarité textuelle simple (Jaccard)
    const words1 = new Set((caption1.caption || '').toLowerCase().split(/\s+/));
    const words2 = new Set((caption2.caption || '').toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    const similarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;

    return {
      similarity: Math.min(100, similarity * 2), // Amplifier légèrement
      processingTime: Date.now() - startTime,
      success: true,
    };
  } catch (error) {
    return {
      similarity: 0,
      processingTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Erreur lors du calcul de similarité',
    };
  }
};

// ============================================
// EXPORT
// ============================================

export const huggingFaceService = {
  isConfigured: isHuggingFaceConfigured,
  models: HF_MODELS,
  
  // Fonctions individuelles
  detectObjects,
  classifyImage,
  estimateAge,
  classifyGender,
  detectEmotions,
  generateCaption,
  
  // Analyses combinées
  analyzeFace,
  calculateImageSimilarity,
  
  // Utilitaires
  fileToBase64,
  urlToBlob,
};

export default huggingFaceService;
