/**
 * =====================================================
 * RETROUVONSLES - Signalement Service Utilities
 * Helper functions for signalement operations
 * =====================================================
 */

import type { Signalement, SignalementFilter } from '../types';

/**
 * Format etat label
 */
export function getEtatLabel(etat: string): string {
  const labels: Record<string, string> = {
    nouveau: 'New',
    en_cours: 'In Progress',
    valide: 'Validated',
    rejete: 'Rejected',
    ferme: 'Closed',
  };
  return labels[etat] || etat;
}

/**
 * Format etat color
 */
export function getEtatColor(etat: string): string {
  const colors: Record<string, string> = {
    nouveau: '#3b82f6',
    en_cours: '#f59e0b',
    valide: '#10b981',
    rejete: '#ef4444',
    ferme: '#6b7280',
  };
  return colors[etat] || '#000';
}

/**
 * Format contact type label
 */
export function getContactTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    temoin: 'Witness',
    declarant: 'Declarant',
    observateur: 'Observer',
  };
  return labels[type] || type;
}

/**
 * Format reliability label
 */
export function getReliabilityLabel(reliability: string): string {
  const labels: Record<string, string> = {
    haute: 'High',
    moyenne: 'Medium',
    basse: 'Low',
  };
  return labels[reliability] || reliability;
}

/**
 * Format decision label
 */
export function getDecisionLabel(decision: string): string {
  const labels: Record<string, string> = {
    approuve: 'Approved',
    rejete: 'Rejected',
    besoin_clarification: 'Needs Clarification',
  };
  return labels[decision] || decision;
}

/**
 * Calculate days ago
 */
export function getDaysAgo(date: Date | string): number {
  const now = new Date();
  const past = new Date(date);
  const diffTime = Math.abs(now.getTime() - past.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display
 */
export function formatSignalementDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Filter signalements
 */
export function filterSignalements(signalements: Signalement[], filter: SignalementFilter): Signalement[] {
  let filtered = [...signalements];

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.description.toLowerCase().includes(searchLower) ||
        (s.lieu_observation || '').toLowerCase().includes(searchLower)
    );
  }

  if (filter.etat) {
    filtered = filtered.filter((s) => s.etat === filter.etat);
  }

  if (filter.date_debut) {
    const debut = new Date(filter.date_debut);
    filtered = filtered.filter((s) => new Date(s.date_observation) >= debut);
  }

  if (filter.date_fin) {
    const fin = new Date(filter.date_fin);
    filtered = filtered.filter((s) => new Date(s.date_observation) <= fin);
  }

  if (filter.score_min) {
    filtered = filtered.filter((s) => (s.score_correspondance || s.score_pertinence || 0) >= filter.score_min!);
  }

  if (filter.latitude && filter.longitude && filter.rayon_km) {
    const earthRadiusKm = 6371;
    filtered = filtered.filter((s) => {
      const lat = s.latitude_observation ?? s.latitude;
      const lon = s.longitude_observation ?? s.longitude;
      if (!lat || !lon) return false;
      const dLat = ((lat - filter.latitude!) * Math.PI) / 180;
      const dLon = ((lon - filter.longitude!) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((filter.latitude! * Math.PI) / 180) *
          Math.cos((lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = earthRadiusKm * c;
      return distance <= filter.rayon_km!;
    });
  }

  // Sort
  const sortBy = filter.sortBy || 'date_observation';
  const sortOrder = filter.sortOrder === 'asc' ? 1 : -1;

  filtered.sort((a, b) => {
    let aVal: any = a[sortBy as keyof Signalement];
    let bVal: any = b[sortBy as keyof Signalement];

    if (typeof aVal === 'string') {
      return aVal.localeCompare(bVal) * sortOrder;
    }
    return (aVal - bVal) * sortOrder;
  });

  return filtered;
}

/**
 * Calculate score based on description similarity
 */
export function calculateMatchScore(description1: string, description2: string): number {
  const words1 = description1.toLowerCase().split(/\s+/);
  const words2 = description2.toLowerCase().split(/\s+/);
  const intersection = words1.filter((w) => words2.includes(w));
  const union = new Set([...words1, ...words2]).size;
  return intersection.length / union;
}
