/**
 * =====================================================
 * RETROUVONSLES - Signalement API Service
 * API calls for signalement operations
 * =====================================================
 */

import { supabase } from '../../../config';
import type {
  Signalement,
  SignalementCreatePayload,
  SignalementUpdatePayload,
  SignalementValidationPayload,
  SignalementContact,
  SignalementVerification,
  SignalementStats,
} from '../types';

// Helper to bypass Supabase typing issues
const db = () => (supabase as any);

/**
 * Get all signalements with pagination
 */
export async function getSignalements(page: number = 1, pageSize: number = 20): Promise<{
  data: Signalement[];
  total: number;
}> {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  const { data, count, error } = await supabase
    .from('signalement')
    .select('*', { count: 'exact' })
    .order('date_observation', { ascending: false })
    .range(start, end - 1);

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
  };
}

/**
 * Get signalement by ID
 */
export async function getSignalementById(id: string): Promise<Signalement> {
  const { data, error } = await db().from('signalement').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
}

/**
 * Create new signalement
 */
export async function createSignalement(
  payload: SignalementCreatePayload,
  userId: string
): Promise<Signalement> {
  const { data, error } = await (supabase
    .from('signalement') as any)
    // @ts-ignore - Supabase typing issue with dynamic tables
    .insert({
      ...payload,
      id_utilisateur: userId,
      statut_validation: 'en_attente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update signalement
 */
export async function updateSignalement(
  id: string,
  payload: SignalementUpdatePayload
): Promise<Signalement> {
  const { data, error } = await supabase
    .from('signalement')
    // @ts-ignore - Supabase typing issue with dynamic tables
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete signalement
 */
export async function deleteSignalement(id: string): Promise<void> {
  const { error } = await db().from('signalement').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Search signalements by description/location
 */
export async function searchSignalements(query: string): Promise<Signalement[]> {
  const { data, error } = await supabase
    .from('signalement')
    .select('*')
    .or(`description.ilike.%${query}%,lieu_observation.ilike.%${query}%`)
    .order('date_observation', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data || [];
}

/**
 * Get signalements by location (nearby)
 */
export async function getSignalementsByLocation(
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<Signalement[]> {
  const { data, error } = await supabase
    .from('signalement')
    .select('*')
    .eq('statut_validation', 'valide')
    .order('date_observation', { ascending: false });

  if (error) throw error;

  // Filter by distance (simple distance calculation)
  const earthRadiusKm = 6371;
  return (data || []).filter((s: Signalement) => {
    if (!s.latitude_observation || !s.longitude_observation) return false;
    const dLat = ((s.latitude_observation - latitude) * Math.PI) / 180;
    const dLon = ((s.longitude_observation - longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latitude * Math.PI) / 180) *
        Math.cos((s.latitude_observation * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadiusKm * c;
    return distance <= radiusKm;
  });
}

/**
 * Get signalement contacts
 */
export async function getSignalementContacts(signalementId: string): Promise<SignalementContact[]> {
  const { data, error } = await supabase
    .from('signalement_contacts')
    .select('*')
    .eq('signalement_id', signalementId);

  if (error) throw error;
  return data || [];
}

/**
 * Add contact to signalement
 */
export async function addSignalementContact(
  signalementId: string,
  contact: Omit<SignalementContact, 'id' | 'signalement_id'>
): Promise<SignalementContact> {
  const { data, error } = await (supabase
    .from('signalement_contacts') as any)
    // @ts-ignore - Supabase typing issue with dynamic tables
    .insert({
      ...contact,
      signalement_id: signalementId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete signalement contact
 */
export async function deleteSignalementContact(contactId: string): Promise<void> {
  const { error } = await db().from('signalement_contacts').delete().eq('id', contactId);
  if (error) throw error;
}

/**
 * Get signalement verifications from journal_activite
 */
export async function getSignalementVerifications(
  signalementId: string
): Promise<SignalementVerification[]> {
  // Récupérer les vérifications depuis journal_activite
  const { data, error } = await db()
    .from('journal_activite')
    .select('*')
    .eq('type_action', 'validation_signalement')
    .eq('id_signalement', signalementId)
    .order('date_action', { ascending: false });

  if (error) {
    console.error('Error fetching verifications:', error);
    return [];
  }
  
  // Transformer en format SignalementVerification
  return (data || []).map((log: any) => ({
    id: log.id,
    signalement_id: signalementId,
    verificateur_id: log.id_utilisateur,
    date_verification: log.date_action,
    decision: log.action_detaillee?.includes('approuv') ? 'approuve' : 
              log.action_detaillee?.includes('rejet') ? 'rejete' : 'besoin_clarification',
    raison: log.description || '',
    score_confiance: 0.8,
    avis: log.action_detaillee || '',
  }));
}

/**
 * Add verification to signalement
 * Updates the signalement status and logs the action
 */
export async function addSignalementVerification(
  signalementId: string,
  verificateurId: string,
  payload: SignalementValidationPayload
): Promise<SignalementVerification> {
  // Determine new status based on decision
  const newStatut =
    payload.decision === 'approuve'
      ? 'valide'
      : payload.decision === 'rejete'
        ? 'invalide'
        : 'en_verification';

  // Update the signalement directly
  const { error: updateError } = await db()
    .from('signalement')
    .update({
      statut_validation: newStatut,
      verifie_par: verificateurId,
      date_verification: new Date().toISOString(),
      commentaire_verification: [
        `Décision: ${payload.decision}`,
        payload.raison ? `Raison: ${payload.raison}` : null,
        typeof payload.score_confiance === 'number' ? `Score: ${payload.score_confiance}` : null,
        payload.avis ? `Avis: ${payload.avis}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
      updated_at: new Date().toISOString(),
    })
    .eq('id', signalementId);

  if (updateError) {
    console.error('Error updating signalement:', updateError);
    throw updateError;
  }

  // Log the action in journal_activite
  const { error: logError } = await db()
    .from('journal_activite')
    .insert({
      type_action: 'validation_signalement',
      action_detaillee: payload.decision === 'approuve' 
        ? 'Signalement approuvé par modérateur'
        : payload.decision === 'rejete'
          ? 'Signalement rejeté par modérateur'
          : 'Signalement en attente de clarification',
      description: `Décision: ${payload.decision}, Raison: ${payload.raison}, Score: ${payload.score_confiance}`,
      id_utilisateur: verificateurId,
      id_signalement: signalementId,
    });

  if (logError) {
    console.error('Error logging action:', logError);
    // Continue even if logging fails
  }

  // Return a verification object
  return {
    id: signalementId,
    signalement_id: signalementId,
    verificateur_id: verificateurId,
    date_verification: new Date().toISOString(),
    decision: payload.decision,
    raison: payload.raison,
    score_confiance: payload.score_confiance,
    avis: payload.avis || '',
  };
}

/**
 * Get signalement statistics
 */
export async function getSignalementStats(): Promise<SignalementStats> {
  const { data, error } = await db().from('signalement').select('*');

  if (error) throw error;

  const stats: SignalementStats = {
    total: data?.length || 0,
    parEtat: {
      nouveau: data?.filter((s: Signalement) => s.statut_validation === 'en_attente').length || 0,
      en_cours: data?.filter((s: Signalement) => s.statut_validation === 'en_verification').length || 0,
      valide: data?.filter((s: Signalement) => s.statut_validation === 'valide').length || 0,
      rejete: data?.filter((s: Signalement) => s.statut_validation === 'invalide').length || 0,
      ferme: data?.filter((s: Signalement) => s.statut_validation === 'spam' || s.statut_validation === 'doublonne').length || 0,
    },
    parConfiance: {
      haute: data?.filter((s: Signalement) => s.score_correspondance && s.score_correspondance > 0.7).length || 0,
      moyenne:
        data?.filter((s: Signalement) => s.score_correspondance && s.score_correspondance > 0.4 && s.score_correspondance <= 0.7)
          .length || 0,
      basse:
        data?.filter((s: Signalement) => s.score_correspondance && s.score_correspondance <= 0.4).length || 0,
    },
    moyenneScore:
      data && data.length > 0
        ? data.reduce((sum: number, s: Signalement) => sum + (s.score_correspondance || 0), 0) / data.length
        : 0,
    derniers7jours:
      data?.filter((s: Signalement) => {
        const date = new Date(s.date_observation);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return date >= sevenDaysAgo;
      }).length || 0,
  };

  return stats;
}
/**
 * Get pending signalements (en_attente) for operator view
 * Returns signalements with status 'en_attente' linked to dossiers
 */
export async function getSignalementsEnAttente(
  organisationId?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: Signalement[]; total: number }> {
  // Tentative optimisée (pagination DB). Si le filtrage relationnel échoue selon la config PostgREST,
  // fallback sur l’ancienne logique (fetch all + filter).
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  try {
    let query = supabase
      .from('signalement')
      .select(
        `
        *,
        dossier:id_dossier!inner(numero_dossier, id_organisation_responsable)
      `,
        { count: 'exact' },
      )
      .eq('statut_validation', 'en_attente')
      .order('created_at', { ascending: false });

    if (organisationId) {
      query = query.eq('dossier.id_organisation_responsable', organisationId) as any;
    }

    const { data, error, count } = await (query as any).range(start, end);
    if (error) throw error;

    return {
      data: (data || []).map((s: any) => ({
        ...s,
        numero_dossier: s.dossier?.numero_dossier || 'N/A',
      })),
      total: count || 0,
    };
  } catch {
    // Fallback (robuste, mais plus lourd)
    const { data: allData, error: fetchError } = await supabase
      .from('signalement')
      .select(`
        *,
        dossier:id_dossier(numero_dossier, id_organisation_responsable)
      `)
      .eq('statut_validation', 'en_attente')
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    let allSignalements = allData || [];
    if (organisationId) {
      allSignalements = allSignalements.filter(
        (s: any) => s.dossier?.id_organisation_responsable === organisationId,
      );
    }

    const total = allSignalements.length;
    const paginatedData = allSignalements.slice(start, start + pageSize);

    return {
      data: paginatedData.map((s: any) => ({
        ...s,
        numero_dossier: s.dossier?.numero_dossier || 'N/A',
      })),
      total,
    };
  }
}

/**
 * Get signalements by dossier ID with user and temoin info
 */
export async function getSignalementsByDossierId(dossierId: string): Promise<Signalement[]> {
  const { data, error } = await db()
    .from('signalement')
    .select('*, utilisateur:id_utilisateur(nom, prenom)')
    .eq('id_dossier', dossierId)
    .order('date_observation', { ascending: false });

  if (error) {
    console.error('Error fetching signalements for dossier:', error);
    return [];
  }
  
  // Enrichir avec nom_temoin ou nom utilisateur
  return (data || []).map((sig: any) => ({
    ...sig,
    auteur: sig.nom_temoin || (sig.utilisateur ? `${sig.utilisateur.prenom || ''} ${sig.utilisateur.nom || ''}`.trim() : 'Anonyme'),
  }));
}