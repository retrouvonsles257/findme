/**
 * =====================================================
 * RETROUVONSLES - Hook useAlerteDiffusion
 * Gestion de la diffusion des alertes
 * =====================================================
 */

import { useState, useCallback } from 'react';
import { useNotification, useGeolocation } from '../../../contexts';
import { useI18n } from '../../../hooks';
import * as alerteAPI from '../services/alerteAPI';
import * as alerteService from '../services/alerteService';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DiffusionSettings {
  canaux: string[];
  rayon_km: number;
  zones_specifiques: string[];
  planifiee: boolean;
  date_programmee?: string;
  priorite_diffusion: 'haute' | 'moyenne' | 'basse';
}

export interface DiffusionResult {
  id: string;
  nombre_destinataires: number;
  nombre_envois_reussis: number;
  pourcentage_reussite: number;
  time_elapsed_ms: number;
}

export interface DiffusionStats {
  total_diffusions: number;
  total_envois: number;
  total_reussi: number;
  taux_reussite: number;
  dernier_diffusion?: Date;
}

export interface UseAlerteDiffusionState {
  isScheduling: boolean;
  isDiffusing: boolean;
  error: string | null;
  lastResult: DiffusionResult | null;
  stats: DiffusionStats;
  zonesDisponibles: Array<{ id: string; nom: string }>;
}

export interface UseAlerteDiffusionActions {
  diffuserAlerte: (
    alerteId: string,
    settings: DiffusionSettings,
  ) => Promise<DiffusionResult>;
  programmerDiffusion: (
    alerteId: string,
    settings: DiffusionSettings,
  ) => Promise<void>;
  obtenirAlertesPertinentes: () => Promise<alerteService.AlerteDisplayData[]>;
  obtenirAlertesByZone: (
    zona: string,
  ) => Promise<alerteService.AlerteDisplayData[]>;
  annulerDiffusion: (alerteId: string) => Promise<void>;
  obtenirStats: () => Promise<DiffusionStats>;
  clearError: () => void;
}

export type UseAlerteDiffusionReturn = UseAlerteDiffusionState & UseAlerteDiffusionActions;

// ============================================
// DEFAULT SETTINGS
// ============================================

const DEFAULT_SETTINGS: DiffusionSettings = {
  canaux: ['push', 'in_app'],
  rayon_km: 50,
  zones_specifiques: [],
  planifiee: false,
  priorite_diffusion: 'moyenne',
};

// ============================================
// ZONES DISPONIBLES (Mock Data)
// ============================================

const ZONES_DISPONIBLES = [
  { id: 'douala', nom: 'Région de Douala' },
  { id: 'yaounde', nom: 'Région de Yaoundé' },
  { id: 'kumba', nom: 'Région de Kumba' },
  { id: 'bamenda', nom: 'Région de Bamenda' },
  { id: 'limbe', nom: 'Région de Limbé' },
  { id: 'buea', nom: 'Région de Buéa' },
];

// ============================================
// HOOK IMPLEMENTATION
// ============================================

/**
 * Hook personnalisé pour la gestion de la diffusion des alertes
 */
export const useAlerteDiffusion = (): UseAlerteDiffusionReturn => {
  const [state, setState] = useState<UseAlerteDiffusionState>({
    isScheduling: false,
    isDiffusing: false,
    error: null,
    lastResult: null,
    stats: {
      total_diffusions: 0,
      total_envois: 0,
      total_reussi: 0,
      taux_reussite: 0,
    },
    zonesDisponibles: ZONES_DISPONIBLES,
  });

  const { addNotification } = useNotification();
  const { location } = useGeolocation();
  const { t } = useI18n();

  // ========== DIFFUSION ==========

  const diffuserAlerte = useCallback(
    async (alerteId: string, settings: DiffusionSettings = DEFAULT_SETTINGS) => {
      try {
        setState((prev) => ({ ...prev, isDiffusing: true, error: null }));
        const startTime = Date.now();

        // Appeler l'API de diffusion
        const result = await alerteAPI.diffuserAlerte(alerteId, settings.canaux);

        const diffusionResult: DiffusionResult = {
          id: alerteId,
          nombre_destinataires: result.nombre_destinataires,
          nombre_envois_reussis: result.nombre_destinataires,
          pourcentage_reussite: 100,
          time_elapsed_ms: Date.now() - startTime,
        };

        setState((prev) => ({
          ...prev,
          isDiffusing: false,
          lastResult: diffusionResult,
          stats: {
            ...prev.stats,
            total_diffusions: prev.stats.total_diffusions + 1,
            total_envois: prev.stats.total_envois + result.nombre_destinataires,
            total_reussi: prev.stats.total_reussi + result.nombre_destinataires,
            dernier_diffusion: new Date(),
          },
        }));

        // Calculer le taux
        const taux =
          diffusionResult.nombre_envois_reussis /
          Math.max(diffusionResult.nombre_destinataires, 1);
        setState((prev) => ({
          ...prev,
          stats: {
            ...prev.stats,
            taux_reussite: Math.round(taux * 100),
          },
        }));

        if (result.nombre_destinataires === 0) {
          addNotification({
            title: t('authority.alertes.diffusion.toastZeroTitle'),
            message: t('authority.alertes.diffusion.toastZeroBody'),
            type: 'warning',
            duration: 8000,
          });
        } else {
          addNotification({
            title: t('authority.alertes.diffusion.toastSuccessTitle'),
            message: t('authority.alertes.diffusion.toastSuccessBody').replace(
              '{{count}}',
              String(result.nombre_destinataires),
            ),
            type: 'success',
            duration: 5000,
          });
        }

        return diffusionResult;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la diffusion';
        setState((prev) => ({ ...prev, isDiffusing: false, error: message }));
        addNotification({
          title: 'Erreur',
          message: 'Impossible de diffuser l\'alerte',
          type: 'error',
        });
        throw err;
      }
    },
    [addNotification, t],
  );

  // ========== PROGRAMMATION ==========

  const programmerDiffusion = useCallback(
    async (_alerteId: string, settings: DiffusionSettings) => {
      try {
        if (!settings.planifiee || !settings.date_programmee) {
          throw new Error('Date de programmation requise');
        }

        setState((prev) => ({ ...prev, isScheduling: true, error: null }));

        const dateProgammee = new Date(settings.date_programmee);
        if (dateProgammee <= new Date()) {
          throw new Error('La date doit être dans le futur');
        }

        // En production, sauvegarder l'alerte programmée dans la BD
        // Pour maintenant, on peut simuler avec une notification
        setState((prev) => ({ ...prev, isScheduling: false }));

        addNotification({
          title: 'Diffusion programmée',
          message: `Alerte sera diffusée le ${dateProgammee.toLocaleString()}`,
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors de la programmation';
        setState((prev) => ({ ...prev, isScheduling: false, error: message }));
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

  // ========== ALERTES PERTINENTES ==========

  const obtenirAlertesPertinentes = useCallback(async () => {
    try {
      if (!location) {
        throw new Error('Localisation non disponible');
      }

      const alertes = await alerteService.getRelevantAlertes(
        location.latitude,
        location.longitude,
      );

      return alertes;
    } catch (err) {
      console.error('Erreur lors de la récupération des alertes pertinentes:', err);
      return [];
    }
  }, [location]);

  // ========== ALERTES PAR ZONE ==========

  const obtenirAlertesByZone = useCallback(
    async (zoneId: string): Promise<alerteService.AlerteDisplayData[]> => {
      try {
        // En production, mapper zoneId vers des coordonnées
        const zoneCoords: Record<string, [number, number]> = {
          douala: [4.0511, 9.767],
          yaounde: [3.8667, 11.5167],
          kumba: [5.628, 9.441],
          bamenda: [5.9631, 10.1591],
          limbe: [4.016, 9.247],
          buea: [4.1542, 9.2432],
        };

        const [lat, lng] = zoneCoords[zoneId] || [3.8667, 11.5167];

        const alertes = await alerteAPI.getActivAlertesByZone(lat, lng, 100);

        return alertes.map((a) => alerteService.enrichAlerteForDisplay(a));
      } catch (err) {
        console.error('Erreur lors de la récupération des alertes par zone:', err);
        return [];
      }
    },
    [],
  );

  // ========== ANNULATION ==========

  const annulerDiffusion = useCallback(
    async (alerteId: string): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, isDiffusing: true, error: null }));

        await alerteAPI.cancelAlerte(alerteId, 'Diffusion annulée');

        setState((prev) => ({ ...prev, isDiffusing: false }));

        addNotification({
          title: 'Succès',
          message: 'Diffusion annulée',
          type: 'success',
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Erreur lors de l\'annulation';
        setState((prev) => ({ ...prev, isDiffusing: false, error: message }));
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

  // ========== STATS ==========

  const obtenirStats = useCallback(async (): Promise<DiffusionStats> => {
    try {
      const stats = await alerteAPI.getAlerteStats();

      const diffusionStats: DiffusionStats = {
        total_diffusions: stats.active,
        total_envois: 0, // À calculer depuis la BD
        total_reussi: 0, // À calculer depuis la BD
        taux_reussite: 0,
      };

      return diffusionStats;
    } catch (err) {
      console.error('Erreur lors de la récupération des stats:', err);
      return state.stats;
    }
  }, [state.stats]);

  // ========== UTILITY ==========

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    diffuserAlerte,
    programmerDiffusion,
    obtenirAlertesPertinentes,
    obtenirAlertesByZone,
    annulerDiffusion,
    obtenirStats,
    clearError,
  };
};
