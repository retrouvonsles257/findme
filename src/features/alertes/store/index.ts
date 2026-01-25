/**
 * =====================================================
 * RETROUVONSLES - Store Index
 * Exports centralisés pour le store alertes
 * =====================================================
 */

export { alerteReducer, ALERTE_ACTIONS, default } from './alerteSlice';

export * from './alerteSelectors';

export type { AlerteStoreState, AlerteAction } from '../types';
