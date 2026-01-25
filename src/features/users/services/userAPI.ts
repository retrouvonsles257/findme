/**
 * =====================================================
 * RETROUVONSLES - User API Service
 * API calls for user operations
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  UserProfile,
  UserPreferences,
  UserRole,
  UserActivity,
  UserStats,
  UserFilter,
  UserCreatePayload,
  UserUpdatePayload,
  UserPreferencesUpdatePayload,
  UserSearchResult,
} from '../types';

// Helper to bypass Supabase typing
const db = () => (supabase as any);

/**
 * Get all users with filters
 */
export const getAllUsers = async (filter?: UserFilter): Promise<UserSearchResult> => {
  try {
    const { data, error, count } = await db()
      .from('users')
      .select('*', { count: 'exact' })
      .limit(filter?.limit || 10)
      .offset(((filter?.page || 1) - 1) * (filter?.limit || 10));

    if (error) throw error;

    return {
      users: data || [],
      total: count || 0,
      page: filter?.page || 1,
      limit: filter?.limit || 10,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await db()
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Search users by name or email
 */
export const searchUsers = async (query: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await db()
      .from('users')
      .select('*')
      .or(`nom_complet.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

/**
 * Create new user
 */
export const createUser = async (payload: UserCreatePayload): Promise<UserProfile> => {
  try {
    // @ts-ignore
    const { data, error } = await db()
      .from('users')
      .insert([
        {
          email: payload.email,
          nom_complet: payload.nom_complet,
          telephone: payload.telephone,
          type_compte: payload.type_compte,
          organisation_id: payload.organisation_id,
          role: payload.role || 'citoyen_standard',
          statut_compte: 'en_attente_verification',
          email_confirme: false,
          date_creation: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUser = async (userId: string, payload: UserUpdatePayload): Promise<UserProfile> => {
  try {
    // @ts-ignore
    const { data, error } = await db()
      .from('users')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await db()
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await db()
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  userId: string,
  payload: UserPreferencesUpdatePayload
): Promise<UserPreferences> => {
  try {
    const preferences = await getUserPreferences(userId);

    // @ts-ignore
    const { data, error } = await db()
      .from('user_preferences')
      [preferences ? 'update' : 'insert'](
        preferences
          ? {
              ...payload,
              updated_at: new Date().toISOString(),
            }
          : {
              user_id: userId,
              ...payload,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
      )
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

/**
 * Get user roles
 */
export const getUserRoles = async (userId: string): Promise<UserRole[]> => {
  try {
    const { data, error } = await db()
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
};

/**
 * Get user activity
 */
export const getUserActivity = async (userId: string, limit = 50): Promise<UserActivity[]> => {
  try {
    const { data, error } = await db()
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('date_action', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user activity:', error);
    throw error;
  }
};

/**
 * Log user activity
 */
export const logUserActivity = async (
  userId: string,
  type_action: string,
  description: string,
  resultat: 'success' | 'failure' = 'success'
): Promise<UserActivity> => {
  try {
    // @ts-ignore
    const { data, error } = await db()
      .from('user_activity')
      .insert([
        {
          user_id: userId,
          type_action,
          description,
          resultat,
          date_action: new Date().toISOString(),
          user_agent: navigator?.userAgent || 'Unknown',
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error logging user activity:', error);
    throw error;
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (userId: string): Promise<UserStats | null> => {
  try {
    const { data, error } = await db()
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

/**
 * Suspend user account
 */
export const suspendUser = async (userId: string, raison?: string): Promise<UserProfile> => {
  try {
    // @ts-ignore
    const { data, error } = await db()
      .from('users')
      .update({
        statut_compte: 'suspendu',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await logUserActivity(userId, 'suspension', `Compte suspendu. Raison: ${raison || 'Non spécifiée'}`);

    return data;
  } catch (error) {
    console.error('Error suspending user:', error);
    throw error;
  }
};

/**
 * Activate user account
 */
export const activateUser = async (userId: string): Promise<UserProfile> => {
  try {
    // @ts-ignore
    const { data, error } = await db()
      .from('users')
      .update({
        statut_compte: 'actif',
        email_confirme: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the activity
    await logUserActivity(userId, 'activation', 'Compte activé');

    return data;
  } catch (error) {
    console.error('Error activating user:', error);
    throw error;
  }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await db()
      .from('users')
      .select('*')
      .eq('role', role);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users by role:', error);
    throw error;
  }
};

/**
 * Get users by organization
 */
export const getUsersByOrganization = async (organizationId: string): Promise<UserProfile[]> => {
  try {
    const { data, error } = await db()
      .from('users')
      .select('*')
      .eq('organisation_id', organizationId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching users by organization:', error);
    throw error;
  }
};
