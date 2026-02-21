/**
 * =====================================================
 * RETROUVONSLES - Service de Déclenchement IA Automatique
 * 
 * Ce service gère le déclenchement automatique de l'IA
 * selon les événements définis dans la documentation :
 * 
 * 1. Nouveau dossier créé avec photo
 * 2. Signalement avec photo uploadée
 * 3. Score > 70% -> Notification autorités
 * =====================================================
 */

import { supabase } from '../../../config';
import { 
  analyzeFacialImage, 
  ResultatIA,
  updateResultatIAValidation,
  StatutValidationIA,
  ActionGeneree,
} from './iaAPI';
import { huggingFaceService, isHuggingFaceConfigured } from '../../../services/huggingFaceService';

// Type-safe Supabase wrapper
const db = {
  from: (table: string) => (supabase.from(table) as any),
};

// ============================================
// CONFIGURATION
// ============================================

const SEUIL_NOTIFICATION = 70; // Score minimum pour notification automatique
const SEUIL_MATCH_ELEVE = 85;  // Score pour match prioritaire

// ============================================
// TYPES
// ============================================

export interface PhotoAnalysisRequest {
  photoUrl: string;
  photoId?: string;
  dossierId?: string;
  signalementId?: string;
  userId?: string;
  source: 'dossier' | 'signalement' | 'manual';
}

export interface AutoTriggerResult {
  success: boolean;
  analysisId?: string;
  faceDetected: boolean;
  score: number;
  matchesFound: number;
  notificationsSent: number;
  error?: string;
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Convertit une URL d'image en File
 */
const urlToFile = async (url: string, filename: string = 'image.jpg'): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};

/**
 * Récupère les photos d'un dossier
 */
const getDossierPhotos = async (dossierId: string): Promise<string[]> => {
  const { data, error } = await db
    .from('photo')
    .select('url_photo')
    .eq('id_dossier', dossierId);
  
  if (error || !data) return [];
  return data.map((p: any) => p.url_photo).filter(Boolean);
};

/**
 * Récupère tous les dossiers actifs avec leurs photos
 */
const getActiveDossiersWithPhotos = async (): Promise<Array<{
  id: string;
  numero_dossier: string;
  photoUrl: string;
}>> => {
  const { data: dossiers, error } = await db
    .from('dossier_disparition')
    .select('id, numero_dossier')
    .in('statut_dossier', ['en_cours', 'actif', 'recherche_active']);

  if (error || !dossiers) return [];

  const results: Array<{ id: string; numero_dossier: string; photoUrl: string }> = [];

  for (const dossier of dossiers) {
    const photos = await getDossierPhotos(dossier.id);
    if (photos.length > 0) {
      results.push({
        id: dossier.id,
        numero_dossier: dossier.numero_dossier,
        photoUrl: photos[0], // Photo principale
      });
    }
  }

  return results;
};

/**
 * Crée une notification pour les autorités
 */
const createAuthorityNotification = async (
  resultatIaId: string,
  dossierId: string | undefined,
  score: number,
  type: 'correspondance_ia' | 'match_prioritaire'
): Promise<void> => {
  try {
    // Récupérer les utilisateurs autorités (niveau 4+)
    const { data: authorities } = await db
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif');

    if (!authorities || authorities.length === 0) {
      console.log('[IAAutoTrigger] Aucune autorité trouvée pour notification');
      return;
    }

    const priorite = score >= SEUIL_MATCH_ELEVE ? 'haute' : 'moyenne';
    const titre = score >= SEUIL_MATCH_ELEVE 
      ? '🚨 Correspondance IA PRIORITAIRE détectée'
      : '🔔 Nouvelle correspondance IA détectée';
    const message = `Une correspondance a été détectée avec un score de ${score.toFixed(0)}%. Validation requise.`;

    // Créer une notification pour chaque autorité
    for (const auth of authorities) {
      await db.from('notification').insert({
        id_utilisateur: auth.id,
        type: type,
        titre,
        message,
        priorite,
        lue: false,
        donnees_supplementaires: {
          resultat_ia_id: resultatIaId,
          dossier_id: dossierId,
          score,
        },
        date_creation: new Date().toISOString(),
      });
    }

    console.log(`[IAAutoTrigger] ${authorities.length} notifications envoyées aux autorités`);
  } catch (error) {
    console.error('[IAAutoTrigger] Erreur création notification:', error);
  }
};

/**
 * Met à jour le journal d'activité
 */
const logActivity = async (
  action: string,
  description: string,
  userId?: string,
  dossierId?: string,
  signalementId?: string
): Promise<void> => {
  try {
    await db.from('journal_activite').insert({
      type_action: 'analyse_ia',
      action_detaillee: action,
      description,
      id_utilisateur: userId,
      id_dossier: dossierId,
      id_signalement: signalementId,
      date_action: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[IAAutoTrigger] Erreur log activité:', error);
  }
};

// ============================================
// FONCTIONS PRINCIPALES
// ============================================

/**
 * Déclenche l'analyse IA automatique pour une photo
 * Appelé lors de la création d'un dossier ou signalement avec photo
 */
export const triggerAutoAnalysis = async (
  request: PhotoAnalysisRequest
): Promise<AutoTriggerResult> => {
  console.log('[IAAutoTrigger] ════════════════════════════════════════════');
  console.log('[IAAutoTrigger] Déclenchement analyse automatique');
  console.log('[IAAutoTrigger] Source:', request.source);
  console.log('[IAAutoTrigger] Photo URL:', request.photoUrl?.substring(0, 50) + '...');
  console.log('[IAAutoTrigger] ════════════════════════════════════════════');

  if (!isHuggingFaceConfigured()) {
    console.warn('[IAAutoTrigger] Hugging Face non configuré, analyse ignorée');
    return {
      success: false,
      faceDetected: false,
      score: 0,
      matchesFound: 0,
      notificationsSent: 0,
      error: 'Service IA non configuré',
    };
  }

  try {
    // 1. Convertir l'URL en File
    const imageFile = await urlToFile(request.photoUrl);
    console.log('[IAAutoTrigger] Image convertie:', imageFile.name, imageFile.size, 'bytes');

    // 2. Analyser le visage
    const analysisResult = await analyzeFacialImage(
      imageFile,
      request.dossierId,
      request.userId || 'system'
    );

    console.log('[IAAutoTrigger] Résultat analyse:', {
      faceDetected: analysisResult.donnees_interpretees?.face_detected,
      score: analysisResult.score_confiance,
    });

    let matchesFound = 0;
    let notificationsSent = 0;

    // 3. Si un visage est détecté, comparer avec les autres dossiers actifs
    if (analysisResult.donnees_interpretees?.face_detected) {
      console.log('[IAAutoTrigger] Comparaison avec dossiers actifs...');
      
      const activeDossiers = await getActiveDossiersWithPhotos();
      console.log('[IAAutoTrigger] Dossiers actifs avec photos:', activeDossiers.length);

      // Filtrer pour exclure le dossier courant (éviter auto-comparaison)
      const dossiersToCompare = activeDossiers.filter(d => d.id !== request.dossierId);
      console.log('[IAAutoTrigger] Dossiers à comparer (excluant le courant):', dossiersToCompare.length);

      for (const dossier of dossiersToCompare) {
        try {
          console.log(`[IAAutoTrigger] Comparaison avec dossier ${dossier.numero_dossier}...`);
          
          const dossierImage = await urlToFile(dossier.photoUrl);
          const comparison = await huggingFaceService.calculateImageSimilarity(
            imageFile,
            dossierImage
          );

          console.log(`[IAAutoTrigger] Résultat comparaison ${dossier.numero_dossier}:`, {
            success: comparison.success,
            similarity: comparison.similarity,
            error: comparison.error,
          });

          // Enregistrer toutes les comparaisons avec un score > 30%
          if (comparison.success && comparison.similarity >= 30) {
            // Créer un résultat de correspondance
            const { data: comparisonResult } = await db.from('resultat_ia').insert({
              type_analyse: 'comparaison_photos',
              score_confiance: comparison.similarity,
              seuil_decision: SEUIL_NOTIFICATION,
              donnees_brutes: {
                source_photo: request.photoUrl,
                dossier_photo: dossier.photoUrl,
                dossier_numero: dossier.numero_dossier,
                source_type: request.source,
              },
              donnees_interpretees: {
                is_match: comparison.similarity >= SEUIL_NOTIFICATION,
                similarity_score: comparison.similarity,
                dossier_compare_id: dossier.id,
                dossier_compare_numero: dossier.numero_dossier,
              },
              correspondances_trouvees: {
                similar_cases: [{
                  dossier_id: dossier.id,
                  dossier_numero: dossier.numero_dossier,
                  similarity_score: comparison.similarity,
                }],
              },
              statut_validation: 'en_attente',
              action_generee: comparison.similarity >= SEUIL_MATCH_ELEVE ? 'notification_autorites' : 'aucune',
              id_signalement: request.signalementId,
              id_dossier: request.dossierId,
              declenche_par: request.userId || 'system',
              date_analyse: new Date().toISOString(),
            }).select().single();

            if (comparison.similarity >= SEUIL_NOTIFICATION) {
              matchesFound++;
              
              // Envoyer notification si score élevé
              await createAuthorityNotification(
                comparisonResult?.id || analysisResult.id,
                dossier.id,
                comparison.similarity,
                comparison.similarity >= SEUIL_MATCH_ELEVE ? 'match_prioritaire' : 'correspondance_ia'
              );
              notificationsSent++;
            }
          }
        } catch (err) {
          console.warn(`[IAAutoTrigger] Erreur comparaison avec dossier ${dossier.id}:`, err);
        }
      }
    }

    // 4. Log l'activité
    await logActivity(
      'analyse_automatique',
      `Analyse IA automatique déclenchée depuis ${request.source}. ` +
      `Visage détecté: ${analysisResult.donnees_interpretees?.face_detected ? 'Oui' : 'Non'}. ` +
      `Score: ${analysisResult.score_confiance.toFixed(0)}%. ` +
      `Correspondances: ${matchesFound}`,
      request.userId,
      request.dossierId,
      request.signalementId
    );

    console.log('[IAAutoTrigger] ════════════════════════════════════════════');
    console.log('[IAAutoTrigger] RÉSULTAT FINAL:');
    console.log('[IAAutoTrigger]   Visage détecté:', analysisResult.donnees_interpretees?.face_detected);
    console.log('[IAAutoTrigger]   Score:', analysisResult.score_confiance);
    console.log('[IAAutoTrigger]   Correspondances:', matchesFound);
    console.log('[IAAutoTrigger]   Notifications:', notificationsSent);
    console.log('[IAAutoTrigger] ════════════════════════════════════════════');

    return {
      success: true,
      analysisId: analysisResult.id,
      faceDetected: analysisResult.donnees_interpretees?.face_detected || false,
      score: analysisResult.score_confiance,
      matchesFound,
      notificationsSent,
    };

  } catch (error) {
    console.error('[IAAutoTrigger] Erreur:', error);
    return {
      success: false,
      faceDetected: false,
      score: 0,
      matchesFound: 0,
      notificationsSent: 0,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};

/**
 * Déclenche l'analyse pour un nouveau dossier
 */
export const triggerDossierAnalysis = async (
  dossierId: string,
  photoUrl: string,
  userId?: string
): Promise<AutoTriggerResult> => {
  return triggerAutoAnalysis({
    photoUrl,
    dossierId,
    userId,
    source: 'dossier',
  });
};

/**
 * Déclenche l'analyse pour un nouveau signalement
 */
export const triggerSignalementAnalysis = async (
  signalementId: string,
  photoUrl: string,
  dossierId?: string,
  userId?: string
): Promise<AutoTriggerResult> => {
  return triggerAutoAnalysis({
    photoUrl,
    signalementId,
    dossierId,
    userId,
    source: 'signalement',
  });
};

// ============================================
// VALIDATION DES RÉSULTATS IA
// ============================================

/**
 * Valider un résultat IA (confirmer la correspondance).
 * Notification à la famille (docs : "Si confirmé par l'autorité" -> "Notification à la famille (si autorisée)").
 */
export const confirmIAResult = async (
  resultId: string,
  userId: string,
  comment?: string
): Promise<ResultatIA> => {
  const result = await updateResultatIAValidation(
    resultId,
    'confirme',
    userId,
    comment
  );

  await logActivity(
    'validation_ia_confirmee',
    `Résultat IA confirmé par l'autorité. ${comment || ''}`,
    userId
  );

  // Notification à la famille (créateur du dossier) si présent
  const dossierId = result?.id_dossier;
  if (dossierId) {
    const { data: dossier } = await db.from('dossier_disparition').select('id_utilisateur_createur').eq('id', dossierId).single();
    const createurId = (dossier as any)?.id_utilisateur_createur;
    if (createurId) {
      await db.from('notification').insert({
        type_notification: 'personne_retrouvee',
        titre: 'Correspondance confirmée',
        message: 'Une correspondance a été confirmée par les autorités pour un dossier que vous avez créé. Consultez le dossier pour plus de détails.',
        canal: 'in_app',
        lue: false,
        date_creation: new Date().toISOString(),
        id_utilisateur: createurId,
        id_dossier: dossierId,
        donnees_supplementaires: { resultat_ia_id: resultId },
      });
    }
  }

  return result;
};

/**
 * Infirmer un résultat IA (faux positif)
 */
export const rejectIAResult = async (
  resultId: string,
  userId: string,
  comment?: string
): Promise<ResultatIA> => {
  const result = await updateResultatIAValidation(
    resultId,
    'infirme',
    userId,
    comment
  );

  await logActivity(
    'validation_ia_infirmee',
    `Résultat IA marqué comme faux positif. ${comment || ''}`,
    userId
  );

  return result;
};

/**
 * Marquer comme nécessitant vérification
 */
export const markNeedsVerification = async (
  resultId: string,
  userId: string,
  comment?: string
): Promise<ResultatIA> => {
  const result = await updateResultatIAValidation(
    resultId,
    'necessite_verification',
    userId,
    comment
  );

  await logActivity(
    'validation_ia_verification',
    `Résultat IA marqué pour vérification supplémentaire. ${comment || ''}`,
    userId
  );

  return result;
};

// ============================================
// EXPORT
// ============================================

export const iaAutoTrigger = {
  triggerAutoAnalysis,
  triggerDossierAnalysis,
  triggerSignalementAnalysis,
  confirmIAResult,
  rejectIAResult,
  markNeedsVerification,
};

export default iaAutoTrigger;
