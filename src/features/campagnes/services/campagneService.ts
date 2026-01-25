/**
 * =====================================================
 * RETROUVONSLES - Campagne Service
 * Logique métier pour les campagnes
 * =====================================================
 */

import * as campagneAPI from './campagneAPI';
import type {
  CampagneSensibilisation,
  UUID,
} from '../../../@types';
import {
  TypeCampagne,
  StatutCampagne,
} from '../../../@types/enums.types';
import type {
  CampagneWithRelations,
  CampagneFilterCriteria,
  CampagneCreatePayload,
  CampagneUpdatePayload,
  CampagneStatistics,
  CampagneImpact,
} from '../types';

// ============================================
// CAMPAGNE MANAGEMENT
// ============================================

/**
 * Service complet pour la gestion des campagnes
 */
export const campagneService = {
  /**
   * Récupère la liste des campagnes
   */
  async getCampagnes(
    page: number = 1,
    pageSize: number = 10,
    filters?: CampagneFilterCriteria,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    return campagneAPI.getCampagnes(page, pageSize, filters, sortBy, sortOrder);
  },

  /**
   * Récupère une campagne par ID
   */
  async getCampagneById(id: UUID) {
    return campagneAPI.getCampagneById(id);
  },

  /**
   * Récupère les campagnes d'une organisation
   */
  async getCampagnesByOrganisation(organisationId: UUID, pageSize?: number) {
    return campagneAPI.getCampagnesByOrganisation(organisationId, pageSize);
  },

  /**
   * Crée une nouvelle campagne
   */
  async createCampagne(payload: CampagneCreatePayload) {
    return campagneAPI.createCampagne(payload);
  },

  /**
   * Met à jour une campagne
   */
  async updateCampagne(id: UUID, payload: CampagneUpdatePayload) {
    return campagneAPI.updateCampagne(id, payload);
  },

  /**
   * Change le statut d'une campagne
   */
  async changeCampagneStatus(id: UUID, statut: StatutCampagne) {
    return campagneAPI.updateCampagneStatus(id, statut);
  },

  /**
   * Met à jour le budget d'une campagne
   */
  async updateBudget(id: UUID, budgetAlloue?: number, budgetDepense?: number) {
    return campagneAPI.updateCampagneBudget(id, budgetAlloue, budgetDepense);
  },

  /**
   * Met à jour les statistiques
   */
  async updateStatistics(id: UUID, personnesTouchees?: number, interactions?: number) {
    return campagneAPI.updateCampagneStatistics(id, personnesTouchees, interactions);
  },

  /**
   * Supprime une campagne
   */
  async deleteCampagne(id: UUID) {
    return campagneAPI.deleteCampagne(id);
  },

  /**
   * Supprime plusieurs campagnes
   */
  async deleteCampagnes(ids: UUID[]) {
    return campagneAPI.deleteCampagnes(ids);
  },
};

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Calcule les statistiques des campagnes
 */
export const calculateCampagneStatistics = (
  campagnes: CampagneSensibilisation[],
): CampagneStatistics => {
  const statistics: CampagneStatistics = {
    totalCampagnes: campagnes.length,
    campagnesActives: campagnes.filter((c) => c.statut_campagne === 'en_cours').length,
    campagnesTerminees: campagnes.filter((c) => c.statut_campagne === 'terminee').length,
    budgetTotal: campagnes.reduce((sum, c) => sum + (c.budget_alloue || 0), 0),
    budgetDepense: campagnes.reduce((sum, c) => sum + (c.budget_depense || 0), 0),
    personnesTouchees: campagnes.reduce((sum, c) => sum + (c.nombre_personnes_touchees || 0), 0),
    tauxEngagement: 0,
    campagneParType: {} as Record<TypeCampagne, number>,
    campagneParStatut: {} as Record<StatutCampagne, number>,
  };

  // Calculate type breakdown
  campagnes.forEach((c) => {
    statistics.campagneParType[c.type_campagne] =
      (statistics.campagneParType[c.type_campagne] || 0) + 1;
  });

  // Calculate status breakdown
  campagnes.forEach((c) => {
    statistics.campagneParStatut[c.statut_campagne] =
      (statistics.campagneParStatut[c.statut_campagne] || 0) + 1;
  });

  // Calculate engagement rate
  const totalInteractions = campagnes.reduce((sum, c) => sum + (c.nombre_interactions || 0), 0);
  if (statistics.personnesTouchees > 0) {
    statistics.tauxEngagement = (totalInteractions / statistics.personnesTouchees) * 100;
  }

  return statistics;
};

/**
 * Calcule l'impact d'une campagne
 */
export const calculateCampagneImpact = (
  campagne: CampagneWithRelations,
): CampagneImpact => {
  const totalPersonnes = campagne.nombre_personnes_touchees || 0;
  const totalInteractions = campagne.nombre_interactions || 0;

  const impact: CampagneImpact = {
    campagneId: campagne.id,
    personnesDirectes: totalPersonnes,
    personnesIndirectes: Math.floor(totalPersonnes * 0.3), // Estimation
    tauxEngagement:
      totalPersonnes > 0 ? ((totalInteractions / totalPersonnes) * 100) : 0,
    nombreInteractions: totalInteractions,
    canaux: {},
  };

  // Extract channel data if available
  if (campagne.canaux_diffusion && typeof campagne.canaux_diffusion === 'object') {
    const channels = campagne.canaux_diffusion as Record<string, number>;
    impact.canaux = channels;
  }

  return impact;
};

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Valide les dates d'une campagne
 */
export const validateCampagneDates = (dateDebut: string, dateFin?: string): boolean => {
  const debut = new Date(dateDebut);
  const fin = dateFin ? new Date(dateFin) : new Date();

  if (debut >= fin) {
    return false;
  }

  return true;
};

/**
 * Vérifie si une campagne peut être supprimée
 */
export const canDeleteCampagne = (campagne: CampagneSensibilisation): boolean => {
  const nonDeletableStatuses: StatutCampagne[] = [StatutCampagne.EN_COURS, StatutCampagne.TERMINEE];
  return !nonDeletableStatuses.includes(campagne.statut_campagne as StatutCampagne);
};

/**
 * Vérifie si une campagne peut être modifiée
 */
export const canEditCampagne = (campagne: CampagneSensibilisation): boolean => {
  const nonEditableStatuses: StatutCampagne[] = [StatutCampagne.TERMINEE, StatutCampagne.ANNULEE];
  return !nonEditableStatuses.includes(campagne.statut_campagne as StatutCampagne);
};

/**
 * Vérifie si une campagne peut être lancée
 */
export const canLaunchCampagne = (campagne: CampagneSensibilisation): boolean => {
  return (
    (campagne.statut_campagne as StatutCampagne) === StatutCampagne.PLANIFIEE &&
    Boolean(campagne.titre) &&
    Boolean(campagne.date_debut) &&
    Boolean(campagne.type_campagne)
  );
};

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Obtient le label du type de campagne
 */
export const getCampagneTypeLabel = (type: TypeCampagne): string => {
  const labels: Record<TypeCampagne, string> = {
    prevention_fugue: '🚷 Prévention Fugue',
    securite_enfants: '👶 Sécurité Enfants',
    vigilance_communautaire: '👥 Vigilance Communautaire',
    formation_premiers_secours: '🏥 Formation Premiers Secours',
    sensibilisation_generale: '📢 Sensibilisation Générale',
    collecte_fonds: '💰 Collecte Fonds',
    autre: '📋 Autre',
  };

  return labels[type] || type;
};

/**
 * Obtient le label du statut de campagne
 */
export const getCampagneStatusLabel = (statut: StatutCampagne): string => {
  const labels: Record<StatutCampagne, string> = {
    planifiee: '📅 Planifiée',
    en_cours: '🔄 En cours',
    terminee: '✅ Terminée',
    annulee: '❌ Annulée',
  };

  return labels[statut] || statut;
};

/**
 * Obtient la couleur du statut
 */
export const getCampagneStatusColor = (statut: StatutCampagne): string => {
  const colors: Record<StatutCampagne, string> = {
    planifiee: '#2196F3', // Blue
    en_cours: '#FF9800', // Orange
    terminee: '#4CAF50', // Green
    annulee: '#F44336', // Red
  };

  return colors[statut] || '#999';
};

/**
 * Formate le budget pour l'affichage
 */
export const formatBudget = (budget?: number): string => {
  if (!budget) return 'Non défini';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  }).format(budget);
};

/**
 * Calcule le pourcentage de budget dépensé
 */
export const calculateBudgetUtilization = (
  budgetAlloue?: number,
  budgetDepense?: number,
): number => {
  if (!budgetAlloue || budgetAlloue === 0) return 0;
  if (!budgetDepense) return 0;
  return (budgetDepense / budgetAlloue) * 100;
};
