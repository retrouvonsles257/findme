/**
 * =====================================================
 * RETROUVONSLES - useDossierUpdate Hook
 * Dossier update operations
 * =====================================================
 */

import { useState, useCallback } from 'react';
import type { UseDossierUpdateReturn, DossierUpdateInput, DossierDisplayData } from '../types';
import * as dossierAPI from '../services/dossierAPI';
import * as dossierService from '../services/dossierService';
import { StatutDossier, NiveauUrgence } from '../../../@types/enums.types';

export const useDossierUpdate = (): UseDossierUpdateReturn => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedDossier, setUpdatedDossier] = useState<DossierDisplayData | null>(null);

  const updateStatus = useCallback(
    async (dossierId: string, newStatus: StatutDossier) => {
      setIsUpdating(true);
      setError(null);

      try {
        const updated = await dossierAPI.updateDossier(dossierId, {
          statut_dossier: newStatus,
        });

        const enriched = dossierService.enrichDossierForDisplay(updated);
        setUpdatedDossier(enriched);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la mise à jour');
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updatePriority = useCallback(
    async (dossierId: string, priority: NiveauUrgence) => {
      setIsUpdating(true);
      setError(null);

      try {
        const updated = await dossierAPI.updateDossier(dossierId, {
          niveau_urgence: priority,
        });

        const enriched = dossierService.enrichDossierForDisplay(updated);
        setUpdatedDossier(enriched);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la mise à jour');
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updateInvestigator = useCallback(
    async (dossierId: string, investigatorId: string) => {
      setIsUpdating(true);
      setError(null);

      try {
        const updated = await dossierAPI.updateDossier(dossierId, {
          enqueteur_responsable: investigatorId,
        });

        const enriched = dossierService.enrichDossierForDisplay(updated);
        setUpdatedDossier(enriched);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la mise à jour');
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updateLocation = useCallback(
    async (dossierId: string, lat: number, lng: number) => {
      setIsUpdating(true);
      setError(null);

      try {
        const updated = await dossierAPI.updateDossier(dossierId, {
          latitude_decouverte: lat,
          longitude_decouverte: lng,
        });

        const enriched = dossierService.enrichDossierForDisplay(updated);
        setUpdatedDossier(enriched);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la mise à jour');
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  const updateDossier = useCallback(
    async (dossierId: string, data: DossierUpdateInput) => {
      setIsUpdating(true);
      setError(null);

      try {
        const updated = await dossierAPI.updateDossier(dossierId, data);
        const enriched = dossierService.enrichDossierForDisplay(updated);
        setUpdatedDossier(enriched);
      } catch (err: any) {
        setError(err.message || 'Erreur lors de la mise à jour');
      } finally {
        setIsUpdating(false);
      }
    },
    [],
  );

  return {
    isUpdating,
    error,
    updatedDossier,
    updateStatus,
    updatePriority,
    updateInvestigator,
    updateLocation,
    updateDossier,
  };
};
