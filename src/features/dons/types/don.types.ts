/**
 * =====================================================
 * RETROUVONSLES - Dons Types
 * Types spécifiques pour la feature dons
 * =====================================================
 */

import type { Don, TypeDon, MethodePaiement, StatutPaiement } from '../../../@types';

// ============================================
// DON DISPLAY & FORM TYPES
// ============================================

export interface DonFormValues {
  montant: number;
  devise: string;
  type_don: TypeDon;
  methode_paiement: MethodePaiement;
  donateur_anonyme: boolean;
  nom_donateur?: string;
  email_donateur?: string;
  telephone_donateur?: string;
  organisation_donatrice?: string;
  message_donateur?: string;
}

export interface DonDisplayData extends Don {
  montant_formate?: string;
  statut_label?: string;
  date_relative?: string;
  est_recent?: boolean;
}

export interface DonValidationErrors {
  montant?: string;
  devise?: string;
  type_don?: string;
  methode_paiement?: string;
  nom_donateur?: string;
  email_donateur?: string;
  telephone_donateur?: string;
}

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentMethod {
  id: MethodePaiement;
  label: string;
  description: string;
  icon?: string;
  isActive: boolean;
}

export interface PaymentConfig {
  methods: PaymentMethod[];
  supportedCurrencies: string[];
  minAmount: number;
  maxAmount: number;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  reference: string;
  message?: string;
}

// ============================================
// DONATION STATISTICS
// ============================================

export interface DonStatistics {
  total_dons: number;
  montant_total: number;
  montant_moyen: number;
  nombre_donateurs_uniques: number;
  dons_par_type: Record<TypeDon, number>;
  dons_par_methode: Record<MethodePaiement, number>;
  montant_par_type: Record<TypeDon, number>;
  taux_succes_paiement: number;
  derniere_donation?: Date;
}

export interface DonationTrend {
  periode: string;
  montant: number;
  nombre_dons: number;
  nombre_donateurs: number;
}

// ============================================
// STORE STATE TYPES
// ============================================

export interface DonStoreState {
  // Current list
  dons: Don[];
  filteredDons: Don[];

  // Selected
  selectedDon: Don | null;
  selectedDons: string[];

  // Pagination
  currentPage: number;
  pageSize: number;
  total: number;

  // Filters
  filters: DonFilterCriteria;

  // Statistics
  statistics: DonStatistics | null;

  // UI States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isProcessingPayment: boolean;

  // Errors
  error: string | null;
  errors: Record<string, string>;

  // Sorting
  sortBy: 'date' | 'montant' | 'statut' | 'type';
  sortOrder: 'asc' | 'desc';
}

export interface DonFilterCriteria {
  statut?: StatutPaiement[];
  type_don?: TypeDon[];
  search?: string;
  date_from?: string;
  date_to?: string;
  montant_min?: number;
  montant_max?: number;
  methode_paiement?: MethodePaiement[];
}

export interface DonAction {
  type: string;
  payload?: any;
}

// ============================================
// UI STATE TYPES
// ============================================

export interface DonNotification {
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

export interface DonModal {
  isOpen: boolean;
  type?: 'create' | 'success' | 'receipt' | 'recurring';
  data?: any;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface DonationReceipt {
  id: string;
  numeroReceipt: string;
  donId: string;
  montant: number;
  devise: string;
  date: string;
  donateur: string;
  organization: string;
  description: string;
  taxDeductible: boolean;
  taxNumber?: string;
}

export interface RecurringDonationConfig {
  type: TypeDon;
  montant: number;
  devise: string;
  methode_paiement: MethodePaiement;
  date_debut: string;
  date_fin?: string;
  nom_donateur: string;
  email_donateur: string;
}
