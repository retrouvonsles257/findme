/**
 * =====================================================
 * RETROUVONSLES - Dossier Helper Utilities
 * Helper functions for dossier operations
 * =====================================================
 */

import type { DossierDisplayData } from '../types';
import type { DossierDisparition } from '../../../@types/database.types';
import { StatutDossier, NiveauUrgence, TypeDisparition, EtatPersonneRetrouvee } from '../../../@types/enums.types';
import type { PrecisionLieu } from '../../../@types/enums.types';

/**
 * Format date to locale string
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Date inconnue';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'Date invalide';
  }
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Date/heure inconnue';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Date/heure invalide';
  }
};

/**
 * Get relative time string (e.g., "Il y a 3 jours")
 */
export const getRelativeDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return 'À l\'instant';
    if (secondsAgo < 3600) return `Il y a ${Math.floor(secondsAgo / 60)} minutes`;
    if (secondsAgo < 86400) return `Il y a ${Math.floor(secondsAgo / 3600)} heures`;
    if (secondsAgo < 604800) return `Il y a ${Math.floor(secondsAgo / 86400)} jours`;
    if (secondsAgo < 2592000) return `Il y a ${Math.floor(secondsAgo / 604800)} semaines`;
    if (secondsAgo < 31536000) return `Il y a ${Math.floor(secondsAgo / 2592000)} mois`;
    return `Il y a ${Math.floor(secondsAgo / 31536000)} ans`;
  } catch {
    return 'Date invalide';
  }
};

/**
 * Format location string
 */
export const formatLocation = (
  city?: string | null,
  region?: string | null,
  country?: string | null,
): string => {
  const parts = [];
  if (city) parts.push(city);
  if (region) parts.push(region);
  if (country) parts.push(country);
  return parts.length > 0 ? parts.join(', ') : 'Localisation inconnue';
};

/**
 * Get days since date
 */
export const getDaysSince = (dateString: string): number => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

/**
 * Check if dossier is recent (less than 7 days)
 */
export const isRecentDossier = (dateString: string): boolean => {
  return getDaysSince(dateString) < 7;
};

/**
 * Check if dossier is urgent
 */
export const isUrgentDossier = (urgency: NiveauUrgence): boolean => {
  return [NiveauUrgence.CRITIQUE, NiveauUrgence.URGENT].includes(urgency);
};

/**
 * Check if dossier is resolved
 */
export const isResolvedDossier = (status: StatutDossier): boolean => {
  return [StatutDossier.RETROUVE_VIVANT, StatutDossier.RETROUVE_DECEDE].includes(status);
};

/**
 * Check if dossier is closed
 */
export const isClosedDossier = (status: StatutDossier): boolean => {
  return [
    StatutDossier.RETROUVE_VIVANT,
    StatutDossier.RETROUVE_DECEDE,
    StatutDossier.CLASSE_SANS_SUITE,
    StatutDossier.TRANSFERE,
  ].includes(status);
};

/**
 * Check if dossier is active/open
 */
export const isActiveDossier = (status: StatutDossier): boolean => {
  return status === StatutDossier.EN_COURS;
};

/**
 * Get status color
 */
export const getStatusColor = (status: StatutDossier): string => {
  switch (status) {
    case StatutDossier.EN_COURS:
      return 'primary';
    case StatutDossier.RETROUVE_VIVANT:
      return 'success';
    case StatutDossier.RETROUVE_DECEDE:
      return 'warning';
    case StatutDossier.SUSPENDU:
      return 'info';
    case StatutDossier.CLASSE_SANS_SUITE:
      return 'secondary';
    case StatutDossier.TRANSFERE:
      return 'info';
    default:
      return 'secondary';
  }
};

/**
 * Get urgency color
 */
export const getUrgencyColor = (urgency: NiveauUrgence): string => {
  switch (urgency) {
    case NiveauUrgence.CRITIQUE:
      return 'danger';
    case NiveauUrgence.URGENT:
      return 'warning';
    case NiveauUrgence.NORMAL:
      return 'info';
    case NiveauUrgence.FAIBLE:
      return 'secondary';
    default:
      return 'secondary';
  }
};

/**
 * Get urgency severity (1-4)
 */
export const getUrgencySeverity = (urgency: NiveauUrgence): number => {
  switch (urgency) {
    case NiveauUrgence.CRITIQUE:
      return 4;
    case NiveauUrgence.URGENT:
      return 3;
    case NiveauUrgence.NORMAL:
      return 2;
    case NiveauUrgence.FAIBLE:
      return 1;
    default:
      return 0;
  }
};

/**
 * Get type icon
 */
export const getTypeIcon = (type: TypeDisparition): string => {
  switch (type) {
    case TypeDisparition.FUGUE:
      return '🏃';
    case TypeDisparition.ENLEVEMENT_PRESUME:
      return '⚠️';
    case TypeDisparition.ACCIDENT:
      return '🚑';
    case TypeDisparition.CONFLIT_ARME:
      return '🛑';
    case TypeDisparition.MIGRATION:
      return '🗺️';
    case TypeDisparition.CATASTROPHE_NATURELLE:
      return '🌪️';
    case TypeDisparition.DISPARITION_VOLONTAIRE:
      return '🚶';
    case TypeDisparition.INCONNUE:
      return '❓';
    default:
      return '📋';
  }
};

/**
 * Calculate case progress percentage
 */
export const calculateProgressPercentage = (dossier: DossierDisparition): number => {
  let progress = 0;

  // Status (40%)
  const statusProgress: Partial<Record<StatutDossier, number>> = {
    [StatutDossier.EN_COURS]: 20,
    [StatutDossier.RETROUVE_VIVANT]: 100,
    [StatutDossier.RETROUVE_DECEDE]: 100,
    [StatutDossier.SUSPENDU]: 40,
    [StatutDossier.CLASSE_SANS_SUITE]: 60,
    [StatutDossier.TRANSFERE]: 50,
  };
  progress += statusProgress[dossier.statut_dossier] || 0;

  // Time-based progress (30%)
  const daysSince = getDaysSince(dossier.date_disparition);
  if (daysSince > 0) {
    progress += Math.min(30, Math.floor(daysSince / 2));
  }

  // Signals/alerts (20%)
  const signalCount = (dossier.nombre_signalements || 0) + (dossier.nombre_alertes_diffusees || 0);
  progress += Math.min(20, Math.floor(signalCount / 2));

  // Views (10%)
  const viewCount = dossier.nombre_vues_fiche || 0;
  progress += Math.min(10, Math.floor(viewCount / 10));

  return Math.min(100, progress);
};

/**
 * Get state/condition label
 */
export const getStateLabel = (state: EtatPersonneRetrouvee): string => {
  const labels: Record<EtatPersonneRetrouvee, string> = {
    [EtatPersonneRetrouvee.BONNE_SANTE]: 'Bonne santé',
    [EtatPersonneRetrouvee.BLESSE]: 'Blessé',
    [EtatPersonneRetrouvee.HOSPITALISE]: 'Hospitalisé',
    [EtatPersonneRetrouvee.DECEDE]: 'Décédé',
    [EtatPersonneRetrouvee.TRAUMATISE]: 'Traumatisé',
    [EtatPersonneRetrouvee.NON_APPLICABLE]: 'Non applicable',
  };
  return labels[state] || state;
};

/**
 * Get precision label
 */
export const getPrecisionLabel = (precision: PrecisionLieu | string): string => {
  const labels: Record<string, string> = {
    exacte: 'Localisation exacte',
    approximative: 'Localisation approximative',
    inconnue: 'Localisation inconnue',
  };
  return labels[precision] || precision;
};

/**
 * Sort dossiers by urgency
 */
export const sortByUrgency = (dossiers: DossierDisplayData[]): DossierDisplayData[] => {
  return [...dossiers].sort((a, b) => {
    const urgencyA = getUrgencySeverity(a.niveau_urgence);
    const urgencyB = getUrgencySeverity(b.niveau_urgence);
    return urgencyB - urgencyA;
  });
};

/**
 * Sort dossiers by recency
 */
export const sortByRecency = (dossiers: DossierDisplayData[]): DossierDisplayData[] => {
  return [...dossiers].sort((a, b) => {
    return new Date(b.date_disparition).getTime() - new Date(a.date_disparition).getTime();
  });
};

/**
 * Group dossiers by status
 */
export const groupByStatus = (dossiers: DossierDisplayData[]): Record<StatutDossier, DossierDisplayData[]> => {
  const grouped = {} as Record<StatutDossier, DossierDisplayData[]>;

  Object.values(StatutDossier).forEach((status) => {
    grouped[status] = [];
  });

  dossiers.forEach((dossier) => {
    grouped[dossier.statut_dossier].push(dossier);
  });

  return grouped;
};

/**
 * Generate dossier number
 */
export const generateDossierNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `DOS-${year}${month}${day}-${random}`;
};

/**
 * Export dossier to text
 */
export const exportDossierAsText = (dossier: DossierDisplayData): string => {
  return `
DOSSIER DE DISPARITION
======================
Numéro: ${dossier.numero_dossier}
Statut: ${dossier.statut_label}
Date de disparition: ${dossier.date_disparition_formatted}

TYPE DE DISPARITION
-------------------
Type: ${dossier.type_label}
Circonstances: ${dossier.circonstances}

LOCALISATION
-----------
Lieu: ${dossier.localisation_display}
Coordonnées: ${dossier.latitude_disparition ? `${dossier.latitude_disparition}, ${dossier.longitude_disparition}` : 'Non disponibles'}

URGENCE
-------
Niveau: ${dossier.urgence_label}
Jours depuis disparition: ${dossier.jours_depuis_disparition}

INFORMATIONS ADDITIONNELLES
---------------------------
Signalements: ${dossier.nombre_signalements || 0}
Alertes diffusées: ${dossier.nombre_alertes || 0}
Vues: ${dossier.nombre_vues || 0}
`;
};

/**
 * Check if can edit dossier
 */
export const canEditDossier = (status: StatutDossier, userRole?: string): boolean => {
  // Can only edit open cases
  if (status !== StatutDossier.EN_COURS) {
    return false;
  }
  // Can edit if user is admin or investigator
  return userRole === 'admin' || userRole === 'investigator' || userRole === 'operator';
};

/**
 * Check if can delete dossier
 */
export const canDeleteDossier = (status: StatutDossier, userRole?: string): boolean => {
  // Only admins can delete
  if (userRole !== 'admin') {
    return false;
  }
  // Cannot delete resolved cases
  return !isResolvedDossier(status);
};
