/**
 * =====================================================
 * RETROUVONSLES - Hook useDons
 * Gestion de l'état global des dons
 * =====================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNotification } from '../../../contexts';
import * as donService from '../services/donService';
import * as donAPI from '../services/donAPI';
import type { Don } from '../../../@types';
import { StatutPaiement } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UseDonsState {
  dons: donService.DonDisplayData[];
  selectedDon: Don | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  statistics: donAPI.DonStats | null;
}

export interface UseDonsActions {
  fetchDons: (filters?: donAPI.DonFilters) => Promise<void>;
  fetchDonById: (id: string) => Promise<void>;
  createDon: (formData: donService.DonFormData) => Promise<Don>;
  updateDonStatus: (id: string, statut: StatutPaiement) => Promise<Don>;
  deleteDon: (id: string) => Promise<void>;
  getDonHistory: (email: string) => Promise<donService.DonDisplayData[]>;
  getStatistics: () => Promise<void>;
  markAsThanked: (id: string) => Promise<Don>;
  generateReceipt: (id: string, numeroReceipt: string) => Promise<Don>;
  clearError: () => void;
  clearSelection: () => void;
}

export type UseDonsReturn = UseDonsState & UseDonsActions;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook personnalisé pour la gestion des dons
 */
export const useDons = (): UseDonsReturn => {
  const [state, setState] = useState<UseDonsState>({
    dons: [],
    selectedDon: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
    statistics: null,
  });

  const { addNotification } = useNotification();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ========== FETCH OPERATIONS ==========

  const fetchDons = useCallback(async (filters?: donAPI.DonFilters) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const dons = await donService.getDonsList(filters);
      setState((prev) => ({
        ...prev,
        dons,
        total: dons.length,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les dons',
        type: 'error',
      });
    }
  }, [addNotification]);

  const fetchDonById = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const don = await donService.getDonWithDetails(id);
      setState((prev) => ({
        ...prev,
        selectedDon: don,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger le don',
        type: 'error',
      });
    }
  }, [addNotification]);

  // ========== CREATE OPERATIONS ==========

  const createDon = useCallback(
    async (formData: donService.DonFormData): Promise<Don> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const don = await donService.createDraftDon(formData);
        setState((prev) => ({
          ...prev,
          dons: [...prev.dons, don as donService.DonDisplayData],
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Don créé avec succès',
          type: 'success',
        });

        return don;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la création';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
        throw err;
      }
    },
    [addNotification],
  );

  // ========== UPDATE OPERATIONS ==========

  const updateDonStatus = useCallback(
    async (id: string, statut: StatutPaiement): Promise<Don> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const don = await donAPI.updateDonPaymentStatus(id, statut);
        setState((prev) => ({
          ...prev,
          dons: prev.dons.map((d) => (d.id === id ? don : d)),
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: `Statut du don mis à jour: ${statut}`,
          type: 'success',
        });

        return don;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
        throw err;
      }
    },
    [addNotification],
  );

  const markAsThanked = useCallback(
    async (id: string): Promise<Don> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const don = await donAPI.markDonAsThanked(id);
        setState((prev) => ({
          ...prev,
          dons: prev.dons.map((d) => (d.id === id ? don : d)),
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Remerciement enregistré',
          type: 'success',
        });

        return don;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    [addNotification],
  );

  const generateReceipt = useCallback(
    async (id: string, numeroReceipt: string): Promise<Don> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const don = await donAPI.generateDonReceipt(id, numeroReceipt);
        setState((prev) => ({
          ...prev,
          dons: prev.dons.map((d) => (d.id === id ? don : d)),
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Reçu fiscal généré',
          type: 'success',
        });

        return don;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        throw err;
      }
    },
    [addNotification],
  );

  // ========== DELETE OPERATIONS ==========

  const deleteDon = useCallback(
    async (id: string) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        await donAPI.deleteDon(id);
        setState((prev) => ({
          ...prev,
          dons: prev.dons.filter((d) => d.id !== id),
          total: Math.max(0, prev.total - 1),
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Don supprimé',
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
        setState((prev) => ({ ...prev, error: message, loading: false }));
        addNotification({
          title: 'Erreur',
          message,
          type: 'error',
        });
        throw err;
      }
    },
    [addNotification],
  );

  // ========== STATISTICS ==========

  const getStatistics = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const stats = await donAPI.getDonStatistics();
      setState((prev) => ({
        ...prev,
        statistics: stats,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      setState((prev) => ({ ...prev, error: message, loading: false }));
    }
  }, []);

  // ========== HISTORY ==========

  const getDonHistory = useCallback(async (email: string): Promise<donService.DonDisplayData[]> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const history = await donService.getDonorDonationHistory(email);
      setState((prev) => ({
        ...prev,
        loading: false,
      }));

      return history;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      return [];
    }
  }, []);

  // ========== UTILS ==========

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedDon: null }));
  }, []);

  // ========== CLEANUP ==========

  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    ...state,
    fetchDons,
    fetchDonById,
    createDon,
    updateDonStatus,
    deleteDon,
    getDonHistory,
    getStatistics,
    markAsThanked,
    generateReceipt,
    clearError,
    clearSelection,
  };
};
