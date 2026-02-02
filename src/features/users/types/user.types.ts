/**
 * =====================================================
 * RETROUVONSLES - User Types
 * Type definitions for user management feature
 * =====================================================
 */

import type { User } from '../../../@types/auth.types';

/**
 * UserProfile - Detailed user profile information
 */
export interface UserProfile extends User {
  bio?: string;
  avatar_url?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  code_postal?: string;
  date_naissance?: string;
  photo_profil?: string;
  verification_documents?: boolean;
  score_reputation?: number;
  nombre_signalements?: number;
  nombre_dossiers?: number;
  preferences?: UserPreferences;
}

/**
 * UserPreferences - User preferences and settings
 */
export interface UserPreferences {
  id: string;
  user_id: string;
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_sms: boolean;
  langue: 'fr' | 'en';
  theme: 'light' | 'dark' | 'auto';
  deux_facteurs_actif: boolean;
  visibilite_profil: 'public' | 'amis' | 'prive';
  recevoir_alertes: boolean;
  alertes_distance_km?: number;
  created_at: Date | string;
  updated_at: Date | string;
}

/**
 * UserRole - User role information
 */
export interface UserRole {
  id: string;
  user_id: string;
  nom_role:
    | 'super_admin'
    | 'admin_organisation'
    | 'officier_police'
    | 'agent_gendarmerie'
    | 'responsable_ong'
    | 'operateur_saisie'
    | 'moderateur'
    | 'citoyen_verifie'
    | 'citoyen_standard';
  organisation_id?: string;
  permissions: string[];
  date_attribution: Date | string;
  date_expiration?: Date | string;
}

/**
 * UserActivity - User activity tracking
 */
export interface UserActivity {
  id: string;
  user_id: string;
  type_action: 'connexion' | 'modification_profil' | 'creation_dossier' | 'signalement' | 'verification' | 'export_donnees' | 'autre';
  description: string;
  adresse_ip?: string;
  user_agent?: string;
  date_action: Date | string;
  resultat: 'success' | 'failure';
}

/**
 * UserStats - User statistics
 */
export interface UserStats {
  user_id: string;
  nombre_signalements: number;
  nombre_dossiers_crees: number;
  nombre_verifications: number;
  nombre_cas_resolus: number;
  taux_resolution: number;
  derniere_activite: Date | string;
  score_contribution: number;
}

/**
 * UserFilter - Filter criteria for user list
 */
export interface UserFilter {
  search?: string;
  role?: string;
  statut_compte?: 'actif' | 'suspendu' | 'en_attente_verification' | 'desactive' | 'bloque';
  organisation_id?: string;
  date_creation_debut?: string;
  date_creation_fin?: string;
  sortBy?: 'nom_complet' | 'date_creation' | 'derniere_connexion' | 'score_contribution';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * UserCreatePayload - Payload for creating user
 */
export interface UserCreatePayload {
  email: string;
  nom_complet: string;
  telephone?: string;
  password?: string;
  type_compte: 'autorite' | 'grand_public';
  organisation_id?: string;
  role?: string;
}

/**
 * UserUpdatePayload - Payload for updating user
 */
export interface UserUpdatePayload {
  nom_complet?: string;
  telephone?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  code_postal?: string;
  date_naissance?: string;
  statut_compte?: 'actif' | 'suspendu' | 'en_attente_verification' | 'desactive' | 'bloque';
}

/**
 * UserPreferencesUpdatePayload - Payload for updating user preferences
 */
export interface UserPreferencesUpdatePayload {
  notifications_email?: boolean;
  notifications_push?: boolean;
  notifications_sms?: boolean;
  langue?: 'fr' | 'en';
  theme?: 'light' | 'dark' | 'auto';
  deux_facteurs_actif?: boolean;
  visibilite_profil?: 'public' | 'amis' | 'prive';
  recevoir_alertes?: boolean;
  alertes_distance_km?: number;
}

/**
 * UserState - Redux state for users
 */
export interface UserState {
  users: UserProfile[];
  selectedUser: UserProfile | null;
  currentUser: UserProfile | null;
  roles: UserRole[];
  activities: UserActivity[];
  stats: UserStats[];
  preferences: UserPreferences | null;
  isLoading: boolean;
  error: string | null;
  filter: UserFilter;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Component-specific prop types
 */

export interface UserProfileProps {
  userId?: string;
  onEdit?: () => void;
}

export interface UserSettingsProps {
  userId?: string;
  onSave?: () => void;
}

export interface UserListProps {
  onUserSelect?: (user: UserProfile) => void;
  filter?: UserFilter;
}

export interface UserRolesProps {
  userId: string;
  editable?: boolean;
}

export interface UserStatsProps {
  userId?: string;
}

export interface UserAvatarProps {
  user: UserProfile;
  size?: 'small' | 'medium' | 'large';
  clickable?: boolean;
}

/**
 * Computed types
 */

export interface UserWithMetrics extends UserProfile {
  stats: UserStats;
  isOnline?: boolean;
  lastActivityTime?: string;
}

export interface UserPermissions {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageRoles: boolean;
  canViewActivity: boolean;
  canExportData: boolean;
  canVerifyUsers: boolean;
  canSuspendUsers: boolean;
}

export interface UserSearchResult {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
}
