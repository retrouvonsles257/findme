/**
 * =====================================================
 * RETROUVONSLES - useFacialRecognition Hook
 * Hook for facial recognition operations
 * Utilise VRAIE IA Hugging Face
 * =====================================================
 */

import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/store/types';
import {
  fetchFacialRecognitionResults,
  setCurrentFacialAnalysis,
  addFacialRecognitionResult,
} from '../store/iaSlice';
import {
  selectFacialRecognitionResults,
  selectCurrentFacialAnalysis,
  selectIALoading,
  selectIAError,
} from '../store/iaSelectors';
import { 
  analyzeFacialImage, 
  type ResultatIA,
  checkIAServiceStatus,
} from '../services/iaAPI';

// Interface de retour du hook
export interface UseFacialRecognitionReturn {
  results: ResultatIA[];
  currentAnalysis: ResultatIA | null;
  analyzeFacial: (imageFile: File, dossierId?: string) => Promise<ResultatIA>;
  getFacialHistory: (dossierId?: string) => Promise<ResultatIA[]>;
  setCurrentAnalysis: (analysis: ResultatIA | null) => void;
  isLoading: boolean;
  error: string | null;
  isHuggingFaceConfigured: boolean;
}

export const useFacialRecognition = (): UseFacialRecognitionReturn => {
  const dispatch = useDispatch<AppDispatch>();
  const results = useSelector(selectFacialRecognitionResults);
  const currentAnalysis = useSelector(selectCurrentFacialAnalysis);
  const reduxLoading = useSelector(selectIALoading);
  const reduxError = useSelector(selectIAError);

  // État local pour l'analyse (car File ne peut pas être sérialisé dans Redux)
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Vérifier si Hugging Face est configuré
  const serviceStatus = checkIAServiceStatus();

  /**
   * Analyser une image faciale avec VRAIE IA Hugging Face
   * Appel direct au service car File ne peut pas être sérialisé
   */
  const analyzeFacial = useCallback(
    async (imageFile: File, dossierId?: string): Promise<ResultatIA> => {
      console.log('[Hook] ═══════════════════════════════════════════');
      console.log('[Hook] DÉMARRAGE ANALYSE FACIALE');
      console.log('[Hook] Image:', imageFile.name, imageFile.size, 'bytes');
      console.log('[Hook] Dossier ID:', dossierId || 'N/A');
      console.log('[Hook] Hugging Face configuré:', serviceStatus.huggingFaceConfigured);
      console.log('[Hook] ═══════════════════════════════════════════');
      
      if (!serviceStatus.huggingFaceConfigured) {
        console.error('[Hook] ✗ ERREUR: Hugging Face non configuré!');
        throw new Error('Service Hugging Face non configuré. Vérifiez REACT_APP_HUGGINGFACE_API_KEY dans .env');
      }
      
      setLocalLoading(true);
      setLocalError(null);
      
      try {
        console.log('[Hook] Appel analyzeFacialImage...');
        
        // Appeler directement le service IA
        const result = await analyzeFacialImage(imageFile, dossierId);
        
        console.log('[Hook] ═══════════════════════════════════════════');
        console.log('[Hook] RÉSULTAT ANALYSE');
        console.log('[Hook] ID:', result.id);
        console.log('[Hook] Score:', result.score_confiance);
        console.log('[Hook] Visage détecté:', result.donnees_interpretees?.face_detected);
        console.log('[Hook] Correspondances:', result.correspondances_trouvees);
        console.log('[Hook] ═══════════════════════════════════════════');
        
        // Ajouter le résultat au state Redux (met aussi à jour currentFacialAnalysis)
        dispatch(addFacialRecognitionResult(result));
        
        setLocalLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse';
        console.error('[Hook] ═══════════════════════════════════════════');
        console.error('[Hook] ERREUR ANALYSE FACIALE:', errorMessage);
        console.error('[Hook] Détails:', err);
        console.error('[Hook] ═══════════════════════════════════════════');
        setLocalError(errorMessage);
        setLocalLoading(false);
        throw err;
      }
    },
    [dispatch, serviceStatus.huggingFaceConfigured],
  );

  /**
   * Récupérer l'historique des analyses faciales
   */
  const getFacialHistory = useCallback(
    async (dossierId?: string): Promise<ResultatIA[]> => {
      try {
        return await (dispatch(fetchFacialRecognitionResults(dossierId)) as any).unwrap();
      } catch {
        return [];
      }
    },
    [dispatch],
  );

  /**
   * Définir l'analyse courante
   */
  const handleSetCurrentAnalysis = useCallback(
    (analysis: ResultatIA | null) => {
      dispatch(setCurrentFacialAnalysis(analysis));
    },
    [dispatch],
  );

  return {
    results,
    currentAnalysis,
    analyzeFacial,
    getFacialHistory,
    setCurrentAnalysis: handleSetCurrentAnalysis,
    isLoading: localLoading || reduxLoading,
    error: localError || reduxError,
    isHuggingFaceConfigured: serviceStatus.huggingFaceConfigured,
  };
};
