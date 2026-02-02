/**
 * =====================================================
 * RETROUVONSLES - useCampagneDetail Hook
 * Hook pour la gestion du détail d'une campagne
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useNotification } from '../../../contexts';
import { campagneService } from '../services';
import type { UUID } from '../../../@types';
import { StatutCampagne } from '../../../@types/enums.types';
import type { CampagneWithRelations, CampagneUpdatePayload } from '../types';

export interface UseCampagneDetailReturn {
  campagne: CampagneWithRelations | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  fetchCampagne: (id: UUID) => Promise<void>;
  updateCampagne: (payload: CampagneUpdatePayload) => Promise<void>;
  changeCampagneStatus: (statut: StatutCampagne | string) => Promise<void>;
  updateBudget: (budgetAlloue?: number, budgetDepense?: number) => Promise<void>;
  updateStatistics: (personnesTouchees?: number, interactions?: number) => Promise<void>;
}

/**
 * Hook pour la gestion du détail d'une campagne
 */
export const useCampagneDetail = (): UseCampagneDetailReturn => {
  const notification = useNotification();
  const [campagne, setCampagne] = useState<CampagneWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch campagne detail
  const fetchCampagne = useCallback(async (id: UUID) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await campagneService.getCampagneById(id);
      setCampagne(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
      notification.addNotification({
        title: 'Erreur',
        message,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  }, [notification]);

  // Update campagne
  const updateCampagne = useCallback(
    async (payload: CampagneUpdatePayload) => {
      if (!campagne) return;

      setIsUpdating(true);
      setError(null);

      try {
        const updated = await campagneService.updateCampagne(campagne.id, payload);
        setCampagne({ ...campagne, ...updated });
        notification.addNotification({
          title: 'Succès',
          message: 'Campagne mise à jour',
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        setError(message);
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [campagne, notification],
  );

  // Change status
  const changeCampagneStatus = useCallback(
    async (statut: string | StatutCampagne) => {
      if (!campagne) return;

      setIsUpdating(true);
      setError(null);

      try {
        const updated = await campagneService.changeCampagneStatus(campagne.id, statut as StatutCampagne);
        setCampagne({ ...campagne, ...updated });
        notification.addNotification({
          title: 'Succès',
          message: 'Statut mise à jour',
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        setError(message);
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [campagne, notification],
  );

  // Update budget
  const updateBudget = useCallback(
    async (budgetAlloue?: number, budgetDepense?: number) => {
      if (!campagne) return;

      setIsUpdating(true);
      setError(null);

      try {
        const updated = await campagneService.updateBudget(
          campagne.id,
          budgetAlloue,
          budgetDepense,
        );
        setCampagne({ ...campagne, ...updated });
        notification.addNotification({
          title: 'Succès',
          message: 'Budget mise à jour',
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        setError(message);
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [campagne, notification],
  );

  // Update statistics
  const updateStatistics = useCallback(
    async (personnesTouchees?: number, interactions?: number) => {
      if (!campagne) return;

      setIsUpdating(true);
      setError(null);

      try {
        const updated = await campagneService.updateStatistics(
          campagne.id,
          personnesTouchees,
          interactions,
        );
        setCampagne({ ...campagne, ...updated });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        setError(message);
      } finally {
        setIsUpdating(false);
      }
    },
    [campagne, notification],
  );

  return {
    campagne,
    isLoading,
    isUpdating,
    error,
    fetchCampagne,
    updateCampagne,
    changeCampagneStatus,
    updateBudget,
    updateStatistics,
  };
};
