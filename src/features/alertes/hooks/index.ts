/**
 * =====================================================
 * RETROUVONSLES - Hooks Index
 * Exports centralisés pour les hooks alertes
 * =====================================================
 */

export { useAlertes } from './useAlertes';
export type { UseAlertsState, UseAlertsActions, UseAlertsReturn } from './useAlertes';

export { useAlerteDiffusion } from './useAlerteDiffusion';
export type {
  DiffusionSettings,
  DiffusionResult,
  DiffusionStats,
  UseAlerteDiffusionState,
  UseAlerteDiffusionActions,
  UseAlerteDiffusionReturn,
} from './useAlerteDiffusion';
