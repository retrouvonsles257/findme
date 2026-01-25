/**
 * =====================================================
 * RETROUVONSLES - useHistoriqueDossier Hook
 * Récupère l'historique des modifications d'un dossier
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../config';

interface HistoriqueEntry {
  id: string;
  action: string;
  description: string;
  date_modification: string;
  modified_by?: string;
}

interface UseHistoriqueDossierReturn {
  historique: HistoriqueEntry[];
  isLoading: boolean;
  error: string | null;
  fetchHistorique: (dossierId: string) => Promise<void>;
}

export const useHistoriqueDossier = (): UseHistoriqueDossierReturn => {
  const [historique, setHistorique] = useState<HistoriqueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistorique = useCallback(async (dossierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Récupérer l'historique du dossier si la table existe
      const { data, error: err } = await (supabase as any)
        .from('dossier_historique')
        .select('*')
        .eq('id_dossier', dossierId)
        .order('date_modification', { ascending: false });

      if (err) {
        // Si la table n'existe pas, retourner une liste vide avec le créé du dossier
        console.warn('dossier_historique table not found, using creation date only');
        setHistorique([]);
      } else {
        setHistorique(data || []);
      }
    } catch (err: any) {
      // Silentieusement continuer si la table n'existe pas
      console.warn('Could not fetch historique:', err.message);
      setHistorique([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    historique,
    isLoading,
    error,
    fetchHistorique,
  };
};
