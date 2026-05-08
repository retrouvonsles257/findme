/**
 * =====================================================
 * RETROUVONSLES - useDossierDetail Hook
 * Single dossier detail retrieval
 * =====================================================
 */

import { useState, useCallback } from 'react';
import type { UseDossierDetailReturn, DossierDisplayData } from '../types';
import * as dossierAPI from '../services/dossierAPI';
import * as dossierService from '../services/dossierService';

export const useDossierDetail = (): UseDossierDetailReturn => {
  const [dossier, setDossier] = useState<DossierDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDossier = useCallback(async (dossierId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const raw = await dossierAPI.getDossierById(dossierId);
      const enriched = dossierService.enrichDossierForDisplay(raw);
      setDossier(enriched);

      // Increment unique view counter (1 person = 1 unique view)
      await dossierAPI.recordUniqueDossierView(dossierId);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Fetch dossier detail error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshDossier = useCallback(async () => {
    if (!dossier) return;
    await fetchDossier(dossier.id);
  }, [dossier, fetchDossier]);

  return {
    dossier,
    isLoading,
    error,
    fetchDossier,
    refreshDossier,
  };
};
