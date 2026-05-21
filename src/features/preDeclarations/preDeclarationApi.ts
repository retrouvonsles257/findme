/**
 * Pré-déclarations citoyennes + messagerie texte (MVP).
 */
import { supabase } from '../../config';
import { NotificationTargets } from '../../utils/notificationTargets';
import { TypeAction } from '../../@types/enums.types';

const db = () => (supabase as any);

export type PreDeclarationStatut = 'soumise' | 'en_examen' | 'convertie' | 'rejetee';

export type MessageTypeMessagerie = 'texte' | 'demande_complement' | 'demande_piece' | 'note_systeme';

export interface PreDeclarationRow {
  id: string;
  id_utilisateur: string;
  id_organisation: string;
  statut: PreDeclarationStatut;
  id_dossier: string | null;
  motif_rejet?: string | null;
  rejetee_par?: string | null;
  rejetee_at?: string | null;
  nom_personne: string;
  prenom_personne: string;
  sexe: string;
  date_naissance: string | null;
  nationalite: string;
  date_disparition: string;
  lieu_disparition: string | null;
  ville_disparition: string | null;
  region_disparition: string | null;
  pays_disparition: string;
  latitude_disparition: number | null;
  longitude_disparition: number | null;
  type_disparition: string;
  niveau_urgence: string;
  circonstances: string;
  infos_complementaires: string | null;
  contact_nom: string | null;
  contact_telephone: string | null;
  contact_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationRow {
  id: string;
  id_pre_declaration?: string | null;
  id_dossier?: string | null;
  id_signalement?: string | null;
  statut: string;
  id_utilisateur_assigne?: string | null;
  id_organisation_escalade?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  id_conversation: string;
  id_auteur: string;
  corps: string;
  created_at: string;
  deleted_at?: string | null;
  type_message?: MessageTypeMessagerie;
  metadonnees?: Record<string, unknown> | null;
}

export interface MessagePieceJointeRow {
  id: string;
  id_message: string;
  nom_fichier: string;
  mime_type: string;
  taille_octets: number;
  url_storage: string;
  created_at: string;
}

export interface MessageReferenceRow {
  id: string;
  id_message: string;
  type_entite: string;
  id_entite: string;
  created_at: string;
}

export type MessagerieTacheStatut = 'ouverte' | 'en_cours' | 'faite' | 'annulee';

export interface MessagerieTacheRow {
  id: string;
  id_conversation: string;
  titre: string;
  description: string | null;
  statut: MessagerieTacheStatut;
  id_createur: string;
  created_at: string;
  updated_at: string;
}

export type MessageReferenceTypeEntite =
  | 'dossier'
  | 'personne'
  | 'signalement'
  | 'alerte'
  | 'document'
  | 'pre_declaration'
  | 'message'
  | 'localisation';

async function insertJournalActivite(params: {
  id_utilisateur: string | null;
  type_action: TypeAction;
  action_detaillee: string;
  description: string;
  id_dossier?: string | null;
  donnees_apres?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    await db().from('journal_activite').insert({
      id_utilisateur: params.id_utilisateur,
      type_action: params.type_action,
      action_detaillee: params.action_detaillee,
      description: params.description,
      date_action: new Date().toISOString(),
      id_dossier: params.id_dossier ?? null,
      donnees_apres: params.donnees_apres ?? null,
    });
  } catch (e) {
    console.error('[preDeclarationApi] insertJournalActivite', e);
  }
}

export interface PreDeclarationCreateInput {
  id_organisation: string;
  nom_personne: string;
  prenom_personne: string;
  sexe: string;
  date_naissance?: string | null;
  nationalite: string;
  date_disparition: string;
  lieu_disparition?: string | null;
  ville_disparition?: string | null;
  region_disparition?: string | null;
  pays_disparition: string;
  latitude_disparition?: number | null;
  longitude_disparition?: number | null;
  type_disparition: string;
  niveau_urgence: string;
  circonstances: string;
  infos_complementaires?: string | null;
  contact_nom?: string | null;
  contact_telephone?: string | null;
  contact_email?: string | null;
  /** Premier message optionnel dans le fil */
  message_initial?: string | null;
}

async function notifyAuthoritiesNewPreDeclaration(
  preDeclarationId: string,
  organisationId: string,
  excludeUserId?: string | null,
): Promise<void> {
  try {
    const { data: authorities } = await db()
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true)
      .eq('id_organisation', organisationId);

    const nowIso = new Date().toISOString();
    const url = `/authority/pre-declarations/${preDeclarationId}`;
    const rows = (authorities || [])
      .filter((u: any) => u.id && (!excludeUserId || u.id !== excludeUserId))
      .map((u: any) => ({
        id_utilisateur: u.id,
        type_notification: 'autre',
        titre: 'Nouvelle pré-déclaration citoyenne',
        message:
          'Un citoyen a soumis une pré-déclaration de disparition pour votre organisation. Ouvrez la conversation pour en prendre connaissance.',
        canal: 'push',
        priorite: 'haute',
        lue: false,
        date_creation: nowIso,
        url_action: url,
        donnees_supplementaires: {
          event: 'pre_declaration_created',
          pre_declaration_id: preDeclarationId,
          id_organisation: organisationId,
        },
      }));

    if (rows.length > 0) {
      await db().from('notification').insert(rows);
    }
  } catch (e) {
    console.error('[preDeclarationApi] notifyAuthoritiesNewPreDeclaration', e);
  }
}

async function notifyCitizenPreDeclarationRejected(
  citizenUserId: string,
  preDeclarationId: string,
  motif: string,
): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    await db().from('notification').insert({
      id_utilisateur: citizenUserId,
      type_notification: 'autre',
      titre: 'Pré-déclaration refusée',
      message: motif.slice(0, 500),
      canal: 'push',
      priorite: 'haute',
      lue: false,
      date_creation: nowIso,
      url_action: `/citizen/pre-declarations/${preDeclarationId}`,
      donnees_supplementaires: {
        event: 'pre_declaration_rejected',
        pre_declaration_id: preDeclarationId,
      },
    });
  } catch (e) {
    console.error('[preDeclarationApi] notifyCitizenPreDeclarationRejected', e);
  }
}

async function notifyCitizenPreDeclarationMessage(
  citizenUserId: string,
  preDeclarationId: string,
  senderIsAuthority: boolean,
): Promise<void> {
  if (!senderIsAuthority) return;
  try {
    const nowIso = new Date().toISOString();
    await db().from('notification').insert({
      id_utilisateur: citizenUserId,
      type_notification: 'message_autorite',
      titre: 'Message de l’autorité',
      message: 'Vous avez reçu un message concernant votre pré-déclaration.',
      canal: 'push',
      priorite: 'moyenne',
      lue: false,
      date_creation: nowIso,
      url_action: `/citizen/pre-declarations/${preDeclarationId}`,
      donnees_supplementaires: {
        event: 'pre_declaration_message',
        pre_declaration_id: preDeclarationId,
      },
    });
  } catch (e) {
    console.error('[preDeclarationApi] notifyCitizenPreDeclarationMessage', e);
  }
}

async function notifyAuthoritiesPreDeclarationReply(
  organisationId: string,
  preDeclarationId: string,
  excludeUserId: string,
): Promise<void> {
  try {
    const { data: authorities } = await db()
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true)
      .eq('id_organisation', organisationId);

    const nowIso = new Date().toISOString();
    const url = `/authority/pre-declarations/${preDeclarationId}`;
    const rows = (authorities || [])
      .filter((u: any) => u.id && u.id !== excludeUserId)
      .map((u: any) => ({
        id_utilisateur: u.id,
        type_notification: 'autre',
        titre: 'Nouveau message — pré-déclaration',
        message: 'Un citoyen a répondu sur une pré-déclaration.',
        canal: 'push',
        priorite: 'moyenne',
        lue: false,
        date_creation: nowIso,
        url_action: url,
        donnees_supplementaires: {
          event: 'pre_declaration_citizen_reply',
          pre_declaration_id: preDeclarationId,
        },
      }));

    if (rows.length > 0) {
      await db().from('notification').insert(rows);
    }
  } catch (e) {
    console.error('[preDeclarationApi] notifyAuthoritiesPreDeclarationReply', e);
  }
}

async function notifyCitizenDossierNewMessage(citizenUserId: string, dossierId: string): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    await db().from('notification').insert({
      id_utilisateur: citizenUserId,
      type_notification: 'message_autorite',
      titre: 'Message sur votre dossier',
      message: 'Vous avez reçu un message de l’autorité concernant un dossier.',
      canal: 'push',
      priorite: 'moyenne',
      lue: false,
      date_creation: nowIso,
      url_action: `/citizen/dossier/${dossierId}`,
      donnees_supplementaires: {
        event: 'dossier_messagerie_message',
        dossier_id: dossierId,
      },
    });
  } catch (e) {
    console.error('[preDeclarationApi] notifyCitizenDossierNewMessage', e);
  }
}

async function notifyAuthoritiesDossierReply(
  organisationId: string,
  dossierId: string,
  excludeUserId: string,
): Promise<void> {
  try {
    const { data: authorities } = await db()
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true)
      .eq('id_organisation', organisationId);

    const nowIso = new Date().toISOString();
    const url = `/authority/dossiers/${dossierId}`;
    const rows = (authorities || [])
      .filter((u: any) => u.id && u.id !== excludeUserId)
      .map((u: any) => ({
        id_utilisateur: u.id,
        type_notification: 'autre',
        titre: 'Nouveau message — dossier',
        message: 'Un citoyen a répondu sur le fil de messagerie d’un dossier.',
        canal: 'push',
        priorite: 'moyenne',
        lue: false,
        date_creation: nowIso,
        url_action: url,
        donnees_supplementaires: {
          event: 'dossier_messagerie_citizen_reply',
          dossier_id: dossierId,
        },
      }));

    if (rows.length > 0) {
      await db().from('notification').insert(rows);
    }
  } catch (e) {
    console.error('[preDeclarationApi] notifyAuthoritiesDossierReply', e);
  }
}

async function notifyCitizenSignalementNewMessage(reporterUserId: string, signalementId: string): Promise<void> {
  try {
    const nowIso = new Date().toISOString();
    await db().from('notification').insert({
      id_utilisateur: reporterUserId,
      type_notification: 'message_autorite',
      titre: 'Message sur votre signalement',
      message: 'Vous avez reçu un message de l’autorité concernant un signalement.',
      canal: 'push',
      priorite: 'moyenne',
      lue: false,
      date_creation: nowIso,
      url_action: NotificationTargets.citizen.signalement(signalementId),
      donnees_supplementaires: {
        event: 'signalement_messagerie_message',
        signalement_id: signalementId,
      },
    });
  } catch (e) {
    console.error('[preDeclarationApi] notifyCitizenSignalementNewMessage', e);
  }
}

async function notifyAuthoritiesSignalementReply(
  organisationId: string,
  signalementId: string,
  excludeUserId: string,
): Promise<void> {
  try {
    const { data: authorities } = await db()
      .from('utilisateur')
      .select('id')
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .eq('accepte_notifications', true)
      .eq('id_organisation', organisationId);

    const nowIso = new Date().toISOString();
    const url = `/authority/signalements/${signalementId}`;
    const rows = (authorities || [])
      .filter((u: any) => u.id && u.id !== excludeUserId)
      .map((u: any) => ({
        id_utilisateur: u.id,
        type_notification: 'autre',
        titre: 'Nouveau message — signalement',
        message: 'Un usager a répondu sur le fil de messagerie d’un signalement.',
        canal: 'push',
        priorite: 'moyenne',
        lue: false,
        date_creation: nowIso,
        url_action: url,
        donnees_supplementaires: {
          event: 'signalement_messagerie_reply',
          signalement_id: signalementId,
        },
      }));

    if (rows.length > 0) {
      await db().from('notification').insert(rows);
    }
  } catch (e) {
    console.error('[preDeclarationApi] notifyAuthoritiesSignalementReply', e);
  }
}

export async function listOrganisationsForPreDeclaration(): Promise<
  { id: string; nom: string; region: string | null }[]
> {
  const { data, error } = await db()
    .from('organisation')
    .select('id, nom, region')
    .eq('statut_actif', true)
    .order('nom', { ascending: true });
  if (error) throw error;
  return (data || []) as { id: string; nom: string; region: string | null }[];
}

function isRpcNotFoundError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST202'
    || msg.includes('could not find the function')
    || msg.includes('function public.create_pre_declaration_with_conversation')
  );
}

function buildPreDeclarationRpcInput(input: PreDeclarationCreateInput): Record<string, unknown> {
  return {
    id_organisation: input.id_organisation,
    nom_personne: input.nom_personne.trim(),
    prenom_personne: (input.prenom_personne || '').trim(),
    sexe: input.sexe,
    date_naissance: input.date_naissance || null,
    nationalite: input.nationalite,
    date_disparition: input.date_disparition,
    lieu_disparition: input.lieu_disparition || null,
    ville_disparition: input.ville_disparition || null,
    region_disparition: input.region_disparition || null,
    pays_disparition: input.pays_disparition,
    latitude_disparition: input.latitude_disparition ?? null,
    longitude_disparition: input.longitude_disparition ?? null,
    type_disparition: input.type_disparition,
    niveau_urgence: input.niveau_urgence,
    circonstances: input.circonstances.trim(),
    infos_complementaires: input.infos_complementaires?.trim() || null,
    contact_nom: input.contact_nom?.trim() || null,
    contact_telephone: input.contact_telephone?.trim() || null,
    contact_email: input.contact_email?.trim() || null,
    message_initial: input.message_initial?.trim() || null,
  };
}

async function createPreDeclarationWithConversationLegacy(
  userId: string,
  input: PreDeclarationCreateInput,
): Promise<{ preDeclaration: PreDeclarationRow; conversation: ConversationRow }> {
  const payload = {
    id_utilisateur: userId,
    id_organisation: input.id_organisation,
    nom_personne: input.nom_personne.trim(),
    prenom_personne: (input.prenom_personne || '').trim(),
    sexe: input.sexe,
    date_naissance: input.date_naissance || null,
    nationalite: input.nationalite,
    date_disparition: input.date_disparition,
    lieu_disparition: input.lieu_disparition || null,
    ville_disparition: input.ville_disparition || null,
    region_disparition: input.region_disparition || null,
    pays_disparition: input.pays_disparition,
    latitude_disparition: input.latitude_disparition ?? null,
    longitude_disparition: input.longitude_disparition ?? null,
    type_disparition: input.type_disparition,
    niveau_urgence: input.niveau_urgence,
    circonstances: input.circonstances.trim(),
    infos_complementaires: input.infos_complementaires?.trim() || null,
    contact_nom: input.contact_nom?.trim() || null,
    contact_telephone: input.contact_telephone?.trim() || null,
    contact_email: input.contact_email?.trim() || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: preRow, error: preErr } = await db()
    .from('pre_declaration_citoyenne')
    .insert(payload)
    .select()
    .single();
  if (preErr) throw preErr;

  const preDeclaration = preRow as PreDeclarationRow;

  const { data: convRow, error: convErr } = await db()
    .from('conversation')
    .insert({
      id_pre_declaration: preDeclaration.id,
      id_dossier: null,
      id_signalement: null,
      statut: 'ouverte',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (convErr) throw convErr;

  const conversation = convRow as ConversationRow;

  const { error: partErr } = await db().from('conversation_participant').insert({
    id_conversation: conversation.id,
    id_utilisateur: userId,
    role: 'citoyen',
    created_at: new Date().toISOString(),
  });
  if (partErr && (partErr as any).code !== '23505') {
    console.warn('[preDeclarationApi] conversation_participant citoyen', partErr);
  }

  const initial = (input.message_initial || '').trim();
  if (initial.length > 0) {
    const { error: msgErr } = await db().from('message').insert({
      id_conversation: conversation.id,
      id_auteur: userId,
      corps: initial,
      created_at: new Date().toISOString(),
    });
    if (msgErr) throw msgErr;
  }

  return { preDeclaration, conversation };
}

export async function createPreDeclarationWithConversation(
  userId: string,
  input: PreDeclarationCreateInput,
): Promise<{ preDeclaration: PreDeclarationRow; conversation: ConversationRow }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUserId = sessionData?.session?.user?.id;
  if (!authUserId) {
    throw new Error('Non authentifié');
  }
  const effectiveUserId = authUserId;
  if (userId !== authUserId) {
    console.warn(
      '[preDeclarationApi] userId Redux différent de auth.uid(), utilisation de la session Supabase',
    );
  }

  const { data: rpcData, error: rpcErr } = await db().rpc('create_pre_declaration_with_conversation', {
    p_input: buildPreDeclarationRpcInput(input),
  });

  let preDeclaration: PreDeclarationRow;
  let conversation: ConversationRow;

  if (!rpcErr && rpcData) {
    const parsed = rpcData as {
      pre_declaration?: PreDeclarationRow;
      conversation?: ConversationRow;
    };
    if (!parsed.pre_declaration || !parsed.conversation) {
      throw new Error('Réponse RPC pré-déclaration invalide');
    }
    preDeclaration = parsed.pre_declaration;
    conversation = parsed.conversation;
  } else if (isRpcNotFoundError(rpcErr)) {
    ({ preDeclaration, conversation } = await createPreDeclarationWithConversationLegacy(
      effectiveUserId,
      input,
    ));
  } else {
    throw rpcErr;
  }

  await notifyAuthoritiesNewPreDeclaration(preDeclaration.id, input.id_organisation, null);

  return { preDeclaration, conversation };
}

export async function listMyPreDeclarations(userId: string): Promise<PreDeclarationRow[]> {
  const { data, error } = await db()
    .from('pre_declaration_citoyenne')
    .select('*')
    .eq('id_utilisateur', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PreDeclarationRow[];
}

export async function listOrgPreDeclarations(): Promise<PreDeclarationRow[]> {
  const { data, error } = await db()
    .from('pre_declaration_citoyenne')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as PreDeclarationRow[];
}

export async function getPreDeclarationById(id: string): Promise<PreDeclarationRow | null> {
  const { data, error } = await db().from('pre_declaration_citoyenne').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as PreDeclarationRow) || null;
}

export async function getConversationByPreDeclaration(
  preDeclarationId: string,
): Promise<ConversationRow | null> {
  const { data, error } = await db()
    .from('conversation')
    .select('*')
    .eq('id_pre_declaration', preDeclarationId)
    .maybeSingle();
  if (error) throw error;
  return (data as ConversationRow) || null;
}

export async function getConversationByDossierId(dossierId: string): Promise<ConversationRow | null> {
  const { data, error } = await db()
    .from('conversation')
    .select('*')
    .eq('id_dossier', dossierId)
    .maybeSingle();
  if (error) throw error;
  return (data as ConversationRow) || null;
}

export async function getConversationBySignalementId(signalementId: string): Promise<ConversationRow | null> {
  const { data, error } = await db()
    .from('conversation')
    .select('*')
    .eq('id_signalement', signalementId)
    .maybeSingle();
  if (error) throw error;
  return (data as ConversationRow) || null;
}

async function ensureConversationViaRpc(
  kind: 'dossier' | 'signalement',
  entityId: string,
): Promise<ConversationRow> {
  const { data: convId, error: rpcErr } = await db().rpc('ensure_messagerie_conversation', {
    p_kind: kind,
    p_entity_id: entityId,
  });
  if (rpcErr) throw rpcErr;
  const id = convId as string;
  const { data, error } = await db().from('conversation').select('*').eq('id', id).single();
  if (error) throw error;
  return data as ConversationRow;
}

/** Crée le fil dossier s’il n’existe pas (citoyen créateur ou autorité responsable). */
export async function ensureConversationForDossier(dossierId: string): Promise<ConversationRow> {
  const existing = await getConversationByDossierId(dossierId);
  if (existing) return existing;
  try {
    return await ensureConversationViaRpc('dossier', dossierId);
  } catch (rpcErr: unknown) {
    const msg = (rpcErr as { message?: string })?.message || '';
    if (!msg.includes('Could not find the function') && !msg.includes('PGRST202')) {
      throw rpcErr;
    }
  }
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('conversation')
    .insert({
      id_dossier: dossierId,
      id_pre_declaration: null,
      id_signalement: null,
      statut: 'ouverte',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConversationRow;
}

/** Crée le fil signalement s’il n’existe pas (auteur signalement ou autorité du dossier lié). */
export async function ensureConversationForSignalement(signalementId: string): Promise<ConversationRow> {
  const existing = await getConversationBySignalementId(signalementId);
  if (existing) return existing;
  try {
    return await ensureConversationViaRpc('signalement', signalementId);
  } catch (rpcErr: unknown) {
    const msg = (rpcErr as { message?: string })?.message || '';
    if (!msg.includes('Could not find the function') && !msg.includes('PGRST202')) {
      throw rpcErr;
    }
  }
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('conversation')
    .insert({
      id_signalement: signalementId,
      id_pre_declaration: null,
      id_dossier: null,
      statut: 'ouverte',
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConversationRow;
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await db()
    .from('message')
    .select('*')
    .eq('id_conversation', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as MessageRow[];
}

export async function sendContextMessagerieMessage(params: {
  conversationId: string;
  authorId: string;
  corps: string;
  authorIsCitizen: boolean;
  typeMessage?: MessageTypeMessagerie;
  metadonnees?: Record<string, unknown> | null;
  pieceJointes?: { nom_fichier: string; mime_type: string; taille_octets: number; url_storage: string }[];
  references?: { type_entite: string; id_entite: string }[];
  demandeTraitement?: boolean;
  /** Fil pré-déclaration (notifications existantes) */
  preDeclaration?: PreDeclarationRow | null;
  /** Fil dossier officiel */
  dossierThread?: {
    dossierId: string;
    creatorUserId: string | null;
    responsibleOrgId: string | null;
  } | null;
  /** Fil signalement */
  signalementThread?: {
    signalementId: string;
    reporterUserId: string | null;
    responsibleOrgId: string | null;
  } | null;
}): Promise<MessageRow> {
  const corps = params.corps.trim();
  if (!corps) throw new Error('Message vide');
  const typeMessage: MessageTypeMessagerie = params.typeMessage || 'texte';
  const meta: Record<string, unknown> = {
    ...(params.metadonnees && Object.keys(params.metadonnees).length > 0 ? params.metadonnees : {}),
  };
  if (params.demandeTraitement) {
    meta.demande_traitement = true;
    meta.demande_traitement_at = new Date().toISOString();
  }

  const { data, error } = await db()
    .from('message')
    .insert({
      id_conversation: params.conversationId,
      id_auteur: params.authorId,
      corps,
      type_message: typeMessage,
      metadonnees: meta,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  const row = data as MessageRow;

  const pjs = params.pieceJointes || [];
  for (const pj of pjs) {
    const { error: pjErr } = await db().from('message_piece_jointe').insert({
      id_message: row.id,
      nom_fichier: pj.nom_fichier.slice(0, 500),
      mime_type: pj.mime_type.slice(0, 200),
      taille_octets: pj.taille_octets,
      url_storage: pj.url_storage.slice(0, 4000),
      created_at: new Date().toISOString(),
    });
    if (pjErr) throw pjErr;
  }

  const refs = params.references || [];
  for (const r of refs) {
    const { error: rErr } = await db().from('message_reference').insert({
      id_message: row.id,
      type_entite: r.type_entite,
      id_entite: r.id_entite,
      created_at: new Date().toISOString(),
    });
    if (rErr) throw rErr;
  }

  if (params.preDeclaration) {
    if (params.authorIsCitizen) {
      await notifyAuthoritiesPreDeclarationReply(
        params.preDeclaration.id_organisation,
        params.preDeclaration.id,
        params.authorId,
      );
    } else {
      await notifyCitizenPreDeclarationMessage(
        params.preDeclaration.id_utilisateur,
        params.preDeclaration.id,
        true,
      );
    }
  } else if (params.dossierThread) {
    const d = params.dossierThread;
    if (!params.authorIsCitizen && d.creatorUserId) {
      await notifyCitizenDossierNewMessage(d.creatorUserId, d.dossierId);
    } else if (params.authorIsCitizen && d.responsibleOrgId) {
      await notifyAuthoritiesDossierReply(d.responsibleOrgId, d.dossierId, params.authorId);
    }
  } else if (params.signalementThread) {
    const s = params.signalementThread;
    if (!params.authorIsCitizen && s.reporterUserId) {
      await notifyCitizenSignalementNewMessage(s.reporterUserId, s.signalementId);
    } else if (params.authorIsCitizen && s.responsibleOrgId) {
      await notifyAuthoritiesSignalementReply(s.responsibleOrgId, s.signalementId, params.authorId);
    }
  }

  return row;
}

export async function sendMessage(params: {
  conversationId: string;
  authorId: string;
  corps: string;
  preDeclaration: PreDeclarationRow;
  authorIsCitizenOwner: boolean;
  typeMessage?: MessageTypeMessagerie;
  metadonnees?: Record<string, unknown> | null;
  pieceJointes?: { nom_fichier: string; mime_type: string; taille_octets: number; url_storage: string }[];
  references?: { type_entite: string; id_entite: string }[];
  /** Métadonnées métier (demande de traitement, etc.) */
  demandeTraitement?: boolean;
}): Promise<MessageRow> {
  return sendContextMessagerieMessage({
    conversationId: params.conversationId,
    authorId: params.authorId,
    corps: params.corps,
    authorIsCitizen: params.authorIsCitizenOwner,
    typeMessage: params.typeMessage,
    metadonnees: params.metadonnees,
    pieceJointes: params.pieceJointes,
    references: params.references,
    demandeTraitement: params.demandeTraitement,
    preDeclaration: params.preDeclaration,
  });
}

export async function markMessageMessagerieTraite(messageId: string): Promise<void> {
  const { error } = await db().rpc('message_messagerie_marquer_traite', { p_message_id: messageId });
  if (error) throw new Error(error.message || 'Mise à jour impossible');
}

export async function markPreDeclarationEnExamen(params: {
  preDeclarationId: string;
  conversationId: string;
  authorityUserId: string;
}): Promise<void> {
  await updatePreDeclarationByAuthority(params.preDeclarationId, { statut: 'en_examen' });
  await updateConversationStatut(params.conversationId, 'en_attente');
  await insertJournalActivite({
    id_utilisateur: params.authorityUserId,
    type_action: TypeAction.CHANGEMENT_STATUT,
    action_detaillee: 'pre_declaration_en_examen',
    description: `Pré-déclaration ${params.preDeclarationId} passée en examen`,
    donnees_apres: { pre_declaration_id: params.preDeclarationId },
  });
}

/** Marque comme lus les messages dont l'auteur n'est pas le lecteur (idempotent). */
export async function markMessagesReadForViewer(
  _conversationId: string,
  viewerId: string,
  messageIdsFromOthers: string[],
): Promise<void> {
  const uniqueIds = [...new Set(messageIdsFromOthers.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  const { data: existing, error: readErr } = await db()
    .from('message_lecture')
    .select('id_message')
    .eq('id_utilisateur', viewerId)
    .in('id_message', uniqueIds);

  if (readErr) throw readErr;

  const alreadyRead = new Set((existing || []).map((r: { id_message: string }) => r.id_message));
  const toMark = uniqueIds.filter((id) => !alreadyRead.has(id));
  if (toMark.length === 0) return;

  const luAt = new Date().toISOString();
  const { error } = await db()
    .from('message_lecture')
    .upsert(
      toMark.map((id_message) => ({
        id_message,
        id_utilisateur: viewerId,
        lu_at: luAt,
      })),
      { onConflict: 'id_message,id_utilisateur', ignoreDuplicates: true },
    );

  if (error) throw error;
}

export async function getMessagePieceJointesForMessages(
  messageIds: string[],
): Promise<Record<string, MessagePieceJointeRow[]>> {
  if (messageIds.length === 0) return {};
  const { data, error } = await db().from('message_piece_jointe').select('*').in('id_message', messageIds);
  if (error) throw error;
  const map: Record<string, MessagePieceJointeRow[]> = {};
  for (const row of (data || []) as MessagePieceJointeRow[]) {
    if (!map[row.id_message]) map[row.id_message] = [];
    map[row.id_message].push(row);
  }
  return map;
}

export async function getMessageReferencesForMessages(
  messageIds: string[],
): Promise<Record<string, MessageReferenceRow[]>> {
  if (messageIds.length === 0) return {};
  const { data, error } = await db().from('message_reference').select('*').in('id_message', messageIds);
  if (error) throw error;
  const map: Record<string, MessageReferenceRow[]> = {};
  for (const row of (data || []) as MessageReferenceRow[]) {
    if (!map[row.id_message]) map[row.id_message] = [];
    map[row.id_message].push(row);
  }
  return map;
}

export async function updatePreDeclarationByAuthority(
  id: string,
  patch: Partial<
    Pick<
      PreDeclarationRow,
      | 'statut'
      | 'id_dossier'
      | 'motif_rejet'
      | 'rejetee_par'
      | 'rejetee_at'
    >
  >,
): Promise<void> {
  const { error } = await db()
    .from('pre_declaration_citoyenne')
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw error;
}

export async function updateConversationStatut(
  conversationId: string,
  statut: string,
): Promise<void> {
  const { error } = await db()
    .from('conversation')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function linkPreDeclarationToCreatedDossier(
  preDeclarationId: string,
  dossierId: string,
  options?: { authorId?: string | null },
): Promise<void> {
  await updatePreDeclarationByAuthority(preDeclarationId, {
    statut: 'convertie',
    id_dossier: dossierId,
  });
  const conv = await getConversationByPreDeclaration(preDeclarationId);
  if (conv?.id) {
    await updateConversationStatut(conv.id, 'traitee');
  }

  const authorId = options?.authorId?.trim();
  if (authorId && conv?.id) {
    const corps = `Un dossier officiel a été créé à partir de cette pré-déclaration. Référence dossier liée.`;
    const { data: sysMsg, error: mErr } = await db()
      .from('message')
      .insert({
        id_conversation: conv.id,
        id_auteur: authorId,
        corps,
        type_message: 'note_systeme',
        metadonnees: { event: 'pre_declaration_converted', dossier_id: dossierId },
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (!mErr && sysMsg?.id) {
      await db().from('message_reference').insert({
        id_message: sysMsg.id,
        type_entite: 'dossier',
        id_entite: dossierId,
        created_at: new Date().toISOString(),
      });
    } else if (mErr) {
      console.error('[preDeclarationApi] linkPreDeclaration system message', mErr);
    }
  }

  await insertJournalActivite({
    id_utilisateur: options?.authorId ?? null,
    type_action: TypeAction.CHANGEMENT_STATUT,
    action_detaillee: 'pre_declaration_convertie',
    description: `Pré-déclaration ${preDeclarationId} convertie en dossier ${dossierId}`,
    id_dossier: dossierId,
    donnees_apres: { pre_declaration_id: preDeclarationId, dossier_id: dossierId },
  });
}

export async function rejectPreDeclarationWithMotif(params: {
  preDeclarationId: string;
  conversationId: string;
  authorityUserId: string;
  motif: string;
}): Promise<void> {
  const motif = params.motif.trim();
  if (motif.length < 3) throw new Error('Motif trop court');
  const pre = await getPreDeclarationById(params.preDeclarationId);
  if (!pre) throw new Error('Pré-déclaration introuvable');
  const now = new Date().toISOString();
  await updatePreDeclarationByAuthority(params.preDeclarationId, {
    statut: 'rejetee',
    motif_rejet: motif.slice(0, 4000),
    rejetee_par: params.authorityUserId,
    rejetee_at: now,
  });
  await updateConversationStatut(params.conversationId, 'fermee');
  await notifyCitizenPreDeclarationRejected(pre.id_utilisateur, params.preDeclarationId, motif);
  await insertJournalActivite({
    id_utilisateur: params.authorityUserId,
    type_action: TypeAction.CHANGEMENT_STATUT,
    action_detaillee: 'pre_declaration_rejetee',
    description: `Pré-déclaration ${params.preDeclarationId} rejetée`,
    donnees_apres: { pre_declaration_id: params.preDeclarationId, motif: motif.slice(0, 500) },
  });
}

export async function listAuthorityColleaguesInOrganisation(organisationId: string): Promise<
  { id: string; nom: string; prenom: string; email: string }[]
> {
  const { data, error } = await db()
    .from('utilisateur')
    .select('id, nom, prenom, email')
    .eq('id_organisation', organisationId)
    .eq('type_compte', 'autorite')
    .eq('statut_compte', 'actif')
    .order('nom', { ascending: true });
  if (error) throw error;
  return (data || []) as { id: string; nom: string; prenom: string; email: string }[];
}

export async function updateConversationAssignee(
  conversationId: string,
  assigneeUserId: string | null,
  organisationId: string,
): Promise<void> {
  if (assigneeUserId) {
    const { data, error } = await db()
      .from('utilisateur')
      .select('id')
      .eq('id', assigneeUserId)
      .eq('id_organisation', organisationId)
      .eq('type_compte', 'autorite')
      .eq('statut_compte', 'actif')
      .maybeSingle();
    if (error) throw error;
    if (!data?.id) throw new Error('Assignation invalide');
  }
  const { error } = await db()
    .from('conversation')
    .update({
      id_utilisateur_assigne: assigneeUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw error;
}

export async function softDeleteOwnMessage(messageId: string): Promise<void> {
  const { error } = await db().rpc('soft_delete_own_message', { p_message_id: messageId });
  if (error) throw new Error(error.message || 'Suppression impossible');
}

export async function escalateConversationToOrganisation(
  conversationId: string,
  targetOrganisationId: string | null,
  authorityUserId: string,
): Promise<void> {
  const { error } = await db()
    .from('conversation')
    .update({
      id_organisation_escalade: targetOrganisationId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  if (error) throw error;
  await insertJournalActivite({
    id_utilisateur: authorityUserId,
    type_action: TypeAction.AUTRE,
    action_detaillee: 'messagerie_escalade',
    description: targetOrganisationId
      ? `Conversation ${conversationId} escaladée vers organisation ${targetOrganisationId}`
      : `Escalade retirée pour la conversation ${conversationId}`,
    donnees_apres: { conversation_id: conversationId, id_organisation_escalade: targetOrganisationId },
  });
}

export async function listMessagerieTaches(conversationId: string): Promise<MessagerieTacheRow[]> {
  const { data, error } = await db()
    .from('messagerie_tache_suivi')
    .select('*')
    .eq('id_conversation', conversationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as MessagerieTacheRow[];
}

export async function createMessagerieTache(params: {
  conversationId: string;
  titre: string;
  description?: string | null;
  authorityUserId: string;
}): Promise<MessagerieTacheRow> {
  const titre = params.titre.trim();
  if (titre.length < 2) throw new Error('Titre trop court');
  const { data, error } = await db()
    .from('messagerie_tache_suivi')
    .insert({
      id_conversation: params.conversationId,
      titre: titre.slice(0, 500),
      description: params.description?.trim() || null,
      statut: 'ouverte',
      id_createur: params.authorityUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as MessagerieTacheRow;
}

export async function updateMessagerieTacheStatut(
  tacheId: string,
  statut: MessagerieTacheStatut,
): Promise<void> {
  const { error } = await db()
    .from('messagerie_tache_suivi')
    .update({ statut, updated_at: new Date().toISOString() })
    .eq('id', tacheId);
  if (error) throw error;
}
