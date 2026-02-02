/**
 * =====================================================
 * RETROUVONSLES - Dossier Types
 * TypeScript type definitions for dossier feature
 * =====================================================
 */

import type {
  DossierDisparition,
  Personne,
  Utilisateur,
  Organisation,
} from '../../../@types/database.types';
import type {
  TypeDisparition,
  StatutDossier,
  NiveauUrgence,
  PrecisionLieu,
  EtatPersonneRetrouvee,
} from '../../../@types/enums.types';

// ============================================
// FORM & INPUT TYPES
// ============================================

export interface DossierFormValues {
  // Informations principales
  numero_dossier?: string;
  date_disparition: string;
  type_disparition: TypeDisparition;
  niveau_urgence: NiveauUrgence;
  circonstances: string;

  // Lieu et localisation
  lieu_disparition: string;
  ville_disparition: string;
  region_disparition: string;
  pays_disparition: string;
  latitude_disparition?: number;
  longitude_disparition?: number;
  precision_lieu: PrecisionLieu;

  // Contexte
  contexte_specifique?: string;
  personnes_accompagnantes?: string;
  derniere_activite_connue?: string;
  destination_prevue?: string;
  moyen_transport?: string;

  // Contact et responsable
  contact_famille_principale?: string;
  telephone_contact?: string;
  email_contact?: string;
  enqueteur_responsable?: string;
  contact_enqueteur?: string;
  autorite_saisie?: string;
  numero_plainte?: string;

  // Visibilité et diffusion
  visible_public: boolean;
  diffusion_autorisee: boolean;
  diffusion_medias: boolean;
  diffusion_reseaux_sociaux: boolean;
  rayon_diffusion_km: number;
  zones_diffusion_prioritaire?: string;
}

export interface DossierUpdateInput {
  statut_dossier?: StatutDossier;
  sous_statut?: string;
  niveau_urgence?: NiveauUrgence;
  score_priorite?: number;
  zone_recherche_predite?: any;
  probabilite_localisation?: any;
  facteurs_risque?: any;
  dossiers_similaires?: any;
  enqueteur_responsable?: string;
  contact_enqueteur?: string;
  date_resolution?: string;
  lieu_decouverte?: string;
  latitude_decouverte?: number;
  longitude_decouverte?: number;
  circonstances_resolution?: string;
  etat_personne_retrouvee?: EtatPersonneRetrouvee;
  visible_public?: boolean;
  diffusion_autorisee?: boolean;
}

// ============================================
// DISPLAY & ENRICHED TYPES
// ============================================

export interface DossierDisplayData extends DossierDisparition {
  // Enriched fields
  statut_label: string;
  type_label: string;
  urgence_label: string;
  precision_label: string;
  etat_label?: string;

  // Calculated fields
  jours_depuis_disparition: number;
  is_recent: boolean;
  is_urgent: boolean;
  progress_resolution: number; // 0-100

  // Formatted fields
  date_disparition_formatted: string;
  date_resolution_formatted?: string;
  localisation_display: string;
  distance_kilometres?: number;

  // Related data
  personne?: Personne;
  createur?: Utilisateur;
  organisation?: Organisation;

  // Statistics
  nombre_signalements: number;
  nombre_alertes: number;
  nombre_vues: number;
}

export interface DossierValidationErrors {
  numero_dossier?: string;
  date_disparition?: string;
  type_disparition?: string;
  niveau_urgence?: string;
  circonstances?: string;
  lieu_disparition?: string;
  ville_disparition?: string;
  region_disparition?: string;
  pays_disparition?: string;
  precision_lieu?: string;
  contact_famille_principale?: string;
  telephone_contact?: string;
  email_contact?: string;
  [key: string]: string | undefined;
}

// ============================================
// FILTER & SEARCH TYPES
// ============================================

export interface DossierFilterCriteria {
  statut?: StatutDossier[];
  type_disparition?: TypeDisparition[];
  niveau_urgence?: NiveauUrgence[];
  date_min?: string;
  date_max?: string;
  region?: string[];
  ville?: string;
  is_recent?: boolean;
  is_urgent?: boolean;
  resolved?: boolean;
  search?: string;
  /**
   * Filtrage "métier" (utile côté opérateur / org).
   * Ces champs existent dans le modèle SQL (`id_organisation_responsable`, `id_utilisateur_createur`).
   */
  organisation_id?: string;
  createur_id?: string;
  personne_id?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'urgence' | 'signalements' | 'vues';
  sortOrder?: 'asc' | 'desc';
}

export interface DossierSearchParams {
  query: string;
  type: 'numero' | 'nom_personne' | 'location' | 'all';
  limit?: number;
}

// ============================================
// STATISTICS TYPES
// ============================================

export interface DossierStatistics {
  total_dossiers: number;
  dossiers_en_cours: number;
  dossiers_resolus: number;
  dossiers_suspendus: number;
  taux_resolution: number; // percentage

  par_urgence: Record<NiveauUrgence, number>;
  par_type: Record<TypeDisparition, number>;
  par_region: Record<string, number>;
  par_statut: Record<StatutDossier, number>;

  dossiers_ouverts_depuis_jours: {
    moins_24h: number;
    moins_7j: number;
    moins_30j: number;
    plus_30j: number;
  };

  urgence_distribution: {
    critique: number;
    haute: number;
    normal: number;
    faible: number;
  };

  localisation_distribution: {
    localise: number;
    zone_recherche: number;
    inconnu: number;
  };
}

export interface DossierTimelineEntry {
  id: string;
  type: 'creation' | 'modification' | 'signalement' | 'alerte' | 'resolution';
  titre: string;
  description: string;
  date: string;
  data_change?: any;
  utilisateur?: string;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface DossierNotification {
  type: 'creation' | 'modification' | 'resolution' | 'urgent_alert';
  dossierId: string;
  numero_dossier: string;
  titre: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ============================================
// ACTION TYPES
// ============================================

export interface DossierAction {
  id?: string;
  dossierId: string;
  type:
    | 'update_status'
    | 'assign_investigator'
    | 'change_priority'
    | 'add_evidence'
    | 'update_location'
    | 'mark_resolved';
  description: string;
  data: any;
  createdBy: string;
  createdAt?: string;
}

// ============================================
// MODAL & UI STATE TYPES
// ============================================

export interface DossierModal {
  isOpen: boolean;
  type: 'create' | 'edit' | 'view' | 'delete' | 'assign' | 'resolve';
  dossierId?: string;
  data?: Partial<DossierFormValues>;
}

export interface DossierUIState {
  selectedDossierId?: string;
  selectedDossiers: string[];
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  modal: DossierModal;
  filterOpen: boolean;
  viewType: 'list' | 'map' | 'grid';
  currentPage: number;
  pageSize: number;
}

// ============================================
// REDUX STATE TYPE
// ============================================

export interface DossierStoreState {
  dossiers: DossierDisplayData[];
  selectedDossier: DossierDisplayData | null;
  loading: boolean;
  error: string | null;
  fieldErrors: DossierValidationErrors;

  // Pagination & Filtering
  filters: DossierFilterCriteria;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;

  // Sorting
  sortBy: 'date' | 'urgence' | 'signalements' | 'vues';
  sortOrder: 'asc' | 'desc';

  // Selection
  selectedDossierIds: string[];

  // Statistics
  statistics: DossierStatistics | null;
  statistics_loading: boolean;

  // States
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isProcessingAction: boolean;
  modal: DossierModal;

  // Recent data
  recentDossiers: DossierDisplayData[];
  urgentDossiers: DossierDisplayData[];
}

// ============================================
// HOOK RETURN TYPES
// ============================================

export interface UseDossiersReturn {
  // Data
  dossiers: DossierDisplayData[];
  selectedDossier: DossierDisplayData | null;
  isLoading: boolean;
  error: string | null;

  // Pagination
  currentPage: number;
  totalPages: number;
  totalCount: number;

  // Methods
  fetchDossiers: (filters?: DossierFilterCriteria) => Promise<void>;
  fetchDossierById: (id: string) => Promise<void>;
  setFilters: (filters: DossierFilterCriteria) => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSortBy: (field: 'date' | 'urgence' | 'signalements' | 'vues') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

export interface UseDossierCreateReturn {
  formData: Partial<DossierFormValues>;
  errors: DossierValidationErrors;
  isSubmitting: boolean;
  createdDossier: DossierDisplayData | null;

  setFieldValue: (field: keyof DossierFormValues, value: any) => void;
  submitForm: () => Promise<DossierDisplayData>;
  resetForm: () => void;
  validateField: (field: keyof DossierFormValues) => boolean;
  validateForm: () => boolean;
}

export interface UseDossierUpdateReturn {
  isUpdating: boolean;
  error: string | null;
  updatedDossier: DossierDisplayData | null;

  updateStatus: (dossierId: string, newStatus: StatutDossier) => Promise<void>;
  updatePriority: (dossierId: string, priority: NiveauUrgence) => Promise<void>;
  updateInvestigator: (dossierId: string, investigatorId: string) => Promise<void>;
  updateLocation: (dossierId: string, lat: number, lng: number) => Promise<void>;
  updateDossier: (dossierId: string, data: DossierUpdateInput) => Promise<void>;
}

export interface UseDossierDeleteReturn {
  isDeleting: boolean;
  error: string | null;

  deleteDossier: (dossierId: string) => Promise<void>;
  deleteMultiple: (dossierIds: string[]) => Promise<void>;
}

export interface UseDossierDetailReturn {
  dossier: DossierDisplayData | null;
  isLoading: boolean;
  error: string | null;

  fetchDossier: (dossierId: string) => Promise<void>;
  refreshDossier: () => Promise<void>;
}

export interface UseDossierActionsReturn {
  actions: DossierAction[];
  isLoading: boolean;
  error: string | null;

  fetchActions: (dossierId: string) => Promise<void>;
  performAction: (action: DossierAction) => Promise<void>;
}

// ============================================
// COMPUTED STATISTICS TYPES
// ============================================

export interface DossierTrend {
  date: string;
  total: number;
  resolus: number;
  en_cours: number;
}

export interface LocationHeatmap {
  region: string;
  ville: string;
  count: number;
  coordinates: [number, number];
}

export interface PriorityQueue {
  dossierId: string;
  numero: string;
  urgence: NiveauUrgence;
  jours_ecoules: number;
  signalements: number;
  score: number;
}
