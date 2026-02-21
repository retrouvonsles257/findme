/**
 * =====================================================
 * RETROUVONSLES - Hook useDonationHistory
 * Gestion de l'historique des dons
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useNotification } from '../../../contexts';
import * as donService from '../services/donService';
import * as donAPI from '../services/donAPI';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UseDonationHistoryState {
  donationHistory: donService.DonDisplayData[];
  recentDonations: donService.DonDisplayData[];
  statistics: donAPI.DonStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface UseDonationHistoryActions {
  /** Charge "Mes dons" : priorité userId (connecté), sinon email. */
  fetchDonorHistory: (options: { userId?: string | null; email?: string | null; limit?: number }) => Promise<void>;
  fetchRecentDonations: (limit?: number) => Promise<void>;
  fetchStatistics: () => Promise<void>;
  clearHistory: () => void;
}

export type UseDonationHistoryReturn = UseDonationHistoryState & UseDonationHistoryActions;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook personnalisé pour l'historique des dons
 */
export const useDonationHistory = (): UseDonationHistoryReturn => {
  const [state, setState] = useState<UseDonationHistoryState>({
    donationHistory: [],
    recentDonations: [],
    statistics: null,
    isLoading: false,
    error: null,
  });

  const { addNotification } = useNotification();

  // ========== DONOR HISTORY ==========

  const fetchDonorHistory = useCallback(async (options: { userId?: string | null; email?: string | null; limit?: number }) => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const history = await donService.getDonorDonationHistory(options);

      setState((prev) => ({
        ...prev,
        donationHistory: history,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger l\'historique',
        type: 'error',
      });
    }
  }, [addNotification]);

  // ========== RECENT DONATIONS ==========

  const fetchRecentDonations = useCallback(async (limit: number = 10) => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const recent = await donService.getRecentDonsForDisplay(limit);

      setState((prev) => ({
        ...prev,
        recentDonations: recent,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les dons récents',
        type: 'error',
      });
    }
  }, [addNotification]);

  // ========== STATISTICS ==========

  const fetchStatistics = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const stats = await donAPI.getDonStatistics();

      setState((prev) => ({
        ...prev,
        statistics: stats,
        isLoading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du calcul';
      setState((prev) => ({
        ...prev,
        error: message,
        isLoading: false,
      }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de calculer les statistiques',
        type: 'error',
      });
    }
  }, [addNotification]);

  // ========== UTILS ==========

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      donationHistory: [],
      recentDonations: [],
      error: null,
    }));
  }, []);

  return {
    ...state,
    fetchDonorHistory,
    fetchRecentDonations,
    fetchStatistics,
    clearHistory,
  };
};
