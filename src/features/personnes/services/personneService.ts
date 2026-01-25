/**
 * =====================================================
 * RETROUVONSLES - Personne Service
 * Business logic for personne feature
 * =====================================================
 */

import type { Personne, LienFiliation } from '../types';

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: Date | undefined): number => {
  if (!birthDate) return 0;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

/**
 * Format full name
 */
export const getFullName = (personne: Personne): string => {
  if (personne.nom_complet) return personne.nom_complet;
  const parts = [personne.prenom, personne.nom].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
};

/**
 * Get display age
 */
export const getDisplayAge = (personne: Personne): string => {
  if (personne.age_estime_min && personne.age_estime_max) {
    if (personne.age_estime_min === personne.age_estime_max) {
      return `${personne.age_estime_min} years`;
    }
    return `${personne.age_estime_min}-${personne.age_estime_max} years`;
  }
  if (personne.date_naissance) {
    const age = calculateAge(personne.date_naissance);
    return `${age} years`;
  }
  return 'Unknown';
};

/**
 * Get display status
 */
export const getStatutIdentiteColor = (statut: string): string => {
  const colors = {
    identifie: '#10b981',
    partiellement_identifie: '#f59e0b',
    non_identifie: '#ef4444',
  };
  return colors[statut as keyof typeof colors] || '#6b7280';
};

/**
 * Get fiabilite color
 */
export const getFiabiliteColor = (fiabilite: string): string => {
  const colors = {
    confirmee: '#10b981',
    probable: '#f59e0b',
    incertaine: '#ef4444',
  };
  return colors[fiabilite as keyof typeof colors] || '#6b7280';
};

/**
 * Get sex display label
 */
export const getSexDisplay = (sexe: string): string => {
  const labels = {
    masculin: 'Male',
    feminin: 'Female',
    inconnu: 'Unknown',
    non_precise: 'Not specified',
  };
  return labels[sexe as keyof typeof labels] || sexe;
};

/**
 * Check if personne has complete physical description
 */
export const hasCompletePhysicalDescription = (personne: Personne): boolean => {
  const physicalFields = [
    personne.taille_cm,
    personne.poids_kg,
    personne.corpulence,
    personne.couleur_peau,
    personne.type_cheveux,
    personne.couleur_yeux,
  ];

  const filledFields = physicalFields.filter((field) => field !== undefined && field !== null).length;
  return filledFields >= 4;
};

/**
 * Calculate completion percentage
 */
export const calculateCompletionPercentage = (personne: Personne): number => {
  const fields = [
    personne.nom,
    personne.prenom,
    personne.date_naissance,
    personne.sexe,
    personne.description_physique,
    personne.photo_principale,
    personne.statut_identite,
    personne.situation_familiale,
  ];

  const filledFields = fields.filter((field) => field !== undefined && field !== null && field !== '').length;
  return Math.round((filledFields / fields.length) * 100);
};

/**
 * Sort personnes
 */
export const sortPersonnes = (
  personnes: Personne[],
  sortBy: string = 'created_at',
  order: 'asc' | 'desc' = 'desc'
): Personne[] => {
  const sorted = [...personnes];

  sorted.sort((a, b) => {
    let aVal: any = a[sortBy as keyof Personne];
    let bVal: any = b[sortBy as keyof Personne];

    if (typeof aVal === 'string') {
      aVal = aVal?.toLowerCase() || '';
      bVal = (bVal as string)?.toLowerCase() || '';
    }

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });

  return sorted;
};

/**
 * Filter personnes
 */
export const filterPersonnes = (
  personnes: Personne[],
  filters: {
    sexe?: string;
    nationalite?: string;
    search?: string;
  }
): Personne[] => {
  return personnes.filter((p) => {
    if (filters.sexe && p.sexe !== filters.sexe) return false;
    if (filters.nationalite && p.nationalite !== filters.nationalite) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchFields = [
        getFullName(p),
        p.description_physique,
        p.alias,
      ]
        .filter(Boolean)
        .map((f) => (f as string).toLowerCase());

      if (!matchFields.some((f) => f.includes(searchLower))) return false;
    }
    return true;
  });
};

/**
 * Get filiation type display label
 */
export const getFiliationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    pere_biologique: 'Biological Father',
    mere_biologique: 'Biological Mother',
    pere_adoptif: 'Adoptive Father',
    mere_adoptive: 'Adoptive Mother',
    enfant_biologique: 'Biological Child',
    enfant_adoptif: 'Adopted Child',
    conjoint: 'Spouse',
    frere_biologique: 'Biological Brother',
    soeur_biologique: 'Biological Sister',
    demi_frere: 'Half Brother',
    demi_soeur: 'Half Sister',
    tuteur_legal: 'Legal Guardian',
    pupille: 'Ward',
    cousin_germain: 'Male Cousin',
    cousine_germaine: 'Female Cousin',
  };
  return labels[type] || type;
};

/**
 * Get verification status label
 */
export const getVerificationStatusLabel = (status: string): string => {
  const labels = {
    confirme_officiellement: 'Officially Confirmed',
    confirme_genetiquement: 'Genetically Confirmed',
    declare_famille: 'Family Declared',
    suppose_ia: 'AI Suggested',
    en_verification: 'Under Verification',
    conteste: 'Contested',
    invalide: 'Invalid',
  };
  return labels[status as keyof typeof labels] || status;
};

/**
 * Check if filiation is confirmed
 */
export const isFiliationConfirmed = (filiation: LienFiliation): boolean => {
  return filiation.statut_verification === 'confirme_officiellement' ||
    filiation.statut_verification === 'confirme_genetiquement';
};
