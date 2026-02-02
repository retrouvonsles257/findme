/**
 * =====================================================
 * RETROUVONSLES - Filiation API Service
 * Direct Supabase database operations for filiation links
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  FiliationLienDatabase,
  FiliationLienInput,
  FiliationLienUpdate,
  FiliationMatch,
  FiliationStatistics,
} from '../types';
import { StatutVerification } from '../../../@types/enums.types';

// Type-safe Supabase wrapper
const db = {
  from: (table: string) => (supabase.from(table) as any),
};

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new filiation link
 */
export const createFiliationLien = async (
  input: FiliationLienInput,
): Promise<FiliationLienDatabase> => {
  // Best-effort: récupérer l'utilisateur courant si non fourni
  let uid: string | null = input.cree_par || null;
  if (!uid) {
    try {
      const { data } = await (supabase as any).auth.getUser();
      uid = data?.user?.id || null;
    } catch {
      uid = null;
    }
  }

  const { data, error } = await db.from('lien_filiation').insert({
    type_lien: input.type_lien,
    id_personne_source: input.id_personne_source,
    id_personne_cible: input.id_personne_cible,
    precision_lien: input.precision_lien,
    nature_filiation: input.nature_filiation,
    statut_verification: input.statut_verification,
    type_preuve: input.type_preuve,
    score_compatibilite_physique: input.score_compatibilite_physique,
    autorite_parentale: input.autorite_parentale,
    date_etablissement_lien: input.date_etablissement_lien,
    document_justificatif: input.document_justificatif,
    commentaire: input.commentaire,
    confidentiel: input.confidentiel || false,
    // Par défaut: NON public (sinon fuite d'infos familiales)
    visible_public: input.visible_public ?? false,
    cree_par: uid,
    modifie_par: input.modifie_par || uid,
    generation: 0,
    ligne_directe: false,
    personne_contact_principal: false,
    donnees_genetiques_disponibles: false,
  }).select().single();

  if (error) throw error;
  return data;
};

/**
 * Get filiation link by ID
 */
export const getFiliationLienById = async (id: string): Promise<FiliationLienDatabase> => {
  const { data, error } = await db.from('lien_filiation').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
};

/**
 * Get all filiation links for a person
 */
export const getFiliationLiensByPersonne = async (idPersonne: string) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .or(`id_personne_source.eq.${idPersonne},id_personne_cible.eq.${idPersonne}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

/**
 * Get parent links for a person
 */
export const getParents = async (idPersonne: string) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .eq('id_personne_cible', idPersonne)
    .in('type_lien', [
      'pere_biologique',
      'mere_biologique',
      'pere_adoptif',
      'mere_adoptive',
    ]);

  if (error) throw error;
  return data || [];
};

/**
 * Get children links for a person
 */
export const getEnfants = async (idPersonne: string) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .eq('id_personne_source', idPersonne)
    .in('type_lien', [
      'enfant_biologique',
      'enfant_adoptif',
    ]);

  if (error) throw error;
  return data || [];
};

/**
 * Get siblings for a person
 */
export const getFratrie = async (idPersonne: string) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .or(`id_personne_source.eq.${idPersonne},id_personne_cible.eq.${idPersonne}`)
    .in('type_lien', [
      'frere_biologique',
      'soeur_biologique',
      'demi_frere',
      'demi_soeur',
    ]);

  if (error) throw error;
  return data || [];
};

/**
 * Update filiation link
 */
export const updateFiliationLien = async (
  id: string,
  input: FiliationLienUpdate,
): Promise<FiliationLienDatabase> => {
  const updateData = {
    ...input,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await db
    .from('lien_filiation')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete filiation link
 */
export const deleteFiliationLien = async (id: string): Promise<void> => {
  const { error } = await db.from('lien_filiation').delete().eq('id', id);

  if (error) throw error;
};

/**
 * Verify filiation link
 */
export const verifyFiliationLien = async (
  id: string,
  statut: StatutVerification,
  typePreuve: string,
  notes?: string,
): Promise<FiliationLienDatabase> => {
  const { data, error } = await db
    .from('lien_filiation')
    .update({
      statut_verification: statut,
      type_preuve: typePreuve,
      commentaire: notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// TREE OPERATIONS
// ============================================

/**
 * Get full family tree for a person
 */
export const getFamilyTree = async (idPersonne: string) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select(
      `
      *,
      personne_source:id_personne_source(id, nom, prenom, date_naissance, sexe, photo),
      personne_cible:id_personne_cible(id, nom, prenom, date_naissance, sexe, photo)
    `,
    )
    .or(`id_personne_source.eq.${idPersonne},id_personne_cible.eq.${idPersonne}`);

  if (error) throw error;
  return data || [];
};

/**
 * Get extended family connections
 */
export const getExtendedFamily = async (_idPersonne: string, generations: number = 3) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select(
      `
      *,
      personne_source:id_personne_source(id, nom, prenom, date_naissance, sexe),
      personne_cible:id_personne_cible(id, nom, prenom, date_naissance, sexe)
    `,
    )
    .lte('generation', generations);

  if (error) throw error;
  return data || [];
};

// ============================================
// MATCHING & ANALYSIS
// ============================================

/**
 * Find potential matches by physical characteristics
 */
export const findPotentialMatches = async (
  idPersonne: string,
  scoreMin: number = 70,
): Promise<FiliationMatch[]> => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .gte('score_compatibilite_physique', scoreMin)
    .or(`id_personne_source.eq.${idPersonne},id_personne_cible.eq.${idPersonne}`);

  if (error) throw error;
  return (data || []).map((lien: any) => ({
    id: lien.id,
    idPersonne1: lien.id_personne_source,
    idPersonne2: lien.id_personne_cible,
    scoreCompatibilite: lien.score_compatibilite_physique || 0,
    typeMatch: [lien.type_lien],
    caracteristiquesCommunes: lien.caracteristiques_communes
      ? Object.keys(lien.caracteristiques_communes)
      : [],
    fiabilite: 'probable' as const,
    statut: lien.statut_verification,
    dateAnalyse: lien.created_at,
  }));
};

// ============================================
// STATISTICS
// ============================================

/**
 * Get filiation statistics
 */
export const getFiliationStatistics = async (): Promise<FiliationStatistics> => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*', { count: 'exact' });

  if (error) throw error;

  const liens = data || [];

  // Count by status
  const par_statut: Record<string, number> = {};
  const par_type: Record<string, number> = {};
  let maxGeneration = 0;
  let liensVerifies = 0;
  let liensEnVerification = 0;

  liens.forEach((lien: any) => {
    // By status
    par_statut[lien.statut_verification] = (par_statut[lien.statut_verification] || 0) + 1;

    // By type
    par_type[lien.type_lien] = (par_type[lien.type_lien] || 0) + 1;

    // Generation max
    if (lien.generation > maxGeneration) maxGeneration = lien.generation;

    // Verification counting
    if ([StatutVerification.CONFIRME_OFFICIELLEMENT, StatutVerification.CONFIRME_GENETIQUEMENT].includes(lien.statut_verification)) {
      liensVerifies++;
    }
    if (lien.statut_verification === StatutVerification.EN_VERIFICATION) {
      liensEnVerification++;
    }
  });

  const totalLiens = liens.length;
  const tauxVerification = totalLiens > 0 ? (liensVerifies / totalLiens) * 100 : 0;

  return {
    totalLiens,
    liensVerifies,
    liensEnVerification,
    tauxVerification,
    liaisons_biologiques: par_type['biologique'] || 0,
    liaisons_adoptives: par_type['adoptive'] || 0,
    liaisons_par_alliance: par_type['par_alliance'] || 0,
    distributionParType: par_type as any,
    distributionParStatut: par_statut as any,
    generationsMax: maxGeneration,
  };
};

/**
 * Get recent verified links
 */
export const getRecentVerifiedLinks = async (limit: number = 10) => {
  const { data, error } = await db
    .from('lien_filiation')
    .select('*')
    .in('statut_verification', [
      StatutVerification.CONFIRME_OFFICIELLEMENT,
      StatutVerification.CONFIRME_GENETIQUEMENT,
    ])
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};
