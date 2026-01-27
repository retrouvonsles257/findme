/**
 * Coordination Feature - Main Barrel Export
 */

export {
  useCoordinationMessages,
  useCoordinationResources,
  useCoordinationHistory,
  useSharedDossiers,
} from './hooks';

export type {
  CoordinationMessage,
  CoordinationResource,
  ResourceRequest,
  HistoryEntry,
  SharedDossier,
} from './hooks';
