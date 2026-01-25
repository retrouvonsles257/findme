/**
 * =====================================================
 * RETROUVONSLES - useSignalementsForDossier Hook
 * Récupère les signalements liés à un dossier spécifique
 * =====================================================
 */

import { useState, useCallback } from 'react';
import * as signalementAPI from '../services/signalementAPI';
import type { Signalement } from '../types';

interface UseSignalementsForDossierReturn {
  signalements: Signalement[];
  isLoading: boolean;
  error: string | null;
  fetchSignalements: (dossierId: string) => Promise<void>;
}

export const useSignalementsForDossier = (): UseSignalementsForDossierReturn => {
  const [signalements, setSignalements] = useState<Signalement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignalements = useCallback(async (dossierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer tous les signalements du dossier
      // On utilise getSignalementsByDossierId si disponible, sinon on récupère tous et on filtre
      const result = await signalementAPI.getSignalementsByDossierId(dossierId);
      setSignalements(result || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des signalements');
      console.error('Fetch signalements for dossier error:', err);
      setSignalements([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signalements,
    isLoading,
    error,
    fetchSignalements,
  };
};
