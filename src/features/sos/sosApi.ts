/**
 * SOS — contacts d'urgence (RLS client) + dispatch (Edge Function).
 */
import { supabase } from '../../config';
import { envConfig } from '../../config/env.config';

const db = () => (supabase as any);

const SOS_FUNCTION_NAME =
  (typeof process !== 'undefined' && process.env.REACT_APP_SUPABASE_FUNCTION_SOS?.trim()) || 'sos-dispatch';

const SOS_CONTACT_VERIFY_EMAIL_FN =
  (typeof process !== 'undefined' && process.env.REACT_APP_SUPABASE_FUNCTION_SOS_CONTACT_VERIFY?.trim()) ||
  'sos-contact-verification-email';

export interface ContactUrgenceRow {
  id: string;
  id_utilisateur: string;
  nom: string;
  email: string;
  relation: string | null;
  email_verifie: boolean;
  date_ajout: string;
  date_verification: string | null;
}

export interface SosEventRow {
  id: string;
  id_utilisateur: string;
  latitude: number | null;
  longitude: number | null;
  precision_metres: number | null;
  message: string | null;
  sans_position: boolean;
  statut: 'annule' | 'envoye' | 'traite';
  handled_at: string | null;
  handled_by: string | null;
  id_organisation_assignee?: string | null;
  created_at: string;
}

async function getAccessToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    const { data: { session: ref } } = await supabase.auth.refreshSession();
    token = ref?.access_token;
  }
  return token || null;
}

export async function invokeSosDispatch(body: {
  mode: 'dispatch' | 'abort_trace';
  message?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  precisionMeters?: number | null;
}): Promise<{
  ok: boolean;
  id?: string;
  statut?: string;
  sans_position?: boolean;
  brevo_env_ok?: boolean;
  contacts_for_email?: number;
  emails_attempted?: { to: string; ok: boolean; error?: string }[];
  error?: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Session expirée.' };
  }
  const url = `${envConfig.REACT_APP_SUPABASE_URL}/functions/v1/${SOS_FUNCTION_NAME}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (envConfig.REACT_APP_SUPABASE_ANON_KEY) {
    headers['apikey'] = envConfig.REACT_APP_SUPABASE_ANON_KEY;
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Réseau indisponible.' };
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    // ignore
  }
  if (!res.ok) {
    const errMsg = (data.error as string) || res.statusText || 'Erreur SOS';
    return { ok: false, error: res.status === 429 ? 'RATE_LIMIT' : errMsg };
  }
  return {
    ok: true,
    id: data.id as string | undefined,
    statut: data.statut as string | undefined,
    sans_position: data.sans_position as boolean | undefined,
    brevo_env_ok: data.brevo_env_ok as boolean | undefined,
    contacts_for_email: data.contacts_for_email as number | undefined,
    emails_attempted: data.emails_attempted as { to: string; ok: boolean; error?: string }[] | undefined,
  };
}

/** Envoie l’e-mail de vérification (Edge : jeton + Brevo). */
export async function sendSosContactVerificationEmail(contactId: string): Promise<{
  ok: boolean;
  email_sent?: boolean;
  token_saved?: boolean;
  error?: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    return { ok: false, error: 'Session expirée.' };
  }
  const url = `${envConfig.REACT_APP_SUPABASE_URL}/functions/v1/${SOS_CONTACT_VERIFY_EMAIL_FN}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (envConfig.REACT_APP_SUPABASE_ANON_KEY) {
    headers['apikey'] = envConfig.REACT_APP_SUPABASE_ANON_KEY;
  }
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ contact_id: contactId }),
    });
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Réseau indisponible.' };
  }
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    /* ignore */
  }
  if (!res.ok) {
    return {
      ok: false,
      error: (data.error as string) || res.statusText || 'Erreur',
      token_saved: Boolean(data.token_saved),
    };
  }
  return {
    ok: true,
    email_sent: Boolean(data.email_sent),
    token_saved: Boolean(data.token_saved),
  };
}

export async function listMyContacts(): Promise<ContactUrgenceRow[]> {
  const { data, error } = await db().from('contact_urgence').select('*').order('date_ajout', { ascending: false });
  if (error) throw error;
  return (data || []) as ContactUrgenceRow[];
}

export async function addContact(input: {
  nom: string;
  email: string;
  relation?: string | null;
}): Promise<ContactUrgenceRow> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData?.user?.id;
  if (!uid) throw new Error('Non authentifié');
  const { data, error } = await db()
    .from('contact_urgence')
    .insert({
      id_utilisateur: uid,
      nom: input.nom.trim(),
      email: input.email.trim().toLowerCase(),
      relation: input.relation?.trim() || null,
      date_ajout: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as ContactUrgenceRow;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await db().from('contact_urgence').delete().eq('id', id);
  if (error) throw error;
}

/** Génère un jeton de vérification e-mail (7 jours). L’envoi du mail est à brancher côté produit / Edge. */
export async function requestContactVerificationToken(contactId: string): Promise<string> {
  const { data, error } = await db().rpc('contact_urgence_set_verification_token', { p_contact_id: contactId });
  if (error) throw new Error(error.message || 'Impossible de générer le jeton');
  return String(data || '');
}

export async function listMySosHistory(limit = 50): Promise<SosEventRow[]> {
  const { data, error } = await db()
    .from('sos_event')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as SosEventRow[];
}

export async function listAuthoritySosEvents(limit = 200): Promise<SosEventRow[]> {
  const { data, error } = await db()
    .from('sos_event')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as SosEventRow[];
}

function formatSupabaseError(err: { message?: string; details?: string; hint?: string; code?: string }): string {
  const parts = [err.message, err.details, err.hint].filter(Boolean);
  return parts.join(' — ') || err.code || 'Erreur inconnue';
}

export async function markSosEventHandled(eventId: string, authorityUserId: string): Promise<void> {
  const { error: rpcErr } = await db().rpc('mark_sos_event_handled', { p_event_id: eventId });
  if (!rpcErr) return;

  const rpcMsg = (rpcErr.message || '').toLowerCase();
  const rpcMissing =
    rpcErr.code === 'PGRST202' ||
    rpcMsg.includes('could not find the function') ||
    rpcMsg.includes('mark_sos_event_handled');

  if (!rpcMissing) {
    throw new Error(formatSupabaseError(rpcErr));
  }

  const now = new Date().toISOString();
  const { data, error } = await db()
    .from('sos_event')
    .update({
      statut: 'traite',
      handled_at: now,
      handled_by: authorityUserId,
    })
    .eq('id', eventId)
    .eq('statut', 'envoye')
    .select('id')
    .maybeSingle();
  if (error) throw error;
  if (!data?.id) {
    throw new Error('SOS introuvable ou déjà traité');
  }
}

export async function assignSosEventToOrganisation(eventId: string, organisationId: string | null): Promise<void> {
  const { error } = await db()
    .from('sos_event')
    .update({ id_organisation_assignee: organisationId })
    .eq('id', eventId)
    .eq('statut', 'envoye');
  if (error) throw error;
}

export async function confirmContactVerificationToken(token: string): Promise<void> {
  const { error } = await db().rpc('contact_urgence_confirm_token', { p_token: token });
  if (error) throw new Error(error.message || 'Vérification impossible');
}

/** Profil minimal pour affichage (nom citoyen sur fiche autorité). */
export async function getUtilisateurPublicForSos(userId: string): Promise<{ nom: string; prenom: string; email: string } | null> {
  const { data, error } = await db().from('utilisateur').select('nom, prenom, email').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as any) || null;
}
