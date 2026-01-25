/**
 * =====================================================
 * RETROUVONSLES - useCampagnes Hook
 * Hook pour la gestion du cycle de vie des campagnes
 * =====================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { useNotification } from '@/contexts';
import { campagneService, calculateCampagneStatistics } from '../services';
import type { CampagneSensibilisation, UUID } from '@types';
import type { CampagneFilterCriteria, CampagneStatistics } from '../types';

export interface UseCampagnesReturn {
  campagnes: CampagneSensibilisation[];
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  statistics: CampagneStatistics | null;
  fetchCampagnes: (page?: number, filters?: CampagneFilterCriteria) => Promise<void>;
  fetchCampagnesByOrganisation: (organisationId: UUID) => Promise<void>;
  deleteCampagne: (id: UUID) => Promise<void>;
  deleteCampagnes: (ids: UUID[]) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook pour la gestion des campagnes
 */
export const useCampagnes = (pageSize: number = 10): UseCampagnesReturn => {
  const notification = useNotification();
  const [campagnes, setCampagnes] = useState<CampagneSensibilisation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statistics, setStatistics] = useState<CampagneStatistics | null>(null);
  const [currentFilters, setCurrentFilters] = useState<CampagneFilterCriteria | undefined>();

  // Fetch campagnes
  const fetchCampagnes = useCallback(
    async (page: number = 1, filters?: CampagneFilterCriteria) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await campagneService.getCampagnes(page, pageSize, filters);
        setCampagnes(response.data);
        setTotalItems(response.total);
        setCurrentPage(page);
        setCurrentFilters(filters);

        // Calculate statistics
        const stats = calculateCampagneStatistics(response.data);
        setStatistics(stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des campagnes';
        setError(message);
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, notification],
  );

  // Fetch campagnes by organisation
  const fetchCampagnesByOrganisation = useCallback(
    async (organisationId: UUID) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await campagneService.getCampagnesByOrganisation(organisationId);
        setCampagnes(response.data);
        setTotalItems(response.total);
        setCurrentPage(1);

        const stats = calculateCampagneStatistics(response.data);
        setStatistics(stats);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement des campagnes';
        setError(message);
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [notification],
  );

  // Delete campagne
  const deleteCampagne = useCallback(
    async (id: UUID) => {
      try {
        await campagneService.deleteCampagne(id);
        setCampagnes((prev) => prev.filter((c) => c.id !== id));
        notification.addNotification({
          title: 'Succès',
          message: 'Campagne supprimée avec succès',
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      }
    },
    [notification],
  );

  // Delete multiple campagnes
  const deleteCampagnes = useCallback(
    async (ids: UUID[]) => {
      try {
        await campagneService.deleteCampagnes(ids);
        setCampagnes((prev) => prev.filter((c) => !ids.includes(c.id)));
        notification.addNotification({
          title: 'Succès',
          message: `${ids.length} campagne(s) supprimée(s)`,
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
        notification.addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
      }
    },
    [notification],
  );

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchCampagnes(currentPage, currentFilters);
  }, [fetchCampagnes, currentPage, currentFilters]);

  // Initial fetch
  useEffect(() => {
    fetchCampagnes();
  }, [fetchCampagnes]);

  return {
    campagnes,
    isLoading,
    error,
    totalItems,
    currentPage,
    pageSize,
    statistics,
    fetchCampagnes,
    fetchCampagnesByOrganisation,
    deleteCampagne,
    deleteCampagnes,
    refresh,
  };
};
