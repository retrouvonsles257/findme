/**
 * =====================================================
 * RETROUVONSLES - Hook useAlertes
 * Gestion de l'état global des alertes
 * =====================================================
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNotification } from '../../../contexts';
import * as alerteService from '../services/alerteService';
import * as alerteAPI from '../services/alerteAPI';
import type {
  Alerte,
  StatutAlerte,
} from '../../../@types';
import { StatutAlerte as StatutAlerteEnum } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface UseAlertsState {
  alertes: alerteService.AlerteDisplayData[];
  selectedAlerte: Alerte | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
}

export interface UseAlertsActions {
  fetchAlertes: (filters?: alerteAPI.AlerteFilters) => Promise<void>;
  fetchAlerteById: (id: string) => Promise<void>;
  createDraft: (formData: alerteService.AlerteFormData) => Promise<Alerte>;
  createAndBroadcast: (formData: alerteService.AlerteFormData) => Promise<Alerte>;
  publishDraft: (alerteId: string, canaux?: string[]) => Promise<Alerte>;
  updateAlerteStatus: (id: string, statut: StatutAlerte, motif?: string) => Promise<Alerte>;
  closeAlerte: (id: string) => Promise<Alerte>;
  abortAlerte: (id: string, motif: string) => Promise<Alerte>;
  deleteAlerte: (id: string) => Promise<void>;
  incrementViews: (id: string) => Promise<void>;
  incrementShares: (id: string) => Promise<void>;
  clearError: () => void;
  clearSelection: () => void;
}

export type UseAlertsReturn = UseAlertsState & UseAlertsActions;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook personnalisé pour la gestion des alertes
 */
export const useAlertes = (): UseAlertsReturn => {
  const [state, setState] = useState<UseAlertsState>({
    alertes: [],
    selectedAlerte: null,
    loading: false,
    error: null,
    total: 0,
    page: 1,
  });

  const { addNotification } = useNotification();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // ========== FETCH OPERATIONS ==========

  const fetchAlertes = useCallback(async (filters?: alerteAPI.AlerteFilters) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const alertes = await alerteService.getAlertesList(filters);
      setState((prev) => ({
        ...prev,
        alertes,
        total: alertes.length,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger les alertes',
        type: 'error',
      });
    }
  }, [addNotification]);

  const fetchAlerteById = useCallback(async (id: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const alerte = await alerteAPI.getAlerteById(id);
      setState((prev) => ({
        ...prev,
        selectedAlerte: alerte,
        loading: false,
      }));

      // Incrémenter les vues
      await alerteAPI.incrementAlerteViews(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setState((prev) => ({ ...prev, error: message, loading: false }));
      addNotification({
        title: 'Erreur',
        message: 'Impossible de charger l\'alerte',
        type: 'error',
      });
    }
  }, [addNotification]);

  // ========== CREATE OPERATIONS ==========

  const createDraft = useCallback(
    async (formData: alerteService.AlerteFormData): Promise<Alerte> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const alerte = await alerteService.createDraftAlerte(formData);
        setState((prev) => ({
          ...prev,
          alertes: [...prev.alertes, alerte as alerteService.AlerteDisplayData],
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Alerte créée en brouillon',
          type: 'success',
        });

        return alerte;
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

  const createAndBroadcast = useCallback(
    async (formData: alerteService.AlerteFormData): Promise<Alerte> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const alerte = await alerteService.createAndBroadcastAlerte(formData);
        setState((prev) => ({
          ...prev,
          alertes: [...prev.alertes, alerte as alerteService.AlerteDisplayData],
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Alerte créée et diffusée',
          type: 'success',
          duration: 5000,
        });

        return alerte;
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

  const publishDraft = useCallback(
    async (alerteId: string, canaux?: string[]): Promise<Alerte> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const alerte = await alerteService.publishDraftAlerte(alerteId, canaux);
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.map((a) => (a.id === alerteId ? alerte : a)),
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Alerte publiée et diffusée',
          type: 'success',
        });

        return alerte;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la publication';
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

  const updateAlerteStatus = useCallback(
    async (id: string, statut: StatutAlerte, motif?: string): Promise<Alerte> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const alerte = await alerteAPI.updateAlerteStatut(id, statut, motif);
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.map((a) => (a.id === id ? alerte : a)),
          selectedAlerte: prev.selectedAlerte?.id === id ? alerte : prev.selectedAlerte,
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: `Alerte marquée comme ${statut}`,
          type: 'success',
        });

        return alerte;
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

  const closeAlerte = useCallback(
    async (id: string): Promise<Alerte> => {
      return updateAlerteStatus(id, StatutAlerteEnum.TERMINEE, 'Personne retrouvée');
    },
    [updateAlerteStatus],
  );

  const abortAlerte = useCallback(
    async (id: string, motif: string): Promise<Alerte> => {
      return updateAlerteStatus(id, StatutAlerteEnum.ANNULEE, motif);
    },
    [updateAlerteStatus],
  );

  // ========== DELETE OPERATIONS ==========

  const deleteAlerte = useCallback(
    async (id: string): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        await alerteAPI.deleteAlerte(id);
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.filter((a) => a.id !== id),
          selectedAlerte: prev.selectedAlerte?.id === id ? null : prev.selectedAlerte,
          loading: false,
        }));

        addNotification({
          title: 'Succès',
          message: 'Alerte supprimée',
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

  // ========== ANALYTICS ==========

  const incrementViews = useCallback(
    async (id: string): Promise<void> => {
      try {
        await alerteAPI.incrementAlerteViews(id);
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.map((a) =>
            a.id === id ? { ...a, nombre_vues: (a.nombre_vues || 0) + 1 } : a,
          ),
        }));
      } catch (err) {
        console.error('Erreur lors de l\'incrémentation des vues:', err);
      }
    },
    [],
  );

  const incrementShares = useCallback(
    async (id: string): Promise<void> => {
      try {
        await alerteAPI.incrementAlerteShares(id);
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.map((a) =>
            a.id === id ? { ...a, nombre_partages: (a.nombre_partages || 0) + 1 } : a,
          ),
        }));
      } catch (err) {
        console.error('Erreur lors de l\'incrémentation des partages:', err);
      }
    },
    [],
  );

  // ========== UTILITY ACTIONS ==========

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedAlerte: null }));
  }, []);

  // ========== REALTIME SUBSCRIPTION ==========

  useEffect(() => {
    // S'abonner aux changements d'alertes
    unsubscribeRef.current = alerteAPI.subscribeToAlertes((payload) => {
      if (payload.eventType === 'INSERT') {
        setState((prev) => ({
          ...prev,
          alertes: [payload.new, ...prev.alertes],
          total: prev.total + 1,
        }));
      } else if (payload.eventType === 'UPDATE') {
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.map((a) => (a.id === payload.new.id ? payload.new : a)),
          selectedAlerte:
            prev.selectedAlerte?.id === payload.new.id
              ? payload.new
              : prev.selectedAlerte,
        }));
      } else if (payload.eventType === 'DELETE') {
        setState((prev) => ({
          ...prev,
          alertes: prev.alertes.filter((a) => a.id !== payload.old.id),
          total: prev.total - 1,
        }));
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    ...state,
    fetchAlertes,
    fetchAlerteById,
    createDraft,
    createAndBroadcast,
    publishDraft,
    updateAlerteStatus,
    closeAlerte,
    abortAlerte,
    deleteAlerte,
    incrementViews,
    incrementShares,
    clearError,
    clearSelection,
  };
};
