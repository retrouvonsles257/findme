/**
 * =====================================================
 * RETROUVONSLES - Supabase Database Service
 * =====================================================
 * 
 * Service pour opérations CRUD sur les tables Supabase
 * Gestion des Personnes, Utilisateurs, Organisations, etc.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseClientManager, retryWithBackoff, handleSupabaseError } from './supabaseClient';
import { UUID } from '../../@types/database.types';
import { Personne, Utilisateur, LienFiliation } from '../../@types/database.types';

// ============================================
// TYPES
// ============================================

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
  select?: string;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface DatabaseResult<T> {
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: string;
  };
  count?: number;
}

export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

// ============================================
// DATABASE SERVICE
// ============================================

export class DatabaseService {
  private client: SupabaseClient;
  private static instance: DatabaseService | null = null;

  private constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!this.instance) {
      const client = SupabaseClientManager.getInstance();
      this.instance = new DatabaseService(client);
    }
    return this.instance;
  }

  // ============================================
  // GENERIC CRUD OPERATIONS
  // ============================================

  /**
   * Fetch single record
   */
  async getOne<T>(
    table: string,
    id: UUID,
    select?: string
  ): Promise<DatabaseResult<T>> {
    try {
      return await retryWithBackoff(async () => {
        const query = this.client
          .from(table)
          .select(select || '*')
          .eq('id', id)
          .single();

        const { data, error } = await query;

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: data as T };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch record',
          code: 'GET_ONE_ERROR',
        },
      };
    }
  }

  /**
   * Fetch multiple records
   */
  async getMany<T>(
    table: string,
    options?: QueryOptions,
    filters?: FilterOptions
  ): Promise<DatabaseResult<T[]>> {
    try {
      return await retryWithBackoff(async () => {
        let query = this.client
          .from(table)
          .select(options?.select || '*', { count: 'exact' });

        // Apply filters
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (Array.isArray(value)) {
                query = query.in(key, value);
              } else {
                query = query.eq(key, value);
              }
            }
          });
        }

        // Apply ordering
        if (options?.orderBy) {
          query = query.order(options.orderBy, {
            ascending: options.ascending !== false,
          });
        }

        // Apply pagination
        if (options?.limit) {
          query = query.limit(options.limit);
          if (options?.offset) {
            query = query.range(options.offset, options.offset + options.limit - 1);
          }
        }

        const { data, error, count } = await query;

        if (error) {
          throw handleSupabaseError(error);
        }

        return {
          data: data as T[],
          count: count || 0,
        };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch records',
          code: 'GET_MANY_ERROR',
        },
      };
    }
  }

  /**
   * Create record
   */
  async create<T>(
    table: string,
    record: Partial<T>
  ): Promise<DatabaseResult<T>> {
    try {
      return await retryWithBackoff(async () => {
        const { data, error } = await this.client
          .from(table)
          .insert([record])
          .select('*')
          .single();

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: data as T };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to create record',
          code: 'CREATE_ERROR',
        },
      };
    }
  }

  /**
   * Update record
   */
  async update<T>(
    table: string,
    id: UUID,
    updates: Partial<T>
  ): Promise<DatabaseResult<T>> {
    try {
      return await retryWithBackoff(async () => {
        const { data, error } = await this.client
          .from(table)
          .update(updates)
          .eq('id', id)
          .select('*')
          .single();

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: data as T };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to update record',
          code: 'UPDATE_ERROR',
        },
      };
    }
  }

  /**
   * Delete record
   */
  async delete(table: string, id: UUID): Promise<DatabaseResult<void>> {
    try {
      return await retryWithBackoff(async () => {
        const { error } = await this.client
          .from(table)
          .delete()
          .eq('id', id);

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: undefined };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to delete record',
          code: 'DELETE_ERROR',
        },
      };
    }
  }

  /**
   * Batch create
   */
  async batchCreate<T>(
    table: string,
    records: Partial<T>[]
  ): Promise<DatabaseResult<T[]>> {
    if (records.length === 0) {
      return { data: [] };
    }

    try {
      return await retryWithBackoff(async () => {
        const { data, error } = await this.client
          .from(table)
          .insert(records)
          .select('*');

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: data as T[] };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to batch create records',
          code: 'BATCH_CREATE_ERROR',
        },
      };
    }
  }

  /**
   * Batch update
   */
  async batchUpdate<T>(
    table: string,
    updates: Array<{ id: UUID; data: Partial<T> }>
  ): Promise<DatabaseResult<T[]>> {
    if (updates.length === 0) {
      return { data: [] };
    }

    try {
      const results: T[] = [];
      const errors: Array<{ index: number; error: string }> = [];

      for (let i = 0; i < updates.length; i++) {
        const { id, data } = updates[i];
        const { data: updated, error } = await this.client
          .from(table)
          .update(data)
          .eq('id', id)
          .select('*')
          .single();

        if (error) {
          errors.push({ index: i, error: error.message });
        } else if (updated) {
          results.push(updated as T);
        }
      }

      return {
        data: results,
        error:
          errors.length > 0
            ? {
                message: `${errors.length} records failed to update`,
                code: 'BATCH_UPDATE_PARTIAL_ERROR',
              }
            : undefined,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to batch update records',
          code: 'BATCH_UPDATE_ERROR',
        },
      };
    }
  }

  /**
   * Batch delete
   */
  async batchDelete(table: string, ids: UUID[]): Promise<DatabaseResult<void>> {
    if (ids.length === 0) {
      return { data: undefined };
    }

    try {
      return await retryWithBackoff(async () => {
        const { error } = await this.client
          .from(table)
          .delete()
          .in('id', ids);

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: undefined };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to batch delete records',
          code: 'BATCH_DELETE_ERROR',
        },
      };
    }
  }

  // ============================================
  // SPECIALIZED QUERIES
  // ============================================

  /**
   * Search personnes
   */
  async searchPersonnes(query: string, limit: number = 10): Promise<DatabaseResult<Personne[]>> {
    try {
      return await retryWithBackoff(async () => {
        const { data, error } = await this.client
          .from('personnes')
          .select('*')
          .or(
            `nom_complet.ilike.%${query}%,prenom.ilike.%${query}%,alias.ilike.%${query}%`
          )
          .limit(limit);

        if (error) {
          throw handleSupabaseError(error);
        }

        return { data: data as Personne[] };
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Search failed',
          code: 'SEARCH_ERROR',
        },
      };
    }
  }

  /**
   * Get personnes by criteria
   */
  async getPersonnesByCriteria(
    criteria: Partial<Personne>,
    options?: QueryOptions
  ): Promise<DatabaseResult<Personne[]>> {
    return this.getMany<Personne>('personnes', options, criteria as FilterOptions);
  }

  /**
   * Get utilisateurs by organisation
   */
  async getUtilisateursByOrganisation(
    orgId: UUID,
    options?: QueryOptions
  ): Promise<DatabaseResult<Utilisateur[]>> {
    return this.getMany<Utilisateur>(
      'utilisateurs',
      options,
      { id_organisation: orgId } as FilterOptions
    );
  }

  /**
   * Get liaisonsmatching with physical characteristics
   */
  async getLiaisonsWithCharacteristics(
    personneId: UUID
  ): Promise<DatabaseResult<LienFiliation[]>> {
    try {
      const { data, error } = await this.client
        .from('liens_filiations')
        .select('*')
        .or(
          `id_personne_source.eq.${personneId},id_personne_cible.eq.${personneId}`
        )
        .order('score_compatibilite_physique', { ascending: false });

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: data as LienFiliation[] };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch liens',
          code: 'LIENS_FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Get dossiers for personne
   */
  async getDossiersForPersonne(
    personneId: UUID
  ): Promise<DatabaseResult<any[]>> {
    try {
      const { data, error } = await this.client
        .from('dossiers')
        .select('*')
        .eq('id_personne', personneId)
        .order('created_at', { ascending: false });

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: data as any[] };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Failed to fetch dossiers',
          code: 'DOSSIERS_FETCH_ERROR',
        },
      };
    }
  }

  /**
   * Count records with filters
   */
  async count(
    table: string,
    filters?: FilterOptions
  ): Promise<DatabaseResult<number>> {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              query = query.in(key, value);
            } else {
              query = query.eq(key, value);
            }
          }
        });
      }

      const { count, error } = await query;

      if (error) {
        throw handleSupabaseError(error);
      }

      return { data: count || 0 };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Count failed',
          code: 'COUNT_ERROR',
        },
      };
    }
  }

  /**
   * Check if record exists
   */
  async exists(table: string, id: UUID): Promise<DatabaseResult<boolean>> {
    try {
      const result = await this.count(table, { id });
      return {
        data: (result.data || 0) > 0,
      };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Existence check failed',
          code: 'EXISTS_ERROR',
        },
      };
    }
  }
}

export default DatabaseService;
