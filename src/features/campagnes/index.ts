/**
 * =====================================================
 * RETROUVONSLES - Campagnes Feature Index
 * Point d'entrée principal pour la feature campagnes
 * =====================================================
 */

/* ============ COMPONENTS ============ */
export { default as CampagneList } from './components/CampagneList';
export { default as CampagneDetail } from './components/CampagneDetail';
export { default as CampagneCreate } from './components/CampagneCreate';
export { default as CampagneStats } from './components/CampagneStats';

/* ============ HOOKS ============ */
export { useCampagnes } from './hooks/useCampagnes';
export { useCampagneDetail } from './hooks/useCampagnesDetail';
export { useCampagneCreate } from './hooks/useCampagneCreate';

export type { UseCampagnesReturn } from './hooks/useCampagnes';
export type { UseCampagneDetailReturn } from './hooks/useCampagnesDetail';
export type { UseCampagneCreateReturn } from './hooks/useCampagneCreate';

/* ============ SERVICES ============ */
export {
  calculateCampagneStatistics,
  calculateCampagneImpact,
  validateCampagneDates,
  canDeleteCampagne,
  canEditCampagne,
  canLaunchCampagne,
  getCampagneTypeLabel,
  getCampagneStatusLabel,
  getCampagneStatusColor,
  formatBudget,
  calculateBudgetUtilization,
} from './services/campagneService';

/* ============ TYPES ============ */
export type {
  CampagneWithRelations,
  CampagneFormValues,
  CampagneFilterCriteria,
  CampagneCreatePayload,
  CampagneUpdatePayload,
  CampagneStatistics,
  CampagneImpact,
  CampagneContent,
  CampagneStoreState,
  CampagneListResponse,
  CampagneDetailResponse,
  CampagneCreateResponse,
  CampagneUpdateResponse,
  CampagneListProps,
  CampagneDetailProps,
  CampagneCreateProps,
  CampagneStatsProps,
  CampagneError,
  CampagneValidationError,
} from './types';

