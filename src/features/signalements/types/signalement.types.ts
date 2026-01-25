/**
 * =====================================================
 * RETROUVONSLES - Signalement Types
 * Type definitions for signalements (reports/sightings)
 * =====================================================
 */

/**
 * Signalement - A report or sighting of a missing person
 * Corresponds to table 'signalement' in modele_donnee.sql
 */
export interface Signalement {
  id: string;
  numero_signalement?: string;
  description: string;
  date_observation: Date | string;
  lieu_observation?: string;
  ville_observation?: string;
  region_observation?: string;
  pays_observation?: string;
  latitude_observation?: number;
  longitude_observation?: number;
  precision_localisation?: 'exacte' | 'approximative' | 'generale';
  niveau_certitude?: 'certain' | 'tres_probable' | 'probable' | 'incertain' | 'doute';
  contexte_observation?: string;
  etat_personne_observee?: string;
  statut_validation: 'en_attente' | 'en_verification' | 'valide' | 'invalide' | 'doublonne' | 'spam';
  priorite_traitement?: 'basse' | 'moyenne' | 'haute' | 'urgente';
  score_pertinence?: number;
  temoin_anonyme?: boolean;
  nom_temoin?: string;
  telephone_temoin?: string;
  email_temoin?: string;
  id_utilisateur?: string;
  id_dossier?: string;
  created_at: Date | string;
  updated_at: Date | string;
  // Legacy aliases for compatibility
  latitude?: number;
  longitude?: number;
  etat?: 'nouveau' | 'en_cours' | 'valide' | 'rejete' | 'ferme';
  score_correspondance?: number;
  photo_url?: string;
  notes?: string;
  contacts?: SignalementContact[];
  verifications?: SignalementVerification[];
}

/**
 * SignalementContact - Contact information for signalement
 */
export interface SignalementContact {
  id: string;
  signalement_id: string;
  nom: string;
  telephone?: string;
  email?: string;
  type_contact: 'temoin' | 'declarant' | 'observateur';
  fiabilite: 'haute' | 'moyenne' | 'basse';
}

/**
 * SignalementVerification - Verification status
 */
export interface SignalementVerification {
  id: string;
  signalement_id: string;
  verificateur_id: string;
  date_verification: Date | string;
  decision: 'approuve' | 'rejete' | 'besoin_clarification';
  raison: string;
  score_confiance: number;
  avis: string;
}

/**
 * SignalementFilter - Filter criteria
 */
export interface SignalementFilter {
  search?: string;
  etat?: 'nouveau' | 'en_cours' | 'valide' | 'rejete' | 'ferme';
  date_debut?: string;
  date_fin?: string;
  latitude?: number;
  longitude?: number;
  rayon_km?: number;
  score_min?: number;
  sortBy?: 'date_observation' | 'score_correspondance' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

/**
 * SignalementCreatePayload - Payload for creating signalement
 * Corresponds to table 'signalement' in modele_donnee.sql
 */
export interface SignalementCreatePayload {
  id_dossier?: string;
  description: string;
  lieu_observation?: string;
  ville_observation?: string;
  region_observation?: string;
  pays_observation?: string;
  latitude_observation?: number;
  longitude_observation?: number;
  date_observation: string;
  niveau_certitude?: 'certain' | 'tres_probable' | 'probable' | 'incertain' | 'doute';
  contexte_observation?: string;
  direction_deplacement?: string;
  source_signalement?: 'application_web' | 'application_mobile' | 'site_web' | 'telephone' | 'email' | 'autre';
  temoin_anonyme?: boolean;
  nom_temoin?: string;
  telephone_temoin?: string;
  email_temoin?: string;
}

/**
 * SignalementUpdatePayload - Payload for updating signalement
 */
export interface SignalementUpdatePayload {
  description?: string;
  lieu_observation?: string;
  latitude?: number;
  longitude?: number;
  date_observation?: string;
  heure_signalement?: string;
  photo_url?: string;
  etat?: 'nouveau' | 'en_cours' | 'valide' | 'rejete' | 'ferme';
  statut_validation?: 'en_attente' | 'en_verification' | 'valide' | 'invalide' | 'doublonne' | 'spam';
  notes?: string;
  score_correspondance?: number;
}

/**
 * SignalementValidationPayload - Payload for validation
 */
export interface SignalementValidationPayload {
  decision: 'approuve' | 'rejete' | 'besoin_clarification';
  raison: string;
  score_confiance: number;
  avis?: string;
}

/**
 * SignalementStats - Aggregated statistics
 */
export interface SignalementStats {
  total: number;
  parEtat: {
    nouveau: number;
    en_cours: number;
    valide: number;
    rejete: number;
    ferme: number;
  };
  parConfiance: {
    haute: number;
    moyenne: number;
    basse: number;
  };
  moyenneScore: number;
  derniers7jours: number;
}

/**
 * SignalementState - Redux state
 */
export interface SignalementState {
  signalements: Signalement[];
  selectedSignalement: Signalement | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
  stats: SignalementStats | null;
}
