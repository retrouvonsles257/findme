/**
 * =====================================================
 * RETROUVONSLES - Types pour les Alertes
 * =====================================================
 */

import type { TypeAlerte, StatutAlerte } from './enums.types';
import type { Json } from './database.types';

// ============================================
// ALERTE ENTITY
// ============================================

export interface Alerte {
  id: string;
  numero_alerte: string | null;
  titre: string;
  message: string;
  message_court: string | null;
  type_alerte: TypeAlerte;
  latitude_centre: number | null;
  longitude_centre: number | null;
  point_centre: { type: 'Point'; coordinates: [number, number] } | null;
  rayon_km: number;
  zones_specifiques: Json | null;
  date_diffusion: string;
  date_expiration: string | null;
  canaux_diffusion: Json | null;
  statut_alerte: StatutAlerte;
  niveau_urgence_min: number;
  types_utilisateurs: Json | null;
  nombre_destinataires: number;
  nombre_envois_reussis: number;
  nombre_vues: number;
  nombre_partages: number;
  nombre_signalements_generes: number;
  validee: boolean;
  id_utilisateur_validateur: string | null;
  date_validation: string | null;
  commentaire_validation: string | null;
  id_dossier: string | null;
  id_utilisateur_createur: string | null;
  created_at: string;
  updated_at: string;
  dossier_disparition?: any; // Forward ref
}

// ============================================
// NOTIFICATION TYPE
// ============================================

export interface RetrouvonsLesNotification {
  id: string;
  titre: string;
  message: string;
  type: string;
  category?: string;
  isRead: boolean;
  priority?: 'haute' | 'moyenne' | 'basse';
  createdAt: Date;
  expiresAt?: Date;
  action?: {
    label: string;
    action: () => void;
  };
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

export type TypeAlerteString = TypeAlerte | string;
export type StatutAlerteString = StatutAlerte | string;

/**
 * Type guard for TypeAlerte
 */
export const isValidTypeAlerte = (value: any): value is TypeAlerte => {
  const validTypes = Object.values({
    AMBER_ALERT: 'amber_alert',
    DISPARITION_ENFANT: 'disparition_enfant',
    DISPARITION_ADULTE_VULNERABLE: 'disparition_adulte_vulnerable',
    DISPARITION_STANDARD: 'disparition_standard',
    MISE_A_JOUR: 'mise_a_jour',
    PERSONNE_RETROUVEE: 'personne_retrouvee',
  });
  return validTypes.includes(value);
};

/**
 * Type guard for StatutAlerte
 */
export const isValidStatutAlerte = (value: any): value is StatutAlerte => {
  const validStatuts = Object.values({
    BROUILLON: 'brouillon',
    PROGRAMMEE: 'programmee',
    EN_COURS: 'en_cours',
    TERMINEE: 'terminee',
    ANNULEE: 'annulee',
  });
  return validStatuts.includes(value);
};
