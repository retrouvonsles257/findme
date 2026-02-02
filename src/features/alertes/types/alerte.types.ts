/**
 * =====================================================
 * RETROUVONSLES - Alertes Types
 * Types spécifiques pour la feature alertes
 * =====================================================
 */

import type { Alerte, StatutAlerte, TypeAlerte } from '../../../@types';

// ============================================
// ALERTE DISPLAY & FORM TYPES
// ============================================

export interface AlerteWithRelations extends Alerte {
  dossier_disparition?: any;
  utilisateur_createur?: any;
}

export interface AlerteFormValues {
  titre: string;
  message: string;
  type_alerte: TypeAlerte;
  id_dossier: string;
  latitude_centre?: number;
  longitude_centre?: number;
  rayon_km: number;
  date_expiration?: string;
  canaux_diffusion: string[];
}

export interface AlerteFilterCriteria {
  statut?: StatutAlerte[];
  type_alerte?: TypeAlerte[];
  search?: string;
  date_from?: string;
  date_to?: string;
  id_dossier?: string;
}

// ============================================
// DIFFUSION TYPES
// ============================================

export interface AlerteDiffusionPayload {
  alerteId: string;
  canaux: string[];
  rayon_km: number;
  zones_specifiques?: string[];
  planifiee?: boolean;
  date_programmee?: string;
  priorite_diffusion?: 'haute' | 'moyenne' | 'basse';
}

export interface AlerteStatistics {
  total_alertes: number;
  alertes_actives: number;
  alertes_par_type: Record<string, number>;
  alertes_par_statut: Record<string, number>;
  taux_diffusion_moyen: number;
  derniere_alerte?: Date;
}

// ============================================
// STORE STATE TYPES
// ============================================

export interface AlerteStoreState {
  // Current list
  alertes: Alerte[];
  filteredAlertes: Alerte[];
  
  // Selected
  selectedAlerte: Alerte | null;
  selectedAlertes: string[];
  
  // Pagination
  currentPage: number;
  pageSize: number;
  total: number;
  
  // Filters
  filters: AlerteFilterCriteria;
  
  // Statistics
  statistics: AlerteStatistics | null;
  
  // UI States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isDiffusing: boolean;
  
  // Errors
  error: string | null;
  errors: Record<string, string>;
  
  // Sorting
  sortBy: 'date' | 'titre' | 'statut' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface AlerteAction {
  type: string;
  payload?: any;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface AlerteNotification {
  id: string;
  titre: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface AlerteModal {
  isOpen: boolean;
  type?: 'create' | 'edit' | 'delete' | 'diffuse' | 'schedule';
  data?: any;
}
