/**
 * =====================================================
 * RETROUVONSLES - Alerte Service
 * Logique métier et transformations pour les alertes
 * =====================================================
 */

import type { Alerte } from '../../../@types/alertes.types';
import type { TypeAlerte, StatutAlerte } from '../../../@types/enums.types';
import { StatutAlerte as StatutAlerteEnum } from '../../../@types/enums.types';
import * as alerteAPI from './alerteAPI';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteFormData {
  titre: string;
  message: string;
  type_alerte: TypeAlerte;
  id_dossier: string;
  latitude_centre?: number;
  longitude_centre?: number;
  rayon_km?: number;
  date_expiration?: string;
  canaux_diffusion?: string[];
}

export interface AlerteDisplayData extends Alerte {
  temps_avant_expiration?: string;
  est_expiration_proche?: boolean;
  pourcentage_couverture?: number;
  priorite_affichage?: number;
}

export interface AlerteValidationErrors {
  titre?: string;
  message?: string;
  type_alerte?: string;
  id_dossier?: string;
  rayon_km?: string;
  date_expiration?: string;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valider les données d'une alerte
 */
export const validateAlerteForm = (data: AlerteFormData): AlerteValidationErrors => {
  const errors: AlerteValidationErrors = {};

  if (!data.titre || data.titre.trim().length === 0) {
    errors.titre = 'Le titre est requis';
  }
  if (data.titre && data.titre.length > 255) {
    errors.titre = 'Le titre ne peut pas dépasser 255 caractères';
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.message = 'Le message est requis';
  }
  if (data.message && data.message.length > 5000) {
    errors.message = 'Le message ne peut pas dépasser 5000 caractères';
  }

  if (!data.type_alerte) {
    errors.type_alerte = 'Le type d\'alerte est requis';
  }

  if (!data.id_dossier) {
    errors.id_dossier = 'Le dossier est requis';
  }

  if (data.rayon_km !== undefined) {
    if (data.rayon_km < 1 || data.rayon_km > 500) {
      errors.rayon_km = 'Le rayon doit être entre 1 et 500 km';
    }
  }

  if (data.date_expiration) {
    const expiration = new Date(data.date_expiration);
    if (expiration <= new Date()) {
      errors.date_expiration = 'La date d\'expiration doit être dans le futur';
    }
  }

  return errors;
};

// ============================================
// TRANSFORMATION & ENRICHMENT
// ============================================

/**
 * Enrichir les données d'affichage d'une alerte
 */
export const enrichAlerteForDisplay = (alerte: Alerte): AlerteDisplayData => {
  const now = new Date();
  const expiration = alerte.date_expiration ? new Date(alerte.date_expiration) : null;
  const tempsRestant = expiration ? expiration.getTime() - now.getTime() : null;

  let tempsAvantExpiration = '';
  if (tempsRestant && tempsRestant > 0) {
    const jours = Math.floor(tempsRestant / (1000 * 60 * 60 * 24));
    const heures = Math.floor((tempsRestant % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((tempsRestant % (1000 * 60 * 60)) / (1000 * 60));

    if (jours > 0) tempsAvantExpiration = `${jours}j ${heures}h`;
    else if (heures > 0) tempsAvantExpiration = `${heures}h ${minutes}m`;
    else tempsAvantExpiration = `${minutes}m`;
  }

  let prioriteAffichage = 1;
  if (alerte.type_alerte === 'amber_alert') prioriteAffichage = 10;
  else if (alerte.type_alerte === 'disparition_enfant') prioriteAffichage = 9;
  else if (alerte.type_alerte === 'disparition_adulte_vulnerable') prioriteAffichage = 8;

  if (alerte.statut_alerte === 'en_cours') prioriteAffichage += 5;

  const pourcentageCouverture = alerte.nombre_destinataires
    ? ((alerte.nombre_envois_reussis || 0) / (alerte.nombre_destinataires || 1)) * 100
    : 0;

  return {
    ...alerte,
    temps_avant_expiration: tempsAvantExpiration,
    est_expiration_proche: tempsRestant ? tempsRestant < 3600000 : false, // < 1h
    pourcentage_couverture: Math.round(pourcentageCouverture),
    priorite_affichage: prioriteAffichage,
  };
};

/**
 * Convertir les données de formulaire en entrée API
 */
export const formDataToAlertInput = (
  formData: AlerteFormData,
): alerteAPI.AlerteCreateInput => {
  return {
    titre: formData.titre,
    message: formData.message,
    type_alerte: formData.type_alerte,
    id_dossier: formData.id_dossier,
    latitude_centre: formData.latitude_centre,
    longitude_centre: formData.longitude_centre,
    rayon_km: formData.rayon_km || 50,
    date_expiration: formData.date_expiration,
    canaux_diffusion: formData.canaux_diffusion || ['push', 'in_app'],
  };
};

// ============================================
// BUSINESS LOGIC
// ============================================

/**
 * Créer et diffuser une alerte immédiatement
 */
export const createAndBroadcastAlerte = async (
  formData: AlerteFormData,
): Promise<Alerte> => {
  // Valider
  const errors = validateAlerteForm(formData);
  if (Object.keys(errors).length > 0) {
    throw new Error(`Validation échouée: ${JSON.stringify(errors)}`);
  }

  // Créer
  const alertInput = formDataToAlertInput(formData);
  const alerte = await alerteAPI.createAlerte(alertInput);

  // Diffuser
  if (formData.canaux_diffusion && formData.canaux_diffusion.length > 0) {
    await alerteAPI.diffuserAlerte(alerte.id, formData.canaux_diffusion);
    await alerteAPI.updateAlerteStatut(alerte.id, StatutAlerteEnum.EN_COURS);
  }

  return alerte;
};

/**
 * Créer une alerte en brouillon pour édition ultérieure
 */
export const createDraftAlerte = async (
  formData: AlerteFormData,
): Promise<Alerte> => {
  const errors = validateAlerteForm(formData);
  if (Object.keys(errors).length > 0) {
    throw new Error(`Validation échouée: ${JSON.stringify(errors)}`);
  }

  const alertInput = formDataToAlertInput(formData);
  return alerteAPI.createAlerte(alertInput);
};

/**
 * Publier une alerte en brouillon
 */
export const publishDraftAlerte = async (
  alerteId: string,
  canaux?: string[],
): Promise<Alerte> => {
  const alerte = await alerteAPI.getAlerteById(alerteId);

  if (alerte.statut_alerte !== StatutAlerteEnum.BROUILLON) {
    throw new Error('Seules les alertes en brouillon peuvent être publiées');
  }

  await alerteAPI.diffuserAlerte(alerteId, canaux);
  return alerteAPI.updateAlerteStatut(alerteId, StatutAlerteEnum.EN_COURS);
};

/**
 * Obtenir les alertes filtrées et enrichies
 */
export const getAlertesList = async (
  filters?: alerteAPI.AlerteFilters,
): Promise<AlerteDisplayData[]> => {
  const alertes = await alerteAPI.getAlertes(filters);
  return alertes.map((a) => enrichAlerteForDisplay(a));
};

/**
 * Obtenir les alertes actives pertinentes pour une localisation
 */
export const getRelevantAlertes = async (
  latitude: number,
  longitude: number,
): Promise<AlerteDisplayData[]> => {
  const alertes = await alerteAPI.getActivAlertesByZone(latitude, longitude, 50);
  return alertes
    .map((a) => enrichAlerteForDisplay(a))
    .sort((a, b) => (b.priorite_affichage || 0) - (a.priorite_affichage || 0));
};

/**
 * Clôturer une alerte (personne retrouvée)
 */
export const closeAlerte = async (
  alerteId: string,
  motif: string = 'Personne retrouvée',
): Promise<Alerte> => {
  return alerteAPI.updateAlerteStatut(alerteId, StatutAlerteEnum.TERMINEE, motif);
};

/**
 * Annuler une alerte
 */
export const abortAlerte = async (alerteId: string, motif: string): Promise<Alerte> => {
  return alerteAPI.cancelAlerte(alerteId, motif);
};

// ============================================
// STATISTICS & ANALYTICS
// ============================================

/**
 * Obtenir les statistiques détaillées des alertes
 */
export const getDetailedStats = async () => {
  const stats = await alerteAPI.getAlerteStats();
  const tauxSucces = stats.total > 0 ? (stats.active / stats.total) * 100 : 0;

  return {
    ...stats,
    tauxSucces: Math.round(tauxSucces),
    tauxDisponibilite: 99.5, // SLA fixe
  };
};

/**
 * Obtenir les alertes par type
 */
export const getAlertesByType = async (type: TypeAlerte): Promise<AlerteDisplayData[]> => {
  const alertes = await alerteAPI.getAlertes({ type_alerte: [type] });
  return alertes.map((a) => enrichAlerteForDisplay(a));
};

/**
 * Obtenir les alertes par statut
 */
export const getAlertesByStatut = async (statut: StatutAlerte): Promise<AlerteDisplayData[]> => {
  const alertes = await alerteAPI.getAlertes({ statut: [statut] });
  return alertes.map((a) => enrichAlerteForDisplay(a));
};
