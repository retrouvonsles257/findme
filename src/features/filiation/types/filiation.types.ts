/**
 * =====================================================
 * RETROUVONSLES - Filiation Types
 * Types et interfaces pour la gestion des liens de filiation
 * =====================================================
 */

import type {
  TypeLienFiliation,
  NatureFiliation,
  StatutVerification,
  TypePreuve,
  AutoriteParentale,
  FiabiliteInformations,
} from '../../../@types/enums.types';

// ============================================
// DATABASE TYPES
// ============================================

export interface FiliationLienDatabase {
  id: string;
  type_lien: TypeLienFiliation;
  id_personne_source: string;
  id_personne_cible: string;
  precision_lien?: string;
  nature_filiation: NatureFiliation;
  compatibilite_genetique_probable?: boolean;
  score_compatibilite_physique?: number;
  caracteristiques_communes?: Record<string, any>;
  donnees_genetiques_disponibles: boolean;
  hash_adn_source?: string;
  hash_adn_cible?: string;
  statut_verification: StatutVerification;
  type_preuve: TypePreuve;
  document_justificatif?: string;
  numero_acte_officiel?: string;
  autorite_emettrice?: string;
  date_etablissement_lien?: string;
  autorite_parentale?: AutoriteParentale;
  situation_familiale?: string;
  generation: number;
  ligne_directe: boolean;
  personne_contact_principal: boolean;
  telephone_contact?: string;
  email_contact?: string;
  adresse_contact?: string;
  cree_par?: string;
  modifie_par?: string;
  source_information?: string;
  commentaire?: string;
  confidentiel: boolean;
  visible_public: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================
// FORM & APPLICATION TYPES
// ============================================

export interface FiliationLienInput {
  type_lien: TypeLienFiliation;
  id_personne_source: string;
  id_personne_cible: string;
  precision_lien?: string;
  nature_filiation: NatureFiliation;
  statut_verification: StatutVerification;
  type_preuve: TypePreuve;
  score_compatibilite_physique?: number;
  autorite_parentale?: AutoriteParentale;
  date_etablissement_lien?: string;
  document_justificatif?: string;
  commentaire?: string;
  confidentiel?: boolean;
  visible_public?: boolean;
  /**
   * Traçabilité (RLS): qui a créé/modifié le lien.
   * Le schéma SQL contient ces colonnes (`cree_par`, `modifie_par`).
   */
  cree_par?: string;
  modifie_par?: string;
}

export interface FiliationLienUpdate extends Partial<FiliationLienInput> {
  caracteristiques_communes?: Record<string, any>;
  hash_adn_source?: string;
  hash_adn_cible?: string;
}

// ============================================
// TREE & NODE TYPES
// ============================================

export interface FiliationNode {
  id: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  sexe?: string;
  photo?: string;
  statut: 'vivant' | 'decede' | 'inconnu';
  generation: number;
  lienAvecSource?: TypeLienFiliation;
  enfants: FiliationNode[];
  parent?: FiliationNode;
  dateDisparition?: string;
  statusDossier?: string;
}

export interface FiliationTree {
  racine: FiliationNode;
  totalPersonnes: number;
  generations: number;
  liens: FiliationLienDisplay[];
}

export interface FiliationLienDisplay extends FiliationLienDatabase {
  personneSouceNom?: string;
  personneSourcePrenom?: string;
  personneCibleNom?: string;
  personneCiblePrenom?: string;
  personneCibleDateNaissance?: string;
  personneCibleSexe?: string;
}

// ============================================
// MATCHING & VERIFICATION
// ============================================

export interface FiliationMatch {
  id: string;
  idPersonne1: string;
  idPersonne2: string;
  scoreCompatibilite: number;
  typeMatch: TypeLienFiliation[];
  caracteristiquesCommunes: string[];
  fiabilite: FiabiliteInformations;
  statut: StatutVerification;
  dateAnalyse: string;
  resultatsIA?: Record<string, any>;
}

export interface FiliationVerification {
  id: string;
  idLien: string;
  statut: StatutVerification;
  dateVerification: string;
  verifiePar: string;
  typesPreuves: TypePreuve[];
  documentsJustificatifs: string[];
  resultADN?: {
    compatible: boolean;
    probabilite: number;
  };
  notes?: string;
}

// ============================================
// STATISTICS
// ============================================

export interface FiliationStatistics {
  totalLiens: number;
  liensVerifies: number;
  liensEnVerification: number;
  tauxVerification: number;
  liaisons_biologiques: number;
  liaisons_adoptives: number;
  liaisons_par_alliance: number;
  distributionParType: Record<TypeLienFiliation, number>;
  distributionParStatut: Record<StatutVerification, number>;
  generationsMax: number;
}

// ============================================
// REDUX STATE
// ============================================

export interface FiliationState {
  liens: FiliationLienDisplay[];
  loading: boolean;
  error: string | null;
  currentTree: FiliationTree | null;
  statistiques: FiliationStatistics | null;
  selectedLien: FiliationLienDisplay | null;
  filters: {
    typeVerification?: StatutVerification;
    typeLien?: TypeLienFiliation;
    natureFiliation?: NatureFiliation;
    searchTerm?: string;
  };
}

// ============================================
// FORM VALIDATION
// ============================================

export interface FiliationFormErrors {
  type_lien?: string;
  id_personne_source?: string;
  id_personne_cible?: string;
  nature_filiation?: string;
  statut_verification?: string;
  type_preuve?: string;
}
