/**
 * =====================================================
 * RETROUVONSLES - Campagne API Service
 * Opérations Supabase pour les campagnes
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  CampagneSensibilisation,
  UUID,
} from '../../../@types';
import type {
  CampagneFilterCriteria,
  CampagneListResponse,
  CampagneCreatePayload,
  CampagneUpdatePayload,
  CampagneWithRelations,
} from '../types';

// ============================================
// FETCH OPERATIONS
// ============================================

/**
 * Récupère la liste de toutes les campagnes avec pagination
 */
export const getCampagnes = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: CampagneFilterCriteria,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
): Promise<CampagneListResponse> => {
  try {
    let query = supabase
      .from('campagne_sensibilisation')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters) {
      if (filters.statut && filters.statut.length > 0) {
        query = query.in('statut_campagne', filters.statut);
      }

      if (filters.type_campagne && filters.type_campagne.length > 0) {
        query = query.in('type_campagne', filters.type_campagne);
      }

      if (filters.organisations && filters.organisations.length > 0) {
        query = query.in('id_organisation', filters.organisations);
      }

      if (filters.search) {
        query = query.or(
          `titre.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      if (filters.date_from) {
        query = query.gte('date_debut', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('date_fin', filters.date_to);
      }

      if (filters.minBudget !== undefined) {
        query = query.gte('budget_alloue', filters.minBudget);
      }

      if (filters.maxBudget !== undefined) {
        query = query.lte('budget_alloue', filters.maxBudget);
      }
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    throw error;
  }
};

/**
 * Récupère une campagne spécifique par ID
 */
export const getCampagneById = async (id: UUID): Promise<CampagneWithRelations> => {
  try {
    const { data: campagne, error: campagneError } = await supabase
      .from('campagne_sensibilisation')
      .select('*')
      .eq('id', id)
      .single();

    if (campagneError) throw campagneError;
    if (!campagne) throw new Error('Campagne non trouvée');

    const campagneData = campagne as any;

    // Fetch related creator info
    let createur = undefined;
    if (campagneData.creee_par) {
      const { data: creatorData } = await supabase
        .from('utilisateur')
        .select('id, nom, prenom, email')
        .eq('id', campagneData.creee_par)
        .single();

      createur = creatorData || undefined;
    }

    // Fetch related organisation info
    let organisation = undefined;
    if (campagneData.id_organisation) {
      const { data: orgData } = await supabase
        .from('organisation')
        .select('id, nom')
        .eq('id', campagneData.id_organisation)
        .single();

      organisation = orgData || undefined;
    }

    const result: CampagneWithRelations = {
      ...(campagne as any),
      createur,
      organisation,
    };

    return result;
  } catch (error) {
    console.error('Erreur lors de la récupération de la campagne:', error);
    throw error;
  }
};

/**
 * Récupère les campagnes d'une organisation spécifique
 */
export const getCampagnesByOrganisation = async (
  organisationId: UUID,
  pageSize: number = 10,
): Promise<CampagneListResponse> => {
  try {
    const { data, error, count } = await supabase
      .from('campagne_sensibilisation')
      .select('*', { count: 'exact' })
      .eq('id_organisation', organisationId)
      .order('created_at', { ascending: false })
      .limit(pageSize);

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page: 1,
      pageSize,
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes de l\'organisation:', error);
    throw error;
  }
};

// ============================================
// CREATE OPERATION
// ============================================

/**
 * Crée une nouvelle campagne
 */
export const createCampagne = async (
  payload: CampagneCreatePayload,
): Promise<CampagneSensibilisation> => {
  try {
    const { data, error } = await (supabase
      .from('campagne_sensibilisation') as any)
      .insert([payload as any])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Campagne non créée');

    return data as CampagneSensibilisation;
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    throw error;
  }
};

// ============================================
// UPDATE OPERATION
// ============================================

/**
 * Met à jour une campagne existante
 */
export const updateCampagne = async (
  id: UUID,
  payload: CampagneUpdatePayload,
): Promise<CampagneSensibilisation> => {
  try {
    const { data, error } = await (supabase
      .from('campagne_sensibilisation') as any)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Campagne non trouvée');

    return data as CampagneSensibilisation;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une campagne
 */
export const updateCampagneStatus = async (
  id: UUID,
  statut: string,
): Promise<CampagneSensibilisation> => {
  try {
    const { data, error } = await (supabase
      .from('campagne_sensibilisation') as any)
      .update({
        statut_campagne: statut,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Campagne non trouvée');

    return data as CampagneSensibilisation;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    throw error;
  }
};

/**
 * Met à jour le budget d'une campagne
 */
export const updateCampagneBudget = async (
  id: UUID,
  budgetAlloue?: number,
  budgetDepense?: number,
): Promise<CampagneSensibilisation> => {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (budgetAlloue !== undefined) {
      updateData.budget_alloue = budgetAlloue;
    }

    if (budgetDepense !== undefined) {
      updateData.budget_depense = budgetDepense;
    }

    const { data, error } = await (supabase
      .from('campagne_sensibilisation') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Campagne non trouvée');

    return data as CampagneSensibilisation;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du budget:', error);
    throw error;
  }
};

/**
 * Met à jour les statistiques de la campagne
 */
export const updateCampagneStatistics = async (
  id: UUID,
  personnesTouchees?: number,
  interactions?: number,
): Promise<CampagneSensibilisation> => {
  try {
    const updateData: any = { updated_at: new Date().toISOString() };

    if (personnesTouchees !== undefined) {
      updateData.nombre_personnes_touchees = personnesTouchees;
    }

    if (interactions !== undefined) {
      updateData.nombre_interactions = interactions;
    }

    const { data, error } = await (supabase
      .from('campagne_sensibilisation') as any)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Campagne non trouvée');

    return data as CampagneSensibilisation;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des statistiques:', error);
    throw error;
  }
};

// ============================================
// DELETE OPERATION
// ============================================

/**
 * Supprime une campagne
 */
export const deleteCampagne = async (id: UUID): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campagne_sensibilisation')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    throw error;
  }
};

/**
 * Supprime plusieurs campagnes
 */
export const deleteCampagnes = async (ids: UUID[]): Promise<void> => {
  try {
    const { error } = await supabase
      .from('campagne_sensibilisation')
      .delete()
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    console.error('Erreur lors de la suppression des campagnes:', error);
    throw error;
  }
};

// ============================================
// REAL-TIME SUBSCRIPTION
// ============================================

/**
 * S'abonne aux changements en temps réel des campagnes
 */
export const subscribeToCampagnes = (
  _callback?: (payload: any) => void,
): (() => void) => {
  // Supabase subscriptions require proper channel setup
  // For now, returning a no-op unsubscribe function
  console.warn('Real-time subscriptions require additional Supabase setup');
  return () => {};
};

/**
 * S'abonne aux changements en temps réel d'une campagne spécifique
 */
export const subscribeToCampagne = (
  _campagneId?: UUID,
  _callback?: (payload: any) => void,
): (() => void) => {
  // Supabase subscriptions require proper channel setup
  // For now, returning a no-op unsubscribe function
  console.warn('Real-time subscriptions require additional Supabase setup');
  return () => {};
};
