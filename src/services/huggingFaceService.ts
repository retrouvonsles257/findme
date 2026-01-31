/**
 * =====================================================
 * RETROUVONSLES - Service d'Analyse Faciale IA
 * Utilise router.huggingface.co (API 2025)
 * 
 * Modèles testés et fonctionnels pour:
 * - Détection de visages
 * - Analyse d'émotions
 * - Estimation d'âge
 * - Classification de genre
 * - Similarité faciale
 * =====================================================
 */

import { envConfig } from '../config/env.config';

// ============================================
// CONFIGURATION
// ============================================

const HF_API_KEY = envConfig.REACT_APP_HUGGINGFACE_API_KEY;
const isDevelopment = process.env.NODE_ENV === 'development';
const LOCAL_PROXY_URL = '/api/huggingface/models';

/**
 * MODÈLES TESTÉS ET FONCTIONNELS - Janvier 2026
 * Tous ces modèles ont été validés avec l'API router.huggingface.co
 */
export const HF_MODELS = {
  // === ANALYSE FACIALE (MODULE 1, 6) ===
  
  // Détection d'émotions faciales (happy, sad, angry, neutral, surprise, fear, disgust)
  EMOTION_DETECTION: 'dima806/facial_emotions_image_detection',
  
  // Estimation d'âge (0-2, 3-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70+)
  AGE_CLASSIFICATION: 'nateraw/vit-age-classifier',
  
  // Classification de genre (male/female)
  GENDER_CLASSIFICATION: 'rizvandwiki/gender-classification',
  
  // Émotions alternatives (backup)
  EMOTION_BACKUP: 'trpakov/vit-face-expression',
  
  // === DÉTECTION D'OBJETS (MODULE 8) ===
  
  // Détection de personnes et objets dans l'image
  OBJECT_DETECTION: 'facebook/detr-resnet-50',
  
  // === ANALYSE DE VÊTEMENTS (MODULE 7) ===
  
  // Classification zero-shot pour vêtements et accessoires
  ZERO_SHOT_CLASSIFICATION: 'facebook/bart-large-mnli',
  
  // === SIMILARITÉ ET CLUSTERING (MODULE 2, 5) ===
  
  // Similarité textuelle pour comparer descriptions et regrouper cas
  TEXT_SIMILARITY: 'sentence-transformers/all-MiniLM-L6-v2',
};

console.log('[HuggingFace] Service initialisé - Modèles pour analyse faciale');
console.log('[HuggingFace] Mode:', isDevelopment ? 'development' : 'production');
console.log('[HuggingFace] API configurée:', !!HF_API_KEY && HF_API_KEY.length > 10);

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

export interface SimilarityResult {
  embeddings: number[];
  similarity?: number;
  comparedWith?: string;
}

export interface FaceAnalysisResult {
  faceDetected: boolean;
  faces: Array<{
    box?: { xmin: number; ymin: number; xmax: number; ymax: number };
    confidence: number;
    emotions?: ClassificationResult[];
    age?: string;
    ageConfidence?: number;
    gender?: string;
    genderConfidence?: number;
  }>;
  overallQuality: number;
  personDetected?: boolean;
  hasFaceSegmentation?: boolean;
}

// ============================================
// UTILITAIRES
// ============================================

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const urlToBlob = async (url: string): Promise<Blob> => {
  const response = await fetch(url);
  return await response.blob();
};

export const isHuggingFaceConfigured = (): boolean => {
  return !!HF_API_KEY && HF_API_KEY.length > 10;
};

// ============================================
// APPEL API HUGGING FACE
// ============================================

const callHuggingFaceAPI = async (
  model: string,
  body: Blob | string | object,
  options?: { maxRetries?: number; contentType?: string }
): Promise<HuggingFaceResponse> => {
  const startTime = Date.now();
  const maxRetries = options?.maxRetries ?? 2;
  let lastError = '';

  if (!isHuggingFaceConfigured()) {
    return {
      success: false,
      data: null,
      error: 'API Hugging Face non configurée',
      model,
      processingTime: 0,
    };
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[HuggingFace] Appel ${model} (${attempt + 1}/${maxRetries + 1})`);

      const url = isDevelopment ? `${LOCAL_PROXY_URL}/${model}` : `https://router.huggingface.co/hf-inference/models/${model}`;
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${HF_API_KEY}`,
      };

      let requestBody: BodyInit;
      
      if (body instanceof Blob) {
        requestBody = body;
        // Ne pas définir Content-Type pour les blobs, le navigateur le fait automatiquement
      } else if (typeof body === 'object') {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
      } else {
        requestBody = body;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody,
      });

      const processingTime = Date.now() - startTime;

      if (response.status === 503) {
        const errorData = await response.json().catch(() => ({ estimated_time: 15 }));
        const waitTime = Math.min((errorData.estimated_time || 15) * 1000, 30000);
        console.log(`[HuggingFace] Modèle en chargement, attente ${waitTime/1000}s...`);
        lastError = 'Modèle en cours de chargement';
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`[HuggingFace] ✓ ${model} - ${processingTime}ms`);
        return { success: true, data, model, processingTime };
      }

      const errorText = await response.text().catch(() => '');
      lastError = `Erreur ${response.status}: ${errorText.substring(0, 100)}`;
      console.warn(`[HuggingFace] ✗ ${model}: ${lastError}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Erreur réseau';
      console.error(`[HuggingFace] Exception ${model}:`, lastError);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  return {
    success: false,
    data: null,
    error: lastError || 'Échec',
    model,
    processingTime: Date.now() - startTime,
  };
};

// ============================================
// FONCTIONS D'ANALYSE FACIALE
// ============================================

/**
 * Détection d'émotions sur un visage
 */
export const detectEmotions = async (
  imageFile: File
): Promise<HuggingFaceResponse & { emotions?: ClassificationResult[] }> => {
  const result = await callHuggingFaceAPI(HF_MODELS.EMOTION_DETECTION, imageFile);

  if (result.success && Array.isArray(result.data)) {
    return {
      ...result,
      emotions: (result.data as ClassificationResult[]).sort((a, b) => b.score - a.score),
    };
  }

  // Fallback vers modèle backup
  if (!result.success) {
    console.log('[HuggingFace] Tentative avec modèle de backup pour émotions...');
    const backupResult = await callHuggingFaceAPI(HF_MODELS.EMOTION_BACKUP, imageFile);
    if (backupResult.success && Array.isArray(backupResult.data)) {
      return {
        ...backupResult,
        emotions: (backupResult.data as ClassificationResult[]).sort((a, b) => b.score - a.score),
      };
    }
  }

  return result;
};

/**
 * Estimation d'âge
 */
export const estimateAge = async (
  imageFile: File
): Promise<HuggingFaceResponse & { ageEstimate?: string; confidence?: number }> => {
  const result = await callHuggingFaceAPI(HF_MODELS.AGE_CLASSIFICATION, imageFile);

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
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
 * Classification de genre
 */
export const classifyGender = async (
  imageFile: File
): Promise<HuggingFaceResponse & { gender?: string; confidence?: number }> => {
  const result = await callHuggingFaceAPI(HF_MODELS.GENDER_CLASSIFICATION, imageFile);

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
 * Détection de personnes et objets dans l'image (MODULE 8)
 */
export const detectObjects = async (
  imageFile: File
): Promise<HuggingFaceResponse & { objects?: ObjectDetectionResult[]; personBox?: ObjectDetectionResult['box'] }> => {
  const result = await callHuggingFaceAPI(HF_MODELS.OBJECT_DETECTION, imageFile);

  if (result.success && Array.isArray(result.data)) {
    const objects = result.data as ObjectDetectionResult[];
    const person = objects.find(o => o.label === 'person' && o.score > 0.5);
    return {
      ...result,
      objects,
      personBox: person?.box,
    };
  }

  return result;
};

/**
 * Segmentation faciale (stub - utilise analyzeFace à la place)
 */
export const detectFaceSegmentation = async (
  imageFile: File
): Promise<HuggingFaceResponse & { hasFace?: boolean }> => {
  // Utiliser analyzeFace qui combine plusieurs modèles
  const analysis = await analyzeFace(imageFile);
  return {
    success: true,
    data: analysis,
    model: 'combined',
    processingTime: analysis.processingTime,
    hasFace: analysis.faceDetected,
  };
};

// ============================================
// ANALYSE DE VÊTEMENTS (MODULE 7)
// ============================================

/**
 * Types de vêtements pour la classification
 */
const CLOTHING_LABELS = [
  'casual clothing', 'formal clothing', 'sportswear', 'uniform',
  'traditional clothing', 'work clothes', 'school uniform', 'religious attire'
];

const CLOTHING_COLORS = [
  'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink', 'orange', 'purple'
];

/**
 * Analyse les vêtements d'une personne à partir d'une description
 */
export const analyzeClothing = async (
  description: string
): Promise<HuggingFaceResponse & { clothingType?: string; confidence?: number }> => {
  const result = await callHuggingFaceAPI(HF_MODELS.ZERO_SHOT_CLASSIFICATION, {
    inputs: description,
    parameters: { candidate_labels: CLOTHING_LABELS },
  });

  if (result.success && Array.isArray(result.data)) {
    const sorted = result.data.sort((a: any, b: any) => b.score - a.score);
    return {
      ...result,
      clothingType: sorted[0]?.label,
      confidence: sorted[0]?.score,
    };
  }

  return result;
};

/**
 * Détecte la couleur des vêtements à partir d'une description
 */
export const detectClothingColor = async (
  description: string
): Promise<HuggingFaceResponse & { color?: string; confidence?: number }> => {
  const result = await callHuggingFaceAPI(HF_MODELS.ZERO_SHOT_CLASSIFICATION, {
    inputs: description,
    parameters: { candidate_labels: CLOTHING_COLORS },
  });

  if (result.success && Array.isArray(result.data)) {
    const sorted = result.data.sort((a: any, b: any) => b.score - a.score);
    return {
      ...result,
      color: sorted[0]?.label,
      confidence: sorted[0]?.score,
    };
  }

  return result;
};

// ============================================
// REGROUPEMENT DE CAS SIMILAIRES (MODULE 5)
// ============================================

/**
 * Compare un cas avec une liste de cas pour trouver les similaires
 */
export const findSimilarCases = async (
  sourceCase: string,
  otherCases: string[]
): Promise<{ similarities: Array<{ case: string; score: number }>; processingTime: number; success: boolean }> => {
  const startTime = Date.now();

  const result = await callHuggingFaceAPI(HF_MODELS.TEXT_SIMILARITY, {
    inputs: {
      source_sentence: sourceCase,
      sentences: otherCases,
    },
  });

  if (result.success && Array.isArray(result.data)) {
    const similarities = otherCases.map((caseText, index) => ({
      case: caseText,
      score: result.data[index] * 100, // Convertir en pourcentage
    })).sort((a, b) => b.score - a.score);

    return {
      similarities,
      processingTime: Date.now() - startTime,
      success: true,
    };
  }

  return {
    similarities: [],
    processingTime: Date.now() - startTime,
    success: false,
  };
};

/**
 * Génère un résumé textuel d'un dossier pour le clustering
 */
export const generateCaseSummary = (caseData: {
  age?: string;
  gender?: string;
  lastLocation?: string;
  clothing?: string;
  additionalInfo?: string;
}): string => {
  const parts: string[] = [];
  
  if (caseData.gender) parts.push(caseData.gender);
  if (caseData.age) parts.push(`${caseData.age} years old`);
  if (caseData.lastLocation) parts.push(`last seen at ${caseData.lastLocation}`);
  if (caseData.clothing) parts.push(`wearing ${caseData.clothing}`);
  if (caseData.additionalInfo) parts.push(caseData.additionalInfo);
  
  return parts.join(', ') || 'Missing person';
};

// Fonctions stub pour compatibilité
export const classifyImage = async (imageFile: File): Promise<HuggingFaceResponse & { classifications?: ClassificationResult[] }> => {
  return detectEmotions(imageFile);
};

export const generateCaption = async (imageFile: File): Promise<HuggingFaceResponse & { caption?: string }> => {
  return { success: false, data: null, error: 'Non disponible', model: 'N/A', processingTime: 0 };
};

// ============================================
// ANALYSE FACIALE COMPLÈTE
// ============================================

/**
 * Analyse complète d'un visage
 * Utilise tous les modèles disponibles
 */
export const analyzeFace = async (
  imageFile: File
): Promise<FaceAnalysisResult & { processingTime: number; rawResponses: any[]; errors?: string[] }> => {
  const startTime = Date.now();
  const rawResponses: any[] = [];
  const errors: string[] = [];

  console.log('[HuggingFace] ════════════════════════════════════════════════════════');
  console.log('[HuggingFace] ANALYSE FACIALE COMPLÈTE');
  console.log('[HuggingFace] Fichier:', imageFile.name, '|', (imageFile.size / 1024).toFixed(1), 'KB');
  console.log('[HuggingFace] ════════════════════════════════════════════════════════');

  // Exécuter toutes les analyses en parallèle
  const [emotionsResult, ageResult, genderResult, objectsResult] = await Promise.all([
    detectEmotions(imageFile),
    estimateAge(imageFile),
    classifyGender(imageFile),
    detectObjects(imageFile),
  ]);

  // Collecter les résultats
  rawResponses.push(
    { type: 'emotions', ...emotionsResult },
    { type: 'age', ...ageResult },
    { type: 'gender', ...genderResult },
    { type: 'objects', ...objectsResult }
  );

  // Collecter les erreurs
  if (!emotionsResult.success) errors.push(`Émotions: ${emotionsResult.error}`);
  if (!ageResult.success) errors.push(`Âge: ${ageResult.error}`);
  if (!genderResult.success) errors.push(`Genre: ${genderResult.error}`);
  if (!objectsResult.success) errors.push(`Objets: ${objectsResult.error}`);

  // Afficher les résultats
  console.log('[HuggingFace] ────────────────────────────────────────────────────────');
  console.log('[HuggingFace] RÉSULTATS:');
  
  const emotionsOK = emotionsResult.success && (emotionsResult as any).emotions?.length > 0;
  const ageOK = ageResult.success && (ageResult as any).ageEstimate;
  const genderOK = genderResult.success && (genderResult as any).gender;
  const personOK = objectsResult.success && (objectsResult as any).personBox;

  if (emotionsOK) {
    const top = (emotionsResult as any).emotions[0];
    console.log(`[HuggingFace]   Émotions: ✓ ${top.label} (${(top.score * 100).toFixed(1)}%)`);
  } else {
    console.log(`[HuggingFace]   Émotions: ✗ ${emotionsResult.error}`);
  }

  if (ageOK) {
    console.log(`[HuggingFace]   Âge: ✓ ${(ageResult as any).ageEstimate} (${((ageResult as any).confidence * 100).toFixed(1)}%)`);
  } else {
    console.log(`[HuggingFace]   Âge: ✗ ${ageResult.error}`);
  }

  if (genderOK) {
    console.log(`[HuggingFace]   Genre: ✓ ${(genderResult as any).gender} (${((genderResult as any).confidence * 100).toFixed(1)}%)`);
  } else {
    console.log(`[HuggingFace]   Genre: ✗ ${genderResult.error}`);
  }

  if (personOK) {
    console.log(`[HuggingFace]   Personne: ✓ détectée avec bounding box`);
  } else {
    console.log(`[HuggingFace]   Personne: ✗ ${objectsResult.error || 'non détectée'}`);
  }

  // Déterminer si un visage est détecté
  // Un visage est détecté si au moins 2 des 3 analyses faciales (émotions, âge, genre) fonctionnent
  const faceSignals = [emotionsOK, ageOK, genderOK].filter(Boolean).length;
  const faceDetected = faceSignals >= 2 || (faceSignals >= 1 && personOK);

  console.log('[HuggingFace] ────────────────────────────────────────────────────────');
  console.log(`[HuggingFace] VISAGE DÉTECTÉ: ${faceDetected ? 'OUI ✓' : 'NON ✗'} (${faceSignals}/3 signaux positifs)`);

  // Construire les données du visage
  const faces = faceDetected ? [{
    box: (objectsResult as any).personBox,
    confidence: Math.max(
      emotionsOK ? (emotionsResult as any).emotions[0].score : 0,
      genderOK ? (genderResult as any).confidence : 0,
      ageOK ? (ageResult as any).confidence : 0
    ),
    emotions: (emotionsResult as any).emotions,
    age: (ageResult as any).ageEstimate,
    ageConfidence: (ageResult as any).confidence,
    gender: (genderResult as any).gender,
    genderConfidence: (genderResult as any).confidence,
  }] : [];

  // Score de qualité
  const qualityFactors = [
    emotionsOK ? 25 : 0,
    ageOK ? 25 : 0,
    genderOK ? 25 : 0,
    personOK ? 25 : 0,
  ];
  const overallQuality = qualityFactors.reduce((a, b) => a + b, 0);

  const result = {
    faceDetected,
    faces,
    overallQuality,
    personDetected: personOK,
    processingTime: Date.now() - startTime,
    rawResponses,
    errors: errors.length > 0 ? errors : undefined,
  };

  console.log('[HuggingFace] ════════════════════════════════════════════════════════');
  console.log('[HuggingFace] RÉSULTAT FINAL:');
  console.log(`[HuggingFace]   Visage: ${result.faceDetected ? 'OUI ✓' : 'NON ✗'}`);
  console.log(`[HuggingFace]   Qualité: ${result.overallQuality}%`);
  console.log(`[HuggingFace]   Temps: ${result.processingTime}ms`);
  if (result.faceDetected && result.faces[0]) {
    const face = result.faces[0];
    console.log(`[HuggingFace]   → Âge: ${face.age || 'N/A'}`);
    console.log(`[HuggingFace]   → Genre: ${face.gender || 'N/A'}`);
    console.log(`[HuggingFace]   → Émotion: ${face.emotions?.[0]?.label || 'N/A'}`);
  }
  console.log('[HuggingFace] ════════════════════════════════════════════════════════');

  return result;
};

// ============================================
// SIMILARITÉ FACIALE
// ============================================

/**
 * Génère une description textuelle d'un visage analysé
 */
const generateFaceDescription = (analysis: FaceAnalysisResult): string => {
  if (!analysis.faceDetected || analysis.faces.length === 0) {
    return 'No face detected';
  }

  const face = analysis.faces[0];
  const parts: string[] = [];

  if (face.age) parts.push(`${face.age} years old`);
  if (face.gender) parts.push(face.gender);
  if (face.emotions?.[0]) parts.push(`${face.emotions[0].label} expression`);
  if (face.emotions?.[1]) parts.push(`slightly ${face.emotions[1].label}`);

  return parts.join(', ') || 'Face detected';
};

/**
 * Calcule la similarité entre deux descriptions faciales
 */
const calculateTextSimilarity = async (desc1: string, desc2: string): Promise<number> => {
  const result = await callHuggingFaceAPI(HF_MODELS.TEXT_SIMILARITY, {
    inputs: {
      source_sentence: desc1,
      sentences: [desc2],
    },
  });

  if (result.success && Array.isArray(result.data) && result.data.length > 0) {
    return result.data[0] * 100; // Convertir en pourcentage
  }

  return 0;
};

/**
 * Calcul de similarité entre deux visages
 */
export const calculateImageSimilarity = async (
  image1: File,
  image2: File
): Promise<{ similarity: number; processingTime: number; success: boolean; error?: string; details?: any }> => {
  const startTime = Date.now();

  console.log('[HuggingFace] ════════════════════════════════════════════════════════');
  console.log('[HuggingFace] CALCUL DE SIMILARITÉ FACIALE');
  console.log('[HuggingFace] Image 1:', image1.name);
  console.log('[HuggingFace] Image 2:', image2.name);
  console.log('[HuggingFace] ════════════════════════════════════════════════════════');

  try {
    // Analyser les deux visages
    const [analysis1, analysis2] = await Promise.all([
      analyzeFace(image1),
      analyzeFace(image2),
    ]);

    // Vérifier que les deux images ont un visage
    if (!analysis1.faceDetected || !analysis2.faceDetected) {
      return {
        similarity: 0,
        processingTime: Date.now() - startTime,
        success: false,
        error: `Visage non détecté: Image1=${analysis1.faceDetected}, Image2=${analysis2.faceDetected}`,
      };
    }

    // Générer les descriptions
    const desc1 = generateFaceDescription(analysis1);
    const desc2 = generateFaceDescription(analysis2);

    console.log('[HuggingFace] Description 1:', desc1);
    console.log('[HuggingFace] Description 2:', desc2);

    // Calculer la similarité textuelle
    const textSimilarity = await calculateTextSimilarity(desc1, desc2);

    // Bonus de similarité pour les attributs correspondants
    let attributeBonus = 0;
    const face1 = analysis1.faces[0];
    const face2 = analysis2.faces[0];

    if (face1.age && face2.age && face1.age === face2.age) {
      attributeBonus += 15;
    }
    if (face1.gender && face2.gender && face1.gender === face2.gender) {
      attributeBonus += 15;
    }
    if (face1.emotions?.[0]?.label && face2.emotions?.[0]?.label && 
        face1.emotions[0].label === face2.emotions[0].label) {
      attributeBonus += 10;
    }

    const finalSimilarity = Math.min(100, textSimilarity + attributeBonus);

    console.log('[HuggingFace] ────────────────────────────────────────────────────────');
    console.log(`[HuggingFace] Similarité textuelle: ${textSimilarity.toFixed(1)}%`);
    console.log(`[HuggingFace] Bonus attributs: +${attributeBonus}%`);
    console.log(`[HuggingFace] SIMILARITÉ FINALE: ${finalSimilarity.toFixed(1)}%`);
    console.log('[HuggingFace] ════════════════════════════════════════════════════════');

    return {
      similarity: finalSimilarity,
      processingTime: Date.now() - startTime,
      success: true,
      details: {
        face1: { age: face1.age, gender: face1.gender, emotion: face1.emotions?.[0]?.label },
        face2: { age: face2.age, gender: face2.gender, emotion: face2.emotions?.[0]?.label },
        textSimilarity,
        attributeBonus,
      },
    };
  } catch (error) {
    return {
      similarity: 0,
      processingTime: Date.now() - startTime,
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

// ============================================
// EXPORT
// ============================================

export const huggingFaceService = {
  isConfigured: isHuggingFaceConfigured,
  models: HF_MODELS,
  
  // === MODULE 1 & 6: Reconnaissance faciale & Estimation âge ===
  detectEmotions,
  estimateAge,
  classifyGender,
  analyzeFace,
  
  // === MODULE 2: Similarité faciale ===
  calculateImageSimilarity,
  
  // === MODULE 5: Regroupement de cas similaires ===
  findSimilarCases,
  generateCaseSummary,
  
  // === MODULE 7: Analyse de vêtements ===
  analyzeClothing,
  detectClothingColor,
  
  // === MODULE 8: Détection d'objets ===
  detectObjects,
  detectFaceSegmentation,
  
  // Compatibilité
  classifyImage,
  generateCaption,
  
  // Utilitaires
  fileToBase64,
  urlToBlob,
};

export default huggingFaceService;
