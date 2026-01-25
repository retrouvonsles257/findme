/**
 * =====================================================
 * RETROUVONSLES - useLocalisationsForDossier Hook
 * Récupère les localisations enregistrées pour un dossier
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../config';
import type { LocationDatabase } from '../types/geolocation.types';

interface UseLocalisationsForDossierReturn {
  localisations: LocationDatabase[];
  isLoading: boolean;
  error: string | null;
  fetchLocalisations: (dossierId: string) => Promise<void>;
}

export const useLocalisationsForDossier = (): UseLocalisationsForDossierReturn => {
  const [localisations, setLocalisations] = useState<LocationDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLocalisations = useCallback(async (dossierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: err } = await (supabase as any)
        .from('localisation')
        .select('*')
        .eq('id_dossier', dossierId)
        .order('date_localisation', { ascending: false });

      if (err) throw err;
      setLocalisations(data || []);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des localisations');
      console.error('Fetch localisations for dossier error:', err);
      setLocalisations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    localisations,
    isLoading,
    error,
    fetchLocalisations,
  };
};
