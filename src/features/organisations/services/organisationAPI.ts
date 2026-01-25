/**
 * =====================================================
 * RETROUVONSLES - Organisation API Service
 * API wrapper for organisation operations
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  Organisation,
  OrganisationMember,
  OrganisationStats,
  OrganisationSettings,
  OrganisationCreatePayload,
  OrganisationUpdatePayload,
  OrganisationMemberCreatePayload,
  OrganisationMemberUpdatePayload,
  OrganisationFilter,
} from '../types';

const db = { from: (table: string) => (supabase.from(table) as any) };

/**
 * Get all organisations
 */
export const getOrganisations = async (
  filter?: OrganisationFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: Organisation[]; total: number }> => {
  let query = db.from('organisations').select('*', { count: 'exact' });

  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  if (filter?.verified !== undefined) {
    query = query.eq('verified', filter.verified);
  }

  if (filter?.search) {
    query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
  }

  if (filter?.sortBy) {
    query = query.order(filter.sortBy, { ascending: filter.sortOrder === 'asc' });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;
  return {
    data: data.map((o: any) => ({
      ...o,
      created_at: new Date(o.created_at),
      updated_at: new Date(o.updated_at),
      founding_date: o.founding_date ? new Date(o.founding_date) : undefined,
    })),
    total: count || 0,
  };
};

/**
 * Get organisation by ID
 */
export const getOrganisationById = async (id: string): Promise<Organisation | null> => {
  const { data, error } = await db.from('organisations').select('*').eq('id', id).single();

  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    founding_date: data.founding_date ? new Date(data.founding_date) : undefined,
  };
};

/**
 * Create organisation
 */
export const createOrganisation = async (
  payload: OrganisationCreatePayload,
  userId: string
): Promise<Organisation> => {
  const { data, error } = await db
    .from('organisations')
    .insert({
      name: payload.name,
      description: payload.description,
      email: payload.email,
      website: payload.website,
      phone: payload.phone,
      address: payload.address,
      city: payload.city,
      country: payload.country,
      logo_url: payload.logo_url,
      status: 'active',
      verified: false,
      member_count: 1,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Update organisation
 */
export const updateOrganisation = async (
  id: string,
  payload: OrganisationUpdatePayload
): Promise<Organisation> => {
  const { data, error } = await db
    .from('organisations')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Delete organisation
 */
export const deleteOrganisation = async (id: string): Promise<void> => {
  const { error } = await db.from('organisations').delete().eq('id', id);

  if (error) throw error;
};

/**
 * Get organisation members
 */
export const getOrganisationMembers = async (organisationId: string): Promise<OrganisationMember[]> => {
  const { data, error } = await db
    .from('organisation_members')
    .select('*')
    .eq('organisation_id', organisationId)
    .order('joined_at', { ascending: false });

  if (error) throw error;

  return data.map((m: any) => ({
    ...m,
    joined_at: new Date(m.joined_at),
  }));
};

/**
 * Add member to organisation
 */
export const addOrganisationMember = async (
  organisationId: string,
  payload: OrganisationMemberCreatePayload
): Promise<OrganisationMember> => {
  const { data, error } = await db
    .from('organisation_members')
    .insert({
      organisation_id: organisationId,
      user_id: payload.user_id,
      role: payload.role,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    joined_at: new Date(data.joined_at),
  };
};

/**
 * Update organisation member
 */
export const updateOrganisationMember = async (
  memberId: string,
  payload: OrganisationMemberUpdatePayload
): Promise<OrganisationMember> => {
  const { data, error } = await db
    .from('organisation_members')
    .update(payload)
    .eq('id', memberId)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    joined_at: new Date(data.joined_at),
  };
};

/**
 * Remove member from organisation
 */
export const removeOrganisationMember = async (memberId: string): Promise<void> => {
  const { error } = await db.from('organisation_members').delete().eq('id', memberId);

  if (error) throw error;
};

/**
 * Get organisation stats
 */
export const getOrganisationStats = async (organisationId: string): Promise<OrganisationStats | null> => {
  const { data, error } = await db
    .from('organisation_stats')
    .select('*')
    .eq('organisation_id', organisationId)
    .single();

  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Get organisation settings
 */
export const getOrganisationSettings = async (
  organisationId: string
): Promise<OrganisationSettings | null> => {
  const { data, error } = await db
    .from('organisation_settings')
    .select('*')
    .eq('organisation_id', organisationId)
    .single();

  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Update organisation settings
 */
export const updateOrganisationSettings = async (
  organisationId: string,
  settings: Partial<OrganisationSettings>
): Promise<OrganisationSettings> => {
  const { data, error } = await db
    .from('organisation_settings')
    .update(settings)
    .eq('organisation_id', organisationId)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Get user organisations
 */
export const getUserOrganisations = async (userId: string): Promise<Organisation[]> => {
  const { data, error } = await db
    .from('organisations')
    .select(
      `
      *,
      organisation_members!inner(user_id)
    `
    )
    .or(`created_by.eq.${userId},organisation_members.user_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((o: any) => ({
    ...o,
    created_at: new Date(o.created_at),
    updated_at: new Date(o.updated_at),
    founding_date: o.founding_date ? new Date(o.founding_date) : undefined,
  }));
};
