/**
 * =====================================================
 * RETROUVONSLES - Don Service
 * Logique métier et transformations pour les dons
 * =====================================================
 */

import type { Don, TypeDon } from '../../../@types';
import * as donAPI from './donAPI';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface DonFormData {
  montant: number;
  devise: string;
  type_don: TypeDon;
  methode_paiement: string;
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
// VALIDATION
// ============================================

/**
 * Valider les données d'un don
 */
export const validateDonForm = (data: DonFormData): DonValidationErrors => {
  const errors: DonValidationErrors = {};

  if (!data.montant || data.montant <= 0) {
    errors.montant = 'Le montant doit être supérieur à 0';
  }
  if (data.montant && data.montant > 1000000) {
    errors.montant = 'Le montant ne peut pas dépasser 1 000 000';
  }

  if (!data.devise || data.devise.trim().length === 0) {
    errors.devise = 'La devise est requise';
  }

  if (!data.type_don) {
    errors.type_don = 'Le type de don est requis';
  }

  if (!data.methode_paiement) {
    errors.methode_paiement = 'La méthode de paiement est requise';
  }

  if (!data.donateur_anonyme && !data.nom_donateur) {
    errors.nom_donateur = 'Le nom du donateur est requis (ou cocher anonyme)';
  }

  if (data.email_donateur && !isValidEmail(data.email_donateur)) {
    errors.email_donateur = 'L\'adresse email n\'est pas valide';
  }

  if (data.telephone_donateur && !isValidPhoneNumber(data.telephone_donateur)) {
    errors.telephone_donateur = 'Le numéro de téléphone n\'est pas valide';
  }

  return errors;
};

/**
 * Valider un email
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valider un numéro de téléphone
 */
const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
};

// ============================================
// TRANSFORMATION & ENRICHMENT
// ============================================

/**
 * Enrichir les données d'affichage d'un don
 */
export const enrichDonForDisplay = (don: Don): DonDisplayData => {
  const now = new Date();
  const donDate = new Date(don.date_don);
  const diffMs = now.getTime() - donDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return {
    ...don,
    montant_formate: formatCurrency(don.montant, don.devise),
    statut_label: getStatusLabel(don.statut_paiement),
    date_relative: getRelativeDate(diffDays, diffHours),
    est_recent: diffDays < 7,
  };
};

/**
 * Enrichir une liste de dons
 */
export const enrichDonsForDisplay = (dons: Don[]): DonDisplayData[] => {
  return dons.map(enrichDonForDisplay);
};

/**
 * Formater une valeur monétaire
 */
export const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: currency || 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
};

/**
 * Obtenir le label du statut
 */
export const getStatusLabel = (statut: string): string => {
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    reussi: 'Réussi',
    echoue: 'Échoué',
    rembourse: 'Remboursé',
    annule: 'Annulé',
  };
  return labels[statut] || statut;
};

/**
 * Obtenir la date relative
 */
export const getRelativeDate = (days: number, hours: number): string => {
  if (hours < 1) {
    return 'À l\'instant';
  }
  if (hours < 24) {
    return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  }
  if (days < 7) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }
  const months = Math.floor(days / 30);
  return `Il y a ${months} mois`;
};

// ============================================
// BUSINESS LOGIC
// ============================================

/**
 * Créer un don brouillon (validation seule)
 */
export const createDraftDon = async (formData: DonFormData): Promise<Don> => {
  const errors = validateDonForm(formData);
  if (Object.keys(errors).length > 0) {
    throw new Error('Validation failed: ' + JSON.stringify(errors));
  }

  return donAPI.createDon({
    montant: formData.montant,
    devise: formData.devise,
    type_don: formData.type_don,
    methode_paiement: formData.methode_paiement as any,
    donateur_anonyme: formData.donateur_anonyme,
    nom_donateur: formData.nom_donateur,
    email_donateur: formData.email_donateur,
    telephone_donateur: formData.telephone_donateur,
    organisation_donatrice: formData.organisation_donatrice,
    message_donateur: formData.message_donateur,
  });
};

/**
 * Créer et traiter un don immédiatement
 */
export const createAndProcessDon = async (formData: DonFormData): Promise<Don> => {
  const don = await createDraftDon(formData);
  return donAPI.updateDonPaymentStatus(don.id, 'reussi' as any);
};

/**
 * Récupérer la liste des dons avec enrichissement
 */
export const getDonsList = async (
  filters?: donAPI.DonFilters,
): Promise<DonDisplayData[]> => {
  const dons = await donAPI.getDons(filters);
  return enrichDonsForDisplay(dons);
};

/**
 * Récupérer un don avec enrichissement
 */
export const getDonWithDetails = async (id: string): Promise<DonDisplayData> => {
  const don = await donAPI.getDonById(id);
  return enrichDonForDisplay(don);
};

/**
 * Obtenir le reçu fiscal d'un don
 */
export const getDonReceipt = async (donId: string): Promise<{
  numero: string;
  date: string;
  montant: string;
} | null> => {
  const don = await donAPI.getDonById(donId);
  
  if (!don.recu_fiscal_genere || !don.numero_recu) {
    return null;
  }

  return {
    numero: don.numero_recu,
    date: new Date(don.date_don).toLocaleDateString('fr-CM'),
    montant: formatCurrency(don.montant, don.devise),
  };
};

/**
 * Obtenir les dons récents avec enrichissement
 */
export const getRecentDonsForDisplay = async (limit?: number): Promise<DonDisplayData[]> => {
  const dons = await donAPI.getRecentDons(limit);
  return enrichDonsForDisplay(dons);
};

/**
 * Obtenir l'historique des dons d'un donateur
 */
export const getDonorDonationHistory = async (
  email: string,
): Promise<DonDisplayData[]> => {
  const dons = await donAPI.getDonationHistory(email);
  return enrichDonsForDisplay(dons);
};
