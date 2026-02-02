/**
 * =====================================================
 * RETROUVONSLES - Campagne Types
 * Types spécifiques pour la feature campagnes
 * =====================================================
 */

import type { CampagneSensibilisation, Timestamp, UUID, Json } from '../../../@types';
import type { TypeCampagne, StatutCampagne } from '../../../@types/enums.types';

// ============================================
// CAMPAGNE DISPLAY & FORM TYPES
// ============================================

export interface CampagneWithRelations extends CampagneSensibilisation {
  createur?: {
    id: UUID;
    nom: string;
    prenom: string;
    email: string;
  };
  organisation?: {
    id: UUID;
    nom: string;
  };
}

export interface CampagneFormValues {
  titre: string;
  description?: string;
  objectif?: string;
  type_campagne: TypeCampagne;
  public_cible?: string;
  date_debut: string;
  date_fin?: string;
  budget_alloue?: number;
  zones_geographiques?: string[];
  canaux_diffusion?: string[];
  contenu_campagne?: {
    media?: string[];
    texte?: string;
    hashtags?: string[];
  };
}

export interface CampagneFilterCriteria {
  statut?: StatutCampagne[];
  type_campagne?: TypeCampagne[];
  search?: string;
  date_from?: string;
  date_to?: string;
  organisations?: UUID[];
  minBudget?: number;
  maxBudget?: number;
}

export interface CampagneCreatePayload {
  titre: string;
  description?: string;
  objectif?: string;
  type_campagne: TypeCampagne;
  public_cible?: string;
  date_debut: string;
  date_fin?: string;
  zones_geographiques?: Json;
  canaux_diffusion?: Json;
  contenu_campagne?: Json;
  budget_alloue?: number;
  id_organisation?: UUID;
}

export interface CampagneUpdatePayload {
  titre?: string;
  description?: string;
  objectif?: string;
  public_cible?: string;
  date_debut?: string;
  date_fin?: string;
  zones_geographiques?: Json;
  canaux_diffusion?: Json;
  contenu_campagne?: Json;
  statut_campagne?: StatutCampagne;
  budget_alloue?: number;
  budget_depense?: number;
  nombre_personnes_touchees?: number;
  nombre_interactions?: number;
}

// ============================================
// CAMPAGNE STATISTICS TYPES
// ============================================

export interface CampagneStatistics {
  totalCampagnes: number;
  campagnesActives: number;
  campagnesTerminees: number;
  budgetTotal: number;
  budgetDepense: number;
  personnesTouchees: number;
  tauxEngagement: number;
  campagneParType: Record<TypeCampagne, number>;
  campagneParStatut: Record<StatutCampagne, number>;
}

export interface CampagneImpact {
  campagneId: UUID;
  personnesDirectes: number;
  personnesIndirectes: number;
  tauxEngagement: number;
  nombreInteractions: number;
  canaux: Record<string, number>;
}

export interface CampagneContent {
  media?: string[];
  texte?: string;
  hashtags?: string[];
  liens?: string[];
}

// ============================================
// STORE STATE TYPES
// ============================================

export interface CampagneStoreState {
  campagnes: CampagneSensibilisation[];
  filteredCampagnes: CampagneSensibilisation[];
  selectedCampagne: CampagneSensibilisation | null;
  selectedCampagnes: UUID[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  errors: Record<string, string>;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: CampagneFilterCriteria;
  sorting: {
    field: keyof CampagneSensibilisation;
    direction: 'asc' | 'desc';
  };
  statistics: CampagneStatistics | null;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface CampagneListResponse {
  data: CampagneSensibilisation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampagneDetailResponse {
  data: CampagneWithRelations;
  relatedAlertes?: any[];
}

export interface CampagneCreateResponse {
  data: CampagneSensibilisation;
  message: string;
}

export interface CampagneUpdateResponse {
  data: CampagneSensibilisation;
  message: string;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface CampagneListProps {
  className?: string;
  onSelectCampagne?: (campagne: CampagneSensibilisation) => void;
  initialFilters?: CampagneFilterCriteria;
}

export interface CampagneDetailProps {
  campagneId: UUID;
  onBack?: () => void;
  onEdit?: (campagne: CampagneSensibilisation) => void;
  className?: string;
}

export interface CampagneCreateProps {
  onSuccess?: (campagne: CampagneSensibilisation) => void;
  onCancel?: () => void;
  initialOrganisationId?: UUID;
  className?: string;
}

export interface CampagneStatsProps {
  campagneId?: UUID;
  showPeriod?: 'month' | 'quarter' | 'year';
  className?: string;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface CampagneNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  campagneId?: UUID;
  timestamp: Timestamp;
}

export interface CampagneModal {
  isOpen: boolean;
  type: 'create' | 'edit' | 'delete' | 'details';
  campagneId?: UUID;
  data?: Partial<CampagneFormValues>;
}

// ============================================
// ERROR TYPES
// ============================================

export interface CampagneError {
  code: string;
  message: string;
  field?: string;
}

export interface CampagneValidationError extends CampagneError {
  field: string;
}
