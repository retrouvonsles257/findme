/**
 * =====================================================
 * RETROUVONSLES - useDossiers Hook
 * Main hook for dossier management
 * =====================================================
 */

import { useState, useCallback, useEffect } from 'react';
import type { UseDossiersReturn, DossierDisplayData, DossierFilterCriteria } from '../types';
import * as dossierAPI from '../services/dossierAPI';
import * as dossierService from '../services/dossierService';

export const useDossiers = (): UseDossiersReturn => {
  const [dossiers, setDossiers] = useState<DossierDisplayData[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<DossierDisplayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);

  const fetchDossiers = useCallback(async (filters?: DossierFilterCriteria) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, count } = await dossierAPI.getDossiers({
        ...filters,
        limit: pageSize,
        offset: currentPage,
      });

      const enrichedData = dossierService.enrichDossiersForDisplay(data);
      setDossiers(enrichedData);
      setTotalCount(count);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Fetch dossiers error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize, currentPage]);

  const fetchDossierById = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const dossier = await dossierAPI.getDossierById(id);
      const enriched = dossierService.enrichDossierForDisplay(dossier);
      setSelectedDossier(enriched);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Fetch dossier by ID error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setFilters = useCallback(
    (filters: DossierFilterCriteria) => {
      setCurrentPage(0);
      fetchDossiers(filters);
    },
    [fetchDossiers],
  );

  const goToPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
    },
    [totalPages],
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(0);
  }, []);

  const setSortBy = useCallback(
    (field: 'date' | 'urgence' | 'signalements' | 'vues') => {
      fetchDossiers({ sortBy: field });
    },
    [fetchDossiers],
  );

  const setSortOrder = useCallback(
    (order: 'asc' | 'desc') => {
      fetchDossiers({ sortOrder: order });
    },
    [fetchDossiers],
  );

  // Initial load
  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  return {
    dossiers,
    selectedDossier,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    fetchDossiers,
    fetchDossierById,
    setFilters,
    goToPage,
    setPageSize,
    setSortBy,
    setSortOrder,
  };
};
