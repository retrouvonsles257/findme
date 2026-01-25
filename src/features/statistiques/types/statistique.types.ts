/**
 * =====================================================
 * RETROUVONSLES - Statistique Types
 * Type definitions for statistics feature
 * =====================================================
 */

// ============================================
// CORE STATISTICS INTERFACES
// ============================================

export interface Statistique {
  id: string;
  date: string;
  type: 'global' | 'regional' | 'temporal';
  
  // Global stats
  total_personnes?: number;
  total_dossiers?: number;
  total_signalements?: number;
  total_alertes?: number;
  
  // Resolution stats
  personnes_retrouvees?: number;
  personnes_decedees?: number;
  taux_resolution?: number; // percentage 0-100
  
  // Geographic distribution
  region?: string;
  nombre_cas_region?: number;
  taux_resolution_region?: number;
  
  // Demographics
  tranche_age_principale?: string;
  sexe_principal?: string;
  
  // Time metrics
  temps_moyen_resolution_jours?: number;
  temps_min_resolution_jours?: number;
  temps_max_resolution_jours?: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StatistiquesGlobales {
  total_personnes: number;
  total_dossiers: number;
  total_signalements: number;
  total_alertes: number;
  personnes_retrouvees: number;
  personnes_decedees: number;
  taux_resolution_global: number; // 0-100
  cas_en_cours: number;
  regions_couvertes: number;
  dernier_maj: string;
}

export interface StatistiquesRegionales {
  region: string;
  nombre_cas: number;
  nombre_retrouves: number;
  nombre_decedes: number;
  taux_resolution: number; // 0-100
  temps_moyen_resolution: number; // days
}

export interface TendanceTemporelle {
  date: string;
  jour: string; // 'Monday', 'Tuesday', etc.
  semaine: number;
  mois: string;
  annee: number;
  cas_nouveaux: number;
  cas_resolus: number;
  taux_resolution_periode: number;
}

export interface DemographieStats {
  tranche_age: string; // '0-18', '18-30', '30-60', '60+', 'Unknown'
  sexe: string; // 'M', 'F', 'Unknown'
  nombre_cas: number;
  nombre_retrouves: number;
  taux_resolution: number;
}

export interface DistributionType {
  type: string; // 'volontaire', 'accident', 'enlèvement', 'autre'
  nombre_cas: number;
  nombre_retrouves: number;
  taux_resolution: number;
  temps_moyen_resolution: number;
}

export interface DateRangeStats {
  date_debut: string; // ISO format
  date_fin: string;
  nombre_jours: number;
  cas_total: number;
  cas_resolus: number;
  taux_resolution: number;
}

export interface StatistiquesExport {
  nom_fichier: string;
  type: 'csv' | 'json' | 'pdf' | 'xlsx';
  date_export: string;
  donnees: {
    globales: StatistiquesGlobales;
    regionales: StatistiquesRegionales[];
    tendances: TendanceTemporelle[];
    demographics: DemographieStats[];
  };
}

// ============================================
// API FILTER & PAYLOAD TYPES
// ============================================

export interface StatistiquesFilter {
  date_debut?: string;
  date_fin?: string;
  region?: string;
  type_cas?: string;
  grouper_par?: 'jour' | 'semaine' | 'mois' | 'region' | 'age' | 'sexe';
}

export interface StatistiquesState {
  // Data
  stats_globales: StatistiquesGlobales | null;
  stats_regionales: StatistiquesRegionales[];
  tendances: TendanceTemporelle[];
  demographics: DemographieStats[];
  distributions: DistributionType[];
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Filters
  current_filter: StatistiquesFilter;
  date_range: {
    debut: string;
    fin: string;
  };
  
  // Pagination
  selected_region?: string;
  selected_period?: string;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface DashboardProps {
  date_debut?: string;
  date_fin?: string;
  region?: string;
}

export interface StatFilterProps {
  onFilterChange: (filter: StatistiquesFilter) => void;
  initialFilter?: StatistiquesFilter;
}

export interface ResolutionRateProps {
  stats?: StatistiquesGlobales;
  isLoading?: boolean;
}

export interface StatsByRegionProps {
  stats?: StatistiquesRegionales[];
  isLoading?: boolean;
  onRegionSelect?: (region: string) => void;
}

export interface TrendsAnalysisProps {
  data?: TendanceTemporelle[];
  isLoading?: boolean;
}

export interface StatsExportProps {
  stats?: StatistiquesGlobales;
  onExport?: (format: 'csv' | 'json' | 'pdf' | 'xlsx') => void;
  isLoading?: boolean;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiStatistiquesResponse {
  success: boolean;
  data?: Statistique | Statistique[];
  error?: string;
  timestamp: string;
}

export interface DashboardMetrics {
  kpis: {
    total_personnes: number;
    total_dossiers: number;
    total_signalements: number;
    taux_resolution: number;
    tendance_resolution: 'up' | 'down' | 'stable'; // Compared to previous period
  };
  sparklines: {
    cas_7j: number[]; // Last 7 days
    resolution_7j: number[];
    alertes_7j: number[];
  };
}

// ============================================
// CALCULATION HELPER TYPES
// ============================================

export interface ResolutionMetrics {
  total_cas: number;
  cas_resolus: number;
  cas_en_cours: number;
  taux_resolution_pct: number;
  taux_resolution_formatte: string; // "85.5%"
}

export interface GeographicDistribution {
  region: string;
  latitude: number;
  longitude: number;
  cas_count: number;
  resolution_rate: number;
}

export interface TemporalTrend {
  periode: string; // "2024-01", "Lundi", etc.
  cas_nouveaux: number;
  cas_resolus: number;
  velocite: number; // resolution speed (jours)
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface AnalyticsEvent {
  event_type: 'dashboard_view' | 'export' | 'filter_applied';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CaseStatusDistribution {
  nouveau: number;
  en_cours: number;
  valide: number;
  rejete: number;
  ferme: number;
}

export interface MonthlyTrend {
  mois: string; // "Janvier", "Février", etc.
  annee: number;
  cas_debut_mois: number;
  cas_fin_mois: number;
  taux_resolution_cumule: number;
}
