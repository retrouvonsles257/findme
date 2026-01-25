/**
 * =====================================================
 * RETROUVONSLES - Dossiers Hooks Index
 * Centralized export for all dossier hooks
 * =====================================================
 */

export { useDossiers } from './useDossiers';
export { useDossierCreate } from './useDossierCreate';
export { useDossierUpdate } from './useDossierUpdate';
export { useDossierDelete } from './useDossierDelete';
export { useDossierDetail } from './useDossierDetail';
export { useDossierActions } from './useDossierActions';
export { useHistoriqueDossier } from './useHistoriqueDossier';

export type {
  UseDossiersReturn,
  UseDossierCreateReturn,
  UseDossierUpdateReturn,
  UseDossierDeleteReturn,
  UseDossierDetailReturn,
  UseDossierActionsReturn,
} from '../types';
