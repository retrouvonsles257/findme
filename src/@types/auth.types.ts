/**
 * =====================================================
 * RETROUVONSLES - Types d'Authentification
 * =====================================================
 */

import { UUID, Timestamp } from './database.types';
import { NomRole, StatutCompte, TypeCompte } from './enums.types';

export interface User {
  id: UUID;
  email: string;
  nom_complet: string;
  telephone?: string;
  role: NomRole;
  statut_compte: StatutCompte;
  type_compte: TypeCompte;
  organisation_id?: UUID;
  /** Ex-rôle citoyen_verifie : identité vérifiée côté profil. */
  identite_verifiee?: boolean;
  /** Sous-type compte autorite (1–4), null si non applicable. */
  autorite_echelon?: number | null;
  date_creation: Timestamp;
  derniere_connexion?: Timestamp;
  email_confirme: boolean;
  telephone_confirme: boolean;
  /** Session Supabase anonyme (avant liaison email / mot de passe). */
  is_anonymous?: boolean;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nom_complet: string;
  telephone?: string;
  type_compte: TypeCompte;
  organisation_id?: UUID;
}

export interface AuthResponse {
  user: User;
  session: Session;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}
