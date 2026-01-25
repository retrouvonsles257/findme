/**
 * =====================================================
 * RETROUVONSLES - useDossierDelete Hook
 * Dossier deletion operations
 * =====================================================
 */

import { useState, useCallback } from 'react';
import type { UseDossierDeleteReturn } from '../types';
import * as dossierAPI from '../services/dossierAPI';

export const useDossierDelete = (): UseDossierDeleteReturn => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteDossier = useCallback(async (dossierId: string) => {
    setIsDeleting(true);
    setError(null);

    try {
      await dossierAPI.deleteDossier(dossierId);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const deleteMultiple = useCallback(async (dossierIds: string[]) => {
    setIsDeleting(true);
    setError(null);

    try {
      await Promise.all(dossierIds.map((id) => dossierAPI.deleteDossier(id)));
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la suppression');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  return {
    isDeleting,
    error,
    deleteDossier,
    deleteMultiple,
  };
};
