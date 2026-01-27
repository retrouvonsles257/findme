/**
 * Coordination Feature - Hooks Barrel Export
 */

export { useCoordinationMessages } from './useCoordinationMessages';
export { useCoordinationResources } from './useCoordinationResources';
export { useCoordinationHistory } from './useCoordinationHistory';
export { useSharedDossiers } from './useSharedDossiers';

// Re-export types
export type { CoordinationMessage } from './useCoordinationMessages';
export type { CoordinationResource, ResourceRequest } from './useCoordinationResources';
export type { HistoryEntry } from './useCoordinationHistory';
export type { SharedDossier } from './useSharedDossiers';
