/**
 * =====================================================
 * RETROUVONSLES - Personne Services - API Layer
 * API wrapper for personne operations
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  Personne,
  PersonnePhoto,
  LienFiliation,
  PersonneCreatePayload,
  PersonneUpdatePayload,
  PersonneFilter,
  PersonneStats,
} from '../types';

const db = { from: (table: string) => (supabase.from(table) as any) };

/**
 * Get all personnes with filters and pagination
 */
export const getPersonnes = async (
  filter?: PersonneFilter,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: Personne[]; total: number }> => {
  let query = db.from('personne').select('*', { count: 'exact' });

  if (filter?.sexe) {
    query = query.eq('sexe', filter.sexe);
  }

  if (filter?.nationalite) {
    query = query.eq('nationalite', filter.nationalite);
  }

  if (filter?.search) {
    query = query.or(
      `nom.ilike.%${filter.search}%,prenom.ilike.%${filter.search}%,nom_complet.ilike.%${filter.search}%,description_physique.ilike.%${filter.search}%`
    );
  }

  if (filter?.ageMin && filter?.ageMax) {
    query = query.gte('age_estime_min', filter.ageMin).lte('age_estime_max', filter.ageMax);
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
    data: (data || []).map((p: any) => ({
      ...p,
      date_naissance: p.date_naissance ? new Date(p.date_naissance) : undefined,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
    })),
    total: count || 0,
  };
};

/**
 * Get personne by ID
 */
export const getPersonneById = async (id: string): Promise<Personne | null> => {
  const { data, error } = await db.from('personne').select('*').eq('id', id).single();

  if (error && error.code === 'PGRST116') {
    return null;
  }
  if (error) throw error;

  return {
    ...data,
    date_naissance: data.date_naissance ? new Date(data.date_naissance) : undefined,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Create personne
 */
export const createPersonne = async (
  payload: PersonneCreatePayload,
  userId: string
): Promise<Personne> => {
  const { data, error } = await db
    .from('personne')
    .insert({
      ...payload,
      cree_par: userId,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    date_naissance: data.date_naissance ? new Date(data.date_naissance) : undefined,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Update personne
 */
export const updatePersonne = async (
  id: string,
  payload: PersonneUpdatePayload
): Promise<Personne> => {
  const { data, error } = await db
    .from('personne')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    date_naissance: data.date_naissance ? new Date(data.date_naissance) : undefined,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

/**
 * Delete personne
 */
export const deletePersonne = async (id: string): Promise<void> => {
  const { error } = await db.from('personne').delete().eq('id', id);
  if (error) throw error;
};

/**
 * Get personne photos
 */
export const getPersonnePhotos = async (personneId: string): Promise<PersonnePhoto[]> => {
  const { data, error } = await db
    .from('personne_photos')
    .select('*')
    .eq('personne_id', personneId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((p: any) => ({
    ...p,
    created_at: new Date(p.created_at),
    updated_at: new Date(p.updated_at),
  }));
};

/**
 * Add personne photo
 */
export const addPersonnePhoto = async (
  personneId: string,
  url: string,
  type_photo: string
): Promise<PersonnePhoto> => {
  const { data, error } = await db
    .from('personne_photos')
    .insert({
      personne_id: personneId,
      url,
      type_photo,
      qualite_image: 'moyenne',
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
 * Delete personne photo
 */
export const deletePersonnePhoto = async (photoId: string): Promise<void> => {
  const { error } = await db.from('personne_photos').delete().eq('id', photoId);
  if (error) throw error;
};

/**
 * Get filiation links for a personne
 */
export const getPersonneFiliations = async (personneId: string): Promise<LienFiliation[]> => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .or(`id_personne_source.eq.${personneId},id_personne_cible.eq.${personneId}`);

  if (error) throw error;

  return data || [];
};

/**
 * Create filiation link
 */
export const createFiliation = async (
  filiation: Omit<LienFiliation, 'id' | 'created_at' | 'updated_at'>
): Promise<LienFiliation> => {
  const { data, error } = await db
    .from('lien_filiation')
    .insert(filiation)
    .select()
    .single();

  if (error) throw error;

  return data;
};

/**
 * Update filiation
 */
export const updateFiliation = async (
  id: string,
  updates: Partial<LienFiliation>
): Promise<LienFiliation> => {
  const { data, error } = await db
    .from('lien_filiation')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return data;
};

/**
 * Get personne statistics
 */
export const getPersonneStats = async (): Promise<PersonneStats> => {
  const { data, error } = await db.from('personne').select('sexe, nationalite, statut_identite');

  if (error) throw error;

  const stats: PersonneStats = {
    total: data?.length || 0,
    parSexe: {
      masculin: (data || []).filter((p: any) => p.sexe === 'masculin').length,
      feminin: (data || []).filter((p: any) => p.sexe === 'feminin').length,
      inconnu: (data || []).filter((p: any) => p.sexe === 'inconnu').length,
      non_precise: (data || []).filter((p: any) => p.sexe === 'non_precise').length,
    },
    parNationalite: {},
    parStatutIdentite: {
      identifie: (data || []).filter((p: any) => p.statut_identite === 'identifie').length,
      partiellement_identifie: (data || []).filter((p: any) => p.statut_identite === 'partiellement_identifie').length,
      non_identifie: (data || []).filter((p: any) => p.statut_identite === 'non_identifie').length,
    },
    agesMoyens: {
      min: 0,
      max: 0,
    },
  };

  (data || []).forEach((p: any) => {
    if (p.nationalite) {
      stats.parNationalite[p.nationalite] = (stats.parNationalite[p.nationalite] || 0) + 1;
    }
  });

  return stats;
};

/**
 * Search personnes by physical description
 */
export const searchPersonnesByDescription = async (
  description: string
): Promise<Personne[]> => {
  const { data, error } = await db
    .from('personne')
    .select('*')
    .ilike('description_physique', `%${description}%`)
    .limit(20);

  if (error) throw error;

  return (data || []).map((p: any) => ({
    ...p,
    date_naissance: p.date_naissance ? new Date(p.date_naissance) : undefined,
    created_at: new Date(p.created_at),
    updated_at: new Date(p.updated_at),
  }));
};
