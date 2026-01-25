/**
 * =====================================================
 * RETROUVONSLES - Organisation Types
 * Type definitions for organisation feature
 * =====================================================
 */

export interface Organisation {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  founding_date?: Date;
  status: 'active' | 'inactive' | 'suspended';
  verified: boolean;
  member_count: number;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  metadata?: Record<string, any>;
}

export interface OrganisationMember {
  id: string;
  organisation_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  role: 'admin' | 'moderator' | 'member' | 'viewer';
  joined_at: Date;
  status: 'active' | 'inactive' | 'pending';
}

export interface OrganisationStats {
  organisation_id: string;
  total_members: number;
  active_members: number;
  total_cases: number;
  resolved_cases: number;
  pending_cases: number;
  total_sightings: number;
  verified_sightings: number;
  created_at: Date;
  updated_at: Date;
}

export interface OrganisationSettings {
  id: string;
  organisation_id: string;
  notifications_enabled: boolean;
  public_profile: boolean;
  require_member_approval: boolean;
  max_members?: number;
  allow_external_api: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganisationCreatePayload {
  name: string;
  description?: string;
  email: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
}

export interface OrganisationUpdatePayload {
  name?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  logo_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface OrganisationMemberCreatePayload {
  user_id: string;
  role: 'admin' | 'moderator' | 'member' | 'viewer';
}

export interface OrganisationMemberUpdatePayload {
  role?: 'admin' | 'moderator' | 'member' | 'viewer';
  status?: 'active' | 'inactive' | 'pending';
}

export interface OrganisationFilter {
  status?: 'active' | 'inactive' | 'suspended';
  verified?: boolean;
  search?: string;
  sortBy?: 'name' | 'created_at' | 'member_count';
  sortOrder?: 'asc' | 'desc';
}

export interface OrganisationState {
  organisations: Organisation[];
  selectedOrganisation: Organisation | null;
  members: OrganisationMember[];
  stats: OrganisationStats | null;
  settings: OrganisationSettings | null;
  isLoading: boolean;
  error: string | null;
  filter: OrganisationFilter;
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
}
