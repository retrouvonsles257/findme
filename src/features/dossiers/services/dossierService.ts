/**
 * =====================================================
 * RETROUVONSLES - Dossier Business Logic Service
 * Validation, enrichment, and data transformation
 * =====================================================
 */

import type {
  DossierFormValues,
  DossierDisplayData,
  DossierValidationErrors,
} from '../types';
import type { DossierDisparition } from '../../../@types/database.types';
import { StatutDossier, NiveauUrgence, TypeDisparition } from '../../../@types/enums.types';
import * as dossierAPI from './dossierAPI';

// ============================================
// VALIDATION
// ============================================

export const validateDossierForm = (data: Partial<DossierFormValues>): DossierValidationErrors => {
  const errors: DossierValidationErrors = {};

  if (!data.date_disparition) {
    errors.date_disparition = 'Date de disparition requise';
  } else if (new Date(data.date_disparition) > new Date()) {
    errors.date_disparition = 'La date ne peut pas être dans le futur';
  }

  if (!data.type_disparition) {
    errors.type_disparition = 'Type de disparition requis';
  }

  if (!data.niveau_urgence) {
    errors.niveau_urgence = 'Niveau d\'urgence requis';
  }

  if (!data.circonstances || data.circonstances.trim().length < 10) {
    errors.circonstances = 'Circonstances requises (minimum 10 caractères)';
  }

  if (!data.lieu_disparition || data.lieu_disparition.trim().length === 0) {
    errors.lieu_disparition = 'Lieu requis';
  }

  if (!data.ville_disparition || data.ville_disparition.trim().length === 0) {
    errors.ville_disparition = 'Ville requise';
  }

  if (!data.region_disparition || data.region_disparition.trim().length === 0) {
    errors.region_disparition = 'Région requise';
  }

  if (!data.pays_disparition || data.pays_disparition.trim().length === 0) {
    errors.pays_disparition = 'Pays requis';
  }

  if (!data.precision_lieu) {
    errors.precision_lieu = 'Précision de localisation requise';
  }

  if (data.email_contact && !isValidEmail(data.email_contact)) {
    errors.email_contact = 'Email invalide';
  }

  if (data.telephone_contact && !isValidPhoneNumber(data.telephone_contact)) {
    errors.telephone_contact = 'Numéro de téléphone invalide';
  }

  return errors;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^[\d\s+\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 9;
};

// ============================================
// ENRICHMENT & TRANSFORMATION
// ============================================

export const enrichDossierForDisplay = (dossier: DossierDisparition): DossierDisplayData => {
  const now = new Date();
  const disappearanceDate = new Date(dossier.date_disparition);
  const daysSince = Math.floor(
    (now.getTime() - disappearanceDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  let progress = 0;
  if (dossier.statut_dossier === StatutDossier.RETROUVE_VIVANT || dossier.statut_dossier === StatutDossier.RETROUVE_DECEDE) {
    progress = 100;
  } else if (dossier.statut_dossier === StatutDossier.SUSPENDU) {
    progress = 50;
  } else if (daysSince > 30) {
    progress = Math.min(30, daysSince / 5);
  }

  return {
    ...dossier,
    statut_label: getStatusLabel(dossier.statut_dossier),
    type_label: getTypeLabel(dossier.type_disparition),
    urgence_label: getUrgencyLabel(dossier.niveau_urgence),
    precision_label: getPrecisionLabel(dossier.precision_lieu),
    etat_label: dossier.etat_personne_retrouvee
      ? getStateLabel(dossier.etat_personne_retrouvee)
      : undefined,
    jours_depuis_disparition: daysSince,
    is_recent: daysSince < 7,
    is_urgent: [NiveauUrgence.CRITIQUE, NiveauUrgence.URGENT].includes(dossier.niveau_urgence),
    progress_resolution: Math.min(100, progress),
    date_disparition_formatted: formatDate(dossier.date_disparition),
    date_resolution_formatted: dossier.date_resolution
      ? formatDate(dossier.date_resolution)
      : undefined,
    localisation_display: formatLocation(
      dossier.ville_disparition || '',
      dossier.region_disparition || '',
      dossier.pays_disparition || '',
    ),
    nombre_alertes: 0,
    nombre_vues: 0,
  };
};

export const enrichDossiersForDisplay = (dossiers: DossierDisparition[]): DossierDisplayData[] => {
  return dossiers.map((d) => enrichDossierForDisplay(d));
};

// ============================================
// LABEL GENERATION
// ============================================

export const getStatusLabel = (status: StatutDossier): string => {
  const labels: Record<StatutDossier, string> = {
    [StatutDossier.EN_COURS]: 'En cours',
    [StatutDossier.RETROUVE_VIVANT]: 'Retrouvé vivant',
    [StatutDossier.RETROUVE_DECEDE]: 'Retrouvé décédé',
    [StatutDossier.SUSPENDU]: 'Suspendu',
    [StatutDossier.CLASSE_SANS_SUITE]: 'Classé sans suite',
    [StatutDossier.TRANSFERE]: 'Transféré',
  };
  return labels[status] || status;
};

export const getTypeLabel = (type: TypeDisparition): string => {
  const labels: Record<TypeDisparition, string> = {
    [TypeDisparition.FUGUE]: 'Fugue',
    [TypeDisparition.ENLEVEMENT_PRESUME]: 'Enlèvement présumé',
    [TypeDisparition.ACCIDENT]: 'Accident',
    [TypeDisparition.CONFLIT_ARME]: 'Conflit armé',
    [TypeDisparition.MIGRATION]: 'Migration',
    [TypeDisparition.CATASTROPHE_NATURELLE]: 'Catastrophe naturelle',
    [TypeDisparition.DISPARITION_VOLONTAIRE]: 'Disparition volontaire',
    [TypeDisparition.INCONNUE]: 'Type inconnue',
    [TypeDisparition.AUTRE]: 'Autre',
  };
  return labels[type] || type;
};

export const getUrgencyLabel = (urgency: NiveauUrgence): string => {
  const labels: Record<NiveauUrgence, string> = {
    [NiveauUrgence.CRITIQUE]: 'Critique',
    [NiveauUrgence.URGENT]: 'Urgent',
    [NiveauUrgence.NORMAL]: 'Normal',
    [NiveauUrgence.FAIBLE]: 'Faible',
  };
  return labels[urgency] || urgency;
};

export const getPrecisionLabel = (precision: string): string => {
  const labels: Record<string, string> = {
    exacte: 'Localisation exacte',
    approximative: 'Localisation approximative',
    zone: 'Zone estimée',
    inconnue: 'Localisation inconnue',
  };
  return labels[precision] || precision;
};

export const getStateLabel = (state: string): string => {
  const labels: Record<string, string> = {
    vivant_bon_etat: 'Vivant en bon état',
    vivant_blesse: 'Vivant mais blessé',
    vivant_traumatise: 'Vivant mais traumatisé',
    vivant_etat_critique: 'Vivant, état critique',
    decede: 'Décédé',
    etat_inconnu: 'État inconnu',
  };
  return labels[state] || state;
};

// ============================================
// FORMATTING
// ============================================

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatLocation = (ville: string, region: string, pays: string): string => {
  const parts = [ville, region, pays].filter((p) => p && p.length > 0);
  return parts.join(', ');
};

export const getRelativeDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffWeeks < 4) return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  if (diffMonths < 12) return `Il y a ${diffMonths} mois`;
  return `Il y a ${diffYears} an${diffYears > 1 ? 's' : ''}`;
};

// ============================================
// BUSINESS LOGIC
// ============================================

export const createAndProcessDossier = async (
  formData: DossierFormValues,
  userId: string,
  orgId: string,
): Promise<DossierDisplayData> => {
  const errors = validateDossierForm(formData);

  if (Object.keys(errors).length > 0) {
    throw new Error('Validation failed: ' + JSON.stringify(errors));
  }

  const created = await dossierAPI.createDossier({
    ...formData,
    id_utilisateur_createur: userId,
    id_organisation_responsable: orgId,
  });

  return enrichDossierForDisplay(created);
};

export const getDossierWithEnrichment = async (dossierId: string): Promise<DossierDisplayData> => {
  const dossier = await dossierAPI.getDossierById(dossierId);
  return enrichDossierForDisplay(dossier);
};

export const getDossiersWithEnrichment = async (filters?: any) => {
  const { data, count } = await dossierAPI.getDossiers(filters);
  return {
    data: enrichDossiersForDisplay(data),
    count,
  };
};

export const calculatePriority = (
  dossier: DossierDisparition,
  signalementCount: number,
): number => {
  let score = 0;

  // Urgency score (0-40)
  const urgencyScores: Record<NiveauUrgence, number> = {
    [NiveauUrgence.CRITIQUE]: 40,
    [NiveauUrgence.URGENT]: 30,
    [NiveauUrgence.NORMAL]: 20,
    [NiveauUrgence.FAIBLE]: 10,
  };
  score += urgencyScores[dossier.niveau_urgence] || 0;

  // Time score (0-30)
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - new Date(dossier.date_disparition).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysSince < 1) score += 30;
  else if (daysSince < 7) score += 25;
  else if (daysSince < 30) score += 15;
  else score += 5;

  // Signalement count score (0-20)
  if (signalementCount > 5) score += 20;
  else if (signalementCount > 2) score += 10;
  else if (signalementCount > 0) score += 5;

  // Status score (0-10)
  if (dossier.statut_dossier === StatutDossier.EN_COURS) score += 10;

  return Math.min(100, score);
};

// ============================================
// STATISTICS
// ============================================

export const getDossierStatisticsWithLabel = async (): Promise<any> => {
  const stats = await dossierAPI.getDossierStatistics();

  return {
    ...stats,
    par_statut_label: Object.entries(stats.par_statut).map(([key, value]) => ({
      label: getStatusLabel(key as StatutDossier),
      value,
      percentage: stats.total_dossiers > 0 ? ((value / stats.total_dossiers) * 100).toFixed(1) : 0,
    })),
    par_urgence_label: Object.entries(stats.par_urgence).map(([key, value]) => ({
      label: getUrgencyLabel(key as NiveauUrgence),
      value,
      percentage:
        stats.total_dossiers > 0 ? ((value / stats.total_dossiers) * 100).toFixed(1) : 0,
    })),
    par_type_label: Object.entries(stats.par_type).map(([key, value]) => ({
      label: getTypeLabel(key as TypeDisparition),
      value,
      percentage:
        stats.total_dossiers > 0 ? ((value / stats.total_dossiers) * 100).toFixed(1) : 0,
    })),
  };
};
