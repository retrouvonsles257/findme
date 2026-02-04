/**
 * =====================================================
 * RETROUVONSLES - Alerte API Service
 * Appels directes à la base de données Supabase
 * =====================================================
 */

import { supabase } from '../../../config/supabase.config';
import type {
  Alerte,
  StatutAlerte,
  TypeAlerte,
  NiveauUrgence,
} from '../../../@types';
import { StatutAlerte as StatutAlerteEnum } from '../../../@types/enums.types';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface AlerteCreateInput {
  titre: string;
  message: string;
  message_court?: string;
  type_alerte: TypeAlerte;
  id_dossier: string;
  latitude_centre?: number;
  longitude_centre?: number;
  rayon_km?: number;
  zones_specifiques?: Record<string, any>;
  date_expiration?: string;
  canaux_diffusion?: string[];
  niveau_urgence_min?: number;
  types_utilisateurs?: string[];
}

export interface AlerteUpdateInput {
  titre?: string;
  message?: string;
  message_court?: string;
  statut_alerte?: StatutAlerte;
  date_expiration?: string;
  rayon_km?: number;
  nombre_vues?: number;
  nombre_partages?: number;
  nombre_signalements_generes?: number;
  nombre_destinataires?: number;
  nombre_envois_reussis?: number;
}

export interface AlerteFilters {
  statut?: StatutAlerte[];
  type_alerte?: TypeAlerte[];
  niveau_urgence?: NiveauUrgence[];
  id_dossier?: string;
  /** Filtre par organisation : uniquement les alertes des dossiers de cette organisation */
  id_organisation_responsable?: string;
  date_min?: string;
  date_max?: string;
  limit?: number;
  offset?: number;
}

export interface AlerteStats {
  total: number;
  par_statut: Record<StatutAlerte, number>;
  par_type: Record<TypeAlerte, number>;
  active: number;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Créer une nouvelle alerte
 */
export const createAlerte = async (input: AlerteCreateInput): Promise<Alerte> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Non authentifié');

  // Préparer les données pour l'insertion
  // Supabase convertit automatiquement les tableaux en JSONB
  const insertData = {
    titre: input.titre,
    message: input.message,
    message_court: input.message_court || input.message.substring(0, 500),
    type_alerte: input.type_alerte,
    id_dossier: input.id_dossier,
    latitude_centre: input.latitude_centre || null,
    longitude_centre: input.longitude_centre || null,
    rayon_km: input.rayon_km || 50,
    zones_specifiques: input.zones_specifiques || null,
    date_diffusion: new Date().toISOString(),
    date_expiration: input.date_expiration || null,
    canaux_diffusion: input.canaux_diffusion || ['push', 'in_app'],
    statut_alerte: StatutAlerteEnum.BROUILLON,
    niveau_urgence_min: input.niveau_urgence_min || 1,
    types_utilisateurs: input.types_utilisateurs || null,
    id_utilisateur_createur: user.id,
    numero_alerte: `ALE-${Date.now()}`,
  };

  const { data, error } = await supabase
    .from('alerte')
    .insert([insertData] as any)
    .select()
    .single();

  if (error) {
    console.error('[alerteAPI] Erreur création alerte:', error);
    console.error('[alerteAPI] Données envoyées:', insertData);
    throw new Error(error.message || 'Erreur lors de la création de l\'alerte');
  }

  // Log action in journal_activite
  await (supabase as any).from('journal_activite').insert({
    type_action: 'creation_dossier',
    action_detaillee: 'Création d\'une nouvelle alerte',
    description: `Alerte "${input.titre}" créée pour le dossier ${input.id_dossier}`,
    id_utilisateur: user.id,
    id_alerte: (data as any).id,
    id_dossier: input.id_dossier,
    date_action: new Date().toISOString(),
  });

  return data as Alerte;
};

/**
 * Récupérer une alerte par ID
 */
export const getAlerteById = async (id: string): Promise<Alerte> => {
  const { data, error } = await supabase
    .from('alerte')
    .select('*, dossier_disparition:id_dossier(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Récupérer toutes les alertes avec filtres
 * Si id_organisation_responsable est fourni, ne retourne que les alertes liées aux dossiers de cette organisation.
 */
export const getAlertes = async (filters?: AlerteFilters): Promise<Alerte[]> => {
  let query = supabase
    .from('alerte')
    .select('*, dossier_disparition:id_dossier(*)');

  if (filters?.id_organisation_responsable) {
    const { data: dossierIds } = await supabase
      .from('dossier_disparition')
      .select('id')
      .eq('id_organisation_responsable', filters.id_organisation_responsable);
    const ids = (dossierIds || []).map((d: { id: string }) => d.id);
    if (ids.length === 0) return [];
    query = query.in('id_dossier', ids);
  }
  if (filters?.statut) {
    query = query.in('statut_alerte', filters.statut);
  }
  if (filters?.type_alerte) {
    query = query.in('type_alerte', filters.type_alerte);
  }
  if (filters?.id_dossier) {
    query = query.eq('id_dossier', filters.id_dossier);
  }
  if (filters?.date_min) {
    query = query.gte('date_diffusion', filters.date_min);
  }
  if (filters?.date_max) {
    query = query.lte('date_diffusion', filters.date_max);
  }

  query = query.order('date_diffusion', { ascending: false });

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Mettre à jour une alerte
 */
export const updateAlerte = async (id: string, input: AlerteUpdateInput): Promise<Alerte> => {
  const { data, error } = (await (supabase as any)
    .from('alerte')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()) as any;

  if (error) throw error;
  return data;
};

/**
 * Supprimer une alerte
 */
export const deleteAlerte = async (id: string): Promise<void> => {
  const user = (await supabase.auth.getUser()).data.user;
  
  // Get alerte info before deletion for logging
  const { data: alerteData } = await (supabase as any).from('alerte').select('titre, id_dossier').eq('id', id).single();
  const alerte = alerteData as { titre?: string; id_dossier?: string } | null;

  const { error } = await supabase.from('alerte').delete().eq('id', id);
  if (error) throw error;

  // Log action in journal_activite
  if (user) {
    await (supabase as any).from('journal_activite').insert({
      type_action: 'autre',
      action_detaillee: 'Suppression d\'alerte',
      description: `Alerte "${alerte?.titre || id}" supprimée`,
      id_utilisateur: user.id,
      id_dossier: alerte?.id_dossier,
      date_action: new Date().toISOString(),
    });
  }
};

// ============================================
// STATUT OPERATIONS
// ============================================

/**
 * Changer le statut d'une alerte
 */
export const updateAlerteStatut = async (
  id: string,
  statut: StatutAlerte,
  commentaire?: string,
): Promise<Alerte> => {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Non authentifié');

  const updateData: Record<string, any> = {
    statut_alerte: statut,
    updated_at: new Date().toISOString(),
  };

  if (statut === 'en_cours') {
    updateData.date_diffusion = new Date().toISOString();
    updateData.id_utilisateur_validateur = user.id;
    updateData.date_validation = new Date().toISOString();
    updateData.validee = true;
    if (commentaire) {
      updateData.commentaire_validation = commentaire;
    }
  } else if (statut === 'terminee') {
    updateData.date_expiration = new Date().toISOString();
  }

  const result = await updateAlerte(id, updateData);

  // Log action in journal_activite
  const actionLabels: Record<string, string> = {
    'en_cours': 'Publication/Diffusion d\'alerte',
    'terminee': 'Clôture d\'alerte',
    'annulee': 'Annulation d\'alerte',
    'brouillon': 'Retour en brouillon de l\'alerte',
  };

  await (supabase as any).from('journal_activite').insert({
    type_action: 'diffusion_alerte',
    action_detaillee: actionLabels[statut] || `Changement de statut: ${statut}`,
    description: `Alerte ${id} passée au statut "${statut}"${commentaire ? `. Motif: ${commentaire}` : ''}`,
    id_utilisateur: user.id,
    id_alerte: id,
    date_action: new Date().toISOString(),
  });

  return result;
};

/**
 * Valider une alerte
 */
export const validateAlerte = async (
  id: string,
  commentaire?: string,
): Promise<Alerte> => {
  return updateAlerteStatut(id, StatutAlerteEnum.EN_COURS, commentaire);
};

/**
 * Annuler une alerte
 */
export const cancelAlerte = async (
  id: string,
  motif?: string,
): Promise<Alerte> => {
  return updateAlerteStatut(id, StatutAlerteEnum.ANNULEE, motif);
};

// ============================================
// DIFFUSION OPERATIONS
// ============================================

/**
 * Diffuser une alerte
 */
export const diffuserAlerte = async (
  id: string,
  canaux?: string[],
): Promise<{ success: boolean; nombre_destinataires: number }> => {
  const alerte = await getAlerteById(id);

  // Récupérer les utilisateurs concernés
  const { data: users, error: usersError } = await (supabase
    .from('utilisateur')
    .select('id, preferences_notification')
    .eq('accepte_notifications', true)
    .eq('statut_compte', 'actif') as any);

  if (usersError) throw usersError;
  const destinataires = (users as any[])?.length || 0;

  // Créer les enregistrements de notification
  const notifications = ((users as any[]) || []).map((user: any) => ({
    titre: alerte.titre,
    message: alerte.message,
    type: 'nouvelle_alerte',
    id_utilisateur: user.id,
    id_alerte: id,
    statut_envoi: 'en_attente',
    canal: (canaux || ['push'])[0],
  }));

  const { error: notifError } = await supabase
    .from('notification')
    .insert(notifications as any);

  if (notifError) throw notifError;

  // Mettre à jour l'alerte
  await updateAlerte(id, {
    nombre_destinataires: destinataires,
    nombre_envois_reussis: destinataires,
  });

  // Log diffusion action
  const user = (await supabase.auth.getUser()).data.user;
  if (user) {
    await (supabase as any).from('journal_activite').insert({
      type_action: 'diffusion_alerte',
      action_detaillee: 'Diffusion d\'alerte aux utilisateurs',
      description: `Alerte "${alerte.titre}" diffusée à ${destinataires} utilisateur(s)`,
      id_utilisateur: user.id,
      id_alerte: id,
      id_dossier: alerte.id_dossier,
      date_action: new Date().toISOString(),
    });
  }

  return {
    success: true,
    nombre_destinataires: destinataires,
  };
};

/**
 * Incrémenter le nombre de vues
 */
export const incrementAlerteViews = async (id: string): Promise<void> => {
  const alerte = await getAlerteById(id);
  await updateAlerte(id, {
    nombre_vues: (alerte.nombre_vues || 0) + 1,
  });
};

/**
 * Incrémenter le nombre de partages
 */
export const incrementAlerteShares = async (id: string): Promise<void> => {
  const alerte = await getAlerteById(id);
  await updateAlerte(id, {
    nombre_partages: (alerte.nombre_partages || 0) + 1,
  });
};

// ============================================
// ANALYTICS
// ============================================

/**
 * Récupérer les statistiques des alertes
 */
export const getAlerteStats = async (): Promise<AlerteStats> => {
  const { data, error } = await (supabase.from('alerte').select('statut_alerte, type_alerte') as any);

  if (error) throw error;

  const stats: AlerteStats = {
    total: data?.length || 0,
    par_statut: {} as Record<StatutAlerte, number>,
    par_type: {} as Record<TypeAlerte, number>,
    active: 0,
  };

  ((data || []) as any[]).forEach((alerte: any) => {
    // Par statut
    const status: string = alerte.statut_alerte;
    (stats.par_statut as any)[status] = ((stats.par_statut as any)[status] || 0) + 1;

    // Par type
    const type: string = alerte.type_alerte;
    (stats.par_type as any)[type] = ((stats.par_type as any)[type] || 0) + 1;

    // Active
    if (alerte.statut_alerte === StatutAlerteEnum.EN_COURS) {
      stats.active++;
    }
  });

  return stats;
};

/**
 * Récupérer les alertes actives pour une zone géographique
 */
export const getActivAlertesByZone = async (
  latitude: number,
  longitude: number,
  rayon_km: number = 50,
): Promise<Alerte[]> => {
  const { data, error } = await (supabase
    .rpc('get_alertes_by_zone', {
      lat: latitude,
      lon: longitude,
      radius_km: rayon_km,
    } as any) as any);

  if (error) throw error;
  return data || [];
};

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

/**
 * S'abonner aux changements d'alertes
 */
export const subscribeToAlertes = (
  callback: (payload: any) => void,
): (() => void) => {
  // Using Supabase v2 Realtime API
  const channel = (supabase as any)
    .channel('alerte')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'alerte' }, (payload: any) => {
      callback(payload);
    })
    .subscribe();

  return () => {
    (supabase as any).removeChannel(channel);
  };
};

/**
 * S'abonner aux alertes d'un dossier spécifique
 */
export const subscribeToAlertesByDossier = (
  dossierId: string,
  callback: (payload: any) => void,
): (() => void) => {
  const channel = (supabase as any)
    .channel(`alerte:${dossierId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alerte', filter: `id_dossier=eq.${dossierId}` },
      (payload: any) => {
        callback(payload);
      },
    )
    .subscribe();

  return () => {
    (supabase as any).removeChannel(channel);
  };
};
