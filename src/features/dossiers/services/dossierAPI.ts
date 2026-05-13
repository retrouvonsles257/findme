/**
 * =====================================================
 * RETROUVONSLES - Dossier API Service
 * Direct Supabase database operations
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  DossierDisparition,
} from '../../../@types/database.types';
import type {
  DossierFormValues,
  DossierUpdateInput,
  DossierFilterCriteria,
  DossierStatistics,
} from '../types';
import { StatutDossier, NiveauUrgence } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS FOR INPUTS
// ============================================

export interface DossierCreateInput extends DossierFormValues {
  id_personne?: string;
  id_utilisateur_createur?: string;
  id_organisation_responsable?: string;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateDossierNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `DOS-${year}${month}${day}-${random}`;
}

const ANON_VIEWER_STORAGE_KEY = 'retrouvonsles.viewer_id';

function getAnonymousViewerId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const existing = window.localStorage.getItem(ANON_VIEWER_STORAGE_KEY);
    if (existing?.trim()) return existing;
    const next = (window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`).toString();
    window.localStorage.setItem(ANON_VIEWER_STORAGE_KEY, next);
    return next;
  } catch {
    return 'fallback';
  }
}

// Type-safe Supabase wrapper
const db = {
  from: (table: string) => (supabase.from(table) as any),
};

export async function notifyDossierStatusChange(
  dossierId: string,
  previousStatus: string | null | undefined,
  nextStatus: string,
): Promise<void> {
  try {
    if (!nextStatus || previousStatus === nextStatus) return;

    const { data: dossier } = await db
      .from('dossier_disparition')
      .select('numero_dossier, id_organisation_responsable, id_utilisateur_createur')
      .eq('id', dossierId)
      .maybeSingle();
    if (!dossier) return;

    const title = nextStatus === 'retrouve_vivant' || nextStatus === 'retrouve_decede'
      ? 'Mise à jour majeure du dossier'
      : 'Statut du dossier mis à jour';
    const message = `Le dossier ${(dossier as any).numero_dossier || dossierId} est passé de "${previousStatus || 'inconnu'}" à "${nextStatus}".`;
    const nowIso = new Date().toISOString();

    const { data: authorities } = await db
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true)
      .eq('id_organisation', (dossier as any).id_organisation_responsable);

    const { data: reporters } = await db
      .from('signalement')
      .select('id_utilisateur')
      .eq('id_dossier', dossierId)
      .not('id_utilisateur', 'is', null);

    const recipients = new Set<string>();
    if ((dossier as any).id_utilisateur_createur) recipients.add((dossier as any).id_utilisateur_createur);
    (reporters || []).forEach((r: any) => r.id_utilisateur && recipients.add(r.id_utilisateur));
    (authorities || []).forEach((a: any) => a.id && recipients.add(a.id));

    const typeNotification = nextStatus === 'retrouve_vivant' || nextStatus === 'retrouve_decede'
      ? 'personne_retrouvee'
      : 'mise_a_jour_dossier';

    const rows = Array.from(recipients).map((idUtilisateur) => ({
      id_utilisateur: idUtilisateur,
      type_notification: typeNotification,
      titre: title,
      message,
      canal: 'push',
      priorite: nextStatus === 'retrouve_vivant' || nextStatus === 'retrouve_decede' ? 'haute' : 'moyenne',
      lue: false,
      id_dossier: dossierId,
      date_creation: nowIso,
      donnees_supplementaires: {
        event: 'dossier_status_changed',
        previous_status: previousStatus,
        next_status: nextStatus,
        dossier_id: dossierId,
      },
    }));
    if (rows.length > 0) {
      await db.from('notification').insert(rows);
    }
  } catch (error) {
    console.error('[dossierAPI] notifyDossierStatusChange error:', error);
  }
}

/**
 * Met à jour des champs sur `dossier_disparition` et envoie les notifications push
 * (via insert `notification`) si `statut_dossier` change réellement.
 * À utiliser pour les écrans qui ne passent pas par {@link updateDossier}.
 */
export async function patchDossierAndNotify(
  id: string,
  patch: Record<string, unknown>,
): Promise<DossierDisparition> {
  const { data: prevRow, error: prevErr } = await db
    .from('dossier_disparition')
    .select('statut_dossier')
    .eq('id', id)
    .maybeSingle();
  if (prevErr) throw prevErr;
  const previousStatus = (prevRow as any)?.statut_dossier ?? null;

  const updatePayload: Record<string, unknown> = {
    ...patch,
    derniere_activite: new Date().toISOString(),
  };

  const { data, error } = await db
    .from('dossier_disparition')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (Object.prototype.hasOwnProperty.call(patch, 'statut_dossier')) {
    const nextStatus = patch.statut_dossier as string;
    if (nextStatus && nextStatus !== previousStatus) {
      await notifyDossierStatusChange(id, previousStatus, nextStatus);
    }
  }

  return data as DossierDisparition;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new dossier
 */
export const createDossier = async (
  input: DossierCreateInput,
): Promise<DossierDisparition> => {
  const { data, error } = await db.from('dossier_disparition').insert({
    numero_dossier: input.numero_dossier || generateDossierNumber(),
    date_disparition: input.date_disparition,
    type_disparition: input.type_disparition,
    niveau_urgence: input.niveau_urgence,
    circonstances: input.circonstances,
    lieu_disparition: input.lieu_disparition,
    ville_disparition: input.ville_disparition,
    region_disparition: input.region_disparition,
    pays_disparition: input.pays_disparition,
    latitude_disparition: input.latitude_disparition,
    longitude_disparition: input.longitude_disparition,
    precision_lieu: input.precision_lieu,
    contexte_specifique: input.contexte_specifique,
    personnes_accompagnantes: input.personnes_accompagnantes,
    derniere_activite_connue: input.derniere_activite_connue,
    destination_prevue: input.destination_prevue,
    moyen_transport: input.moyen_transport,
    contact_famille_principale: input.contact_famille_principale,
    telephone_contact: input.telephone_contact,
    email_contact: input.email_contact,
    enqueteur_responsable: input.enqueteur_responsable,
    contact_enqueteur: input.contact_enqueteur,
    autorite_saisie: input.autorite_saisie,
    numero_plainte: input.numero_plainte,
    visible_public: input.visible_public || false,
    diffusion_autorisee: input.diffusion_autorisee || false,
    diffusion_medias: input.diffusion_medias || false,
    diffusion_reseaux_sociaux: input.diffusion_reseaux_sociaux || false,
    rayon_diffusion_km: input.rayon_diffusion_km || 50,
    zones_diffusion_prioritaire: input.zones_diffusion_prioritaire,
    statut_dossier: 'en_cours',
    id_personne: input.id_personne,
    id_utilisateur_createur: input.id_utilisateur_createur,
    id_organisation_responsable: input.id_organisation_responsable,
    nombre_signalements: 0,
    nombre_alertes_diffusees: 0,
    nombre_vues_fiche: 0,
    derniere_activite: new Date().toISOString(),
  }).select().single();

  if (error) throw error;
  return data;
};

/**
 * Get dossier by ID
 */
export const getDossierById = async (id: string): Promise<DossierDisparition> => {

  // Récupérer le dossier avec les données de la personne
  const { data, error } = await db
    .from('dossier_disparition')
    .select('*, personne:id_personne(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('[dossierAPI] Erreur getDossierById:', error);
    throw error;
  }

  if (!data) {

    throw new Error('Dossier non trouvé');
  }

  return data;
};

/**
 * Get multiple dossiers with filters
 */
export const getDossiers = async (filters?: DossierFilterCriteria) => {
  // Récupérer les dossiers avec les données de la personne
  let query: any = db
    .from('dossier_disparition')
    .select('*, personne:id_personne(nom, prenom, nom_complet)', { count: 'exact' });

  if (filters) {
    if (filters.organisation_id) {
      query = query.eq('id_organisation_responsable', filters.organisation_id);
    }

    if (filters.createur_id) {
      query = query.eq('id_utilisateur_createur', filters.createur_id);
    }

    if (filters.personne_id) {
      query = query.eq('id_personne', filters.personne_id);
    }

    if (filters.statut && filters.statut.length > 0) {
      query = query.in('statut_dossier', filters.statut);
    }

    if (filters.type_disparition && filters.type_disparition.length > 0) {
      query = query.in('type_disparition', filters.type_disparition);
    }

    if (filters.niveau_urgence && filters.niveau_urgence.length > 0) {
      query = query.in('niveau_urgence', filters.niveau_urgence);
    }

    if (filters.date_min) {
      query = query.gte('date_disparition', filters.date_min);
    }

    if (filters.date_max) {
      query = query.lte('date_disparition', filters.date_max);
    }

    if (filters.region && filters.region.length > 0) {
      query = query.in('region_disparition', filters.region);
    }

    if (filters.ville) {
      query = query.ilike('ville_disparition', `%${filters.ville}%`);
    }

    if (filters.search) {
      query = query.or(
        `numero_dossier.ilike.%${filters.search}%,circonstances.ilike.%${filters.search}%`,
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';
    const sortField =
      sortBy === 'date'
        ? 'date_disparition'
        : sortBy === 'urgence'
          ? 'niveau_urgence'
          : sortBy === 'signalements'
            ? 'nombre_signalements'
            : 'nombre_vues_fiche';

    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = filters.limit || 20;
    const offset = (filters.offset || 0) * limit;
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

/**
 * Update dossier
 */
export const updateDossier = async (
  id: string,
  input: DossierUpdateInput,
): Promise<DossierDisparition> => {
  let previousStatus: string | null = null;
  if (input.statut_dossier) {
    const { data: previous } = await db.from('dossier_disparition').select('statut_dossier').eq('id', id).maybeSingle();
    previousStatus = (previous as any)?.statut_dossier || null;
  }

  const updateData = {
    ...input,
    derniere_activite: new Date().toISOString(),
  };
  const { data, error } = await db.from('dossier_disparition')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  if (input.statut_dossier) {
    await notifyDossierStatusChange(id, previousStatus, input.statut_dossier);
  }
  return (data || {}) as DossierDisparition;
};

/**
 * Delete dossier
 */
export const deleteDossier = async (id: string): Promise<void> => {
  const { error } = await db.from('dossier_disparition').delete().eq('id', id);

  if (error) throw error;
};

/**
 * Get dossier statistics
 * @param organisationId - Si défini, restreint aux dossiers dont cette organisation est responsable.
 */
export const getDossierStatistics = async (organisationId?: string): Promise<DossierStatistics> => {
  let q = db.from('dossier_disparition').select('*', { count: 'exact' });
  if (organisationId) {
    q = q.eq('id_organisation_responsable', organisationId);
  }
  const { data, error } = await q;

  if (error) throw error;

  const dossiers = data || [];
  const now = new Date();

  // Count by status
  const par_statut: Record<string, number> = {};
  const par_type: Record<string, number> = {};
  const par_region: Record<string, number> = {};
  const par_urgence: Record<string, number> = {};

  const dossiers_ouverts_depuis_jours = {
    moins_24h: 0,
    moins_7j: 0,
    moins_30j: 0,
    plus_30j: 0,
  };

  dossiers.forEach((d: any) => {
    // By status
    par_statut[d.statut_dossier] = (par_statut[d.statut_dossier] || 0) + 1;

    // By type
    par_type[d.type_disparition] = (par_type[d.type_disparition] || 0) + 1;

    // By region
    par_region[d.region_disparition] = (par_region[d.region_disparition] || 0) + 1;

    // By urgence
    par_urgence[d.niveau_urgence] = (par_urgence[d.niveau_urgence] || 0) + 1;

    // Days since disappearance
    const daysDiff = Math.floor(
      (now.getTime() - new Date(d.date_disparition).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysDiff < 1) dossiers_ouverts_depuis_jours.moins_24h++;
    else if (daysDiff < 7) dossiers_ouverts_depuis_jours.moins_7j++;
    else if (daysDiff < 30) dossiers_ouverts_depuis_jours.moins_30j++;
    else dossiers_ouverts_depuis_jours.plus_30j++;
  });

  const total_dossiers = dossiers.length;
  const dossiers_resolus = (par_statut[StatutDossier.RETROUVE_VIVANT] || 0) +
    (par_statut[StatutDossier.RETROUVE_DECEDE] || 0);

  return {
    total_dossiers,
    dossiers_en_cours: par_statut[StatutDossier.EN_COURS] || 0,
    dossiers_resolus,
    dossiers_suspendus: par_statut[StatutDossier.SUSPENDU] || 0,
    taux_resolution: total_dossiers > 0 ? (dossiers_resolus / total_dossiers) * 100 : 0,
    par_urgence: par_urgence as Record<any, number>,
    par_type: par_type as Record<any, number>,
    par_region,
    par_statut: par_statut as Record<any, number>,
    dossiers_ouverts_depuis_jours,
    urgence_distribution: {
      critique: par_urgence[NiveauUrgence.CRITIQUE] || 0,
      urgent: par_urgence[NiveauUrgence.URGENT] || 0,
      normal: par_urgence[NiveauUrgence.NORMAL] || 0,
      faible: par_urgence[NiveauUrgence.FAIBLE] || 0,
    } as any,
    localisation_distribution: {
      localise: dossiers.filter((d: any) => d.latitude_disparition).length,
      zone_recherche: dossiers.filter((d: any) => d.zone_recherche_predite).length,
      inconnu: dossiers.filter((d: any) => !d.latitude_disparition).length,
    },
  };
};

/**
 * Get recent dossiers
 */
export const getRecentDossiers = async (limit: number = 10) => {
  const { data, error } = await db.from('dossier_disparition')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Get urgent dossiers
 */
export const getUrgentDossiers = async (limit: number = 10) => {
  const { data, error } = await db.from('dossier_disparition')
    .select('*')
    .in('niveau_urgence', [NiveauUrgence.CRITIQUE, NiveauUrgence.URGENT])
    .eq('statut_dossier', StatutDossier.EN_COURS)
    .order('date_disparition', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

/**
 * Update dossier statistics counters
 */
export const updateDossierStatistics = async (
  dossierId: string,
  stat: 'signalements' | 'alertes' | 'vues',
  increment: number = 1,
): Promise<void> => {
  const field =
    stat === 'signalements'
      ? 'nombre_signalements'
      : stat === 'alertes'
        ? 'nombre_alertes_diffusees'
        : 'nombre_vues_fiche';

  const { data: current } = await db.from('dossier_disparition')
    .select(field)
    .eq('id', dossierId)
    .single();

  if (!current) return;

  const currentValue = (current as any)[field] || 0;

  const updateObj: Record<string, any> = {};
  updateObj[field] = currentValue + increment;

  await db.from('dossier_disparition')
    .update(updateObj)
    .eq('id', dossierId);
};

/**
 * Enregistre une vue unique de fiche dossier.
 * - Utilisateur connecté: viewer_fingerprint = user:<id>
 * - Visiteur anonyme: viewer_fingerprint = visitor:<device_id localStorage>
 * Puis synchronise nombre_vues_fiche = nombre de viewers uniques.
 */
export const recordUniqueDossierView = async (dossierId: string): Promise<void> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const viewerFingerprint = user?.id
      ? `user:${user.id}`
      : `visitor:${getAnonymousViewerId()}`;

    const { data: existing } = await db
      .from('dossier_vue')
      .select('id, vues_count')
      .eq('id_dossier', dossierId)
      .eq('viewer_fingerprint', viewerFingerprint)
      .maybeSingle();

    if (existing?.id) {
      await db
        .from('dossier_vue')
        .update({
          last_seen_at: new Date().toISOString(),
          vues_count: ((existing as any).vues_count || 0) + 1,
        })
        .eq('id', existing.id);
    } else {
      await db.from('dossier_vue').insert({
        id_dossier: dossierId,
        id_utilisateur: user?.id ?? null,
        viewer_fingerprint: viewerFingerprint,
        source: 'web',
      });
    }

    const { count } = await db
      .from('dossier_vue')
      .select('id', { count: 'exact', head: true })
      .eq('id_dossier', dossierId);

    await db
      .from('dossier_disparition')
      .update({ nombre_vues_fiche: count || 0 })
      .eq('id', dossierId);
  } catch (error) {
    console.error('[dossierAPI] recordUniqueDossierView error:', error);
  }
};

/**
 * Mark dossier as resolved
 */
export const markDossierAsResolved = async (
  dossierId: string,
  lieu_decouverte: string,
  latitude?: number,
  longitude?: number,
  etat?: string,
): Promise<DossierDisparition> => {
  const { data: previous } = await db.from('dossier_disparition').select('statut_dossier').eq('id', dossierId).maybeSingle();
  const previousStatus = (previous as any)?.statut_dossier || null;
  const updateData = {
    statut_dossier: StatutDossier.RETROUVE_VIVANT,
    date_resolution: new Date().toISOString(),
    lieu_decouverte,
    latitude_decouverte: latitude,
    longitude_decouverte: longitude,
    etat_personne_retrouvee: etat,
    derniere_activite: new Date().toISOString(),
  };
  const { data, error } = await db.from('dossier_disparition')
    .update(updateData)
    .eq('id', dossierId)
    .select()
    .single();

  if (error) throw error;
  await notifyDossierStatusChange(dossierId, previousStatus, StatutDossier.RETROUVE_VIVANT);
  return (data || {}) as DossierDisparition;
};

/**
 * Get dossier actions/timeline
 */
export const getDossierActions = async (dossierId: string): Promise<any[]> => {
  const { data, error } = await db.from('dossier_actions_log')
    .select('*')
    .eq('id_dossier', dossierId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }
  return data || [];
};

/**
 * Create dossier action log
 */
export const logDossierAction = async (
  dossierId: string,
  actionType: string,
  description: string,
  userId?: string,
  data?: any,
): Promise<void> => {
  const { error } = await db.from('dossier_actions_log').insert({
    id_dossier: dossierId,
    type_action: actionType,
    description,
    data,
    id_utilisateur: userId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    return;
  }
};
