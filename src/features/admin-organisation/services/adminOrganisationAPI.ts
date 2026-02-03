/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation API
 * Données Supabase pour l'admin d'organisation (filtrage par id_organisation)
 * =====================================================
 */

import { supabase } from '../../../config';

const db = (table: string) => (supabase as any).from(table);

/**
 * Inviter un utilisateur par email (Edge Function admin-invite-user).
 * Envoie un lien d'invitation Supabase Auth et associe organisation + rôle dans user_metadata.
 */
export async function inviteUserByEmail(
  organisationId: string,
  email: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await (supabase as any).functions.invoke('admin-invite-user', {
    body: { email, role, organisationId },
  });
  if (error) {
    return { success: false, error: error.message || 'Invitation failed' };
  }
  if (data?.error) {
    return { success: false, error: data.error };
  }
  return { success: true };
}

export interface AdminDashboardStats {
  totalDossiers: number;
  dossiersActifs: number;
  dossiersResolus: number;
  personnesRetrouvees: number;
  rapportsRecents: number;
  utilisateurs: number;
  /** Nouveaux dossiers créés ce mois (pour tendance) */
  newDossiersThisMonth?: number;
  /** Dossiers résolus ce mois (pour tendance) */
  resolvedThisMonth?: number;
}

export interface AdminUserRow {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  statut_compte: string;
  type_compte: string;
  created_at: string;
  derniere_connexion?: string;
  id_organisation?: string;
  role?: { nom_role: string; id: string };
}

export interface AdminDossierRow {
  id: string;
  numero_dossier: string;
  date_disparition: string;
  statut_dossier: string;
  niveau_urgence: string;
  lieu_disparition?: string;
  ville_disparition?: string;
  region_disparition?: string;
  circonstances?: string;
  created_at: string;
  personne?: { nom: string; prenom: string; nom_complet?: string };
}

export interface AdminSignalementRow {
  id: string;
  numero_signalement?: string;
  description: string;
  date_observation: string;
  statut_validation: string;
  priorite_traitement?: string;
  created_at: string;
  id_dossier?: string;
  dossier?: { numero_dossier?: string };
  utilisateur?: { nom: string; prenom: string };
}

export interface AdminRoleRow {
  id: string;
  nom_role: string;
  niveau_accreditation: number;
  description?: string;
  permissions?: Record<string, unknown>;
}

export interface AdminOrganisationRow {
  id: string;
  nom: string;
  type_organisation: string;
  pays?: string;
  region?: string;
  ville?: string;
  adresse?: string;
  contact_officiel?: string;
  telephone?: string;
  email?: string;
  site_web?: string;
  statut_actif?: boolean;
  /** Préférences équipe + notifications (JSON) */
  parametres_organisation?: {
    team?: { maxMembers?: number; autoAssign?: boolean; requireApproval?: boolean };
    notifications?: {
      emailNewDossier?: boolean;
      emailNewReport?: boolean;
      emailAlerts?: boolean;
      smsUrgent?: boolean;
      slackNotifications?: boolean;
    };
  };
}

export interface AdminAuditLogRow {
  id: number;
  type_action: string;
  action_detaillee?: string;
  description?: string;
  date_action: string;
  id_utilisateur?: string;
  id_dossier?: string;
  id_signalement?: string;
  id_alerte?: string;
  ip_utilisateur?: string;
  utilisateur?: { nom: string; prenom: string };
}

export interface AdminRecentActivityRow {
  id: number;
  type_action: string;
  action_detaillee?: string;
  description?: string;
  date_action: string;
  id_dossier?: string;
  id_signalement?: string;
  utilisateur?: { nom: string; prenom: string };
}

/**
 * Activités récentes pour le dashboard (journal_activite)
 */
export async function getAdminRecentActivities(
  organisationId: string,
  limit: number = 5
): Promise<AdminRecentActivityRow[]> {
  const { data: userIds } = await db('utilisateur')
    .select('id')
    .eq('id_organisation', organisationId);
  const ids = (userIds || []).map((u: { id: string }) => u.id);
  if (ids.length === 0) return [];

  const { data, error } = await db('journal_activite')
    .select(`
      id,
      type_action,
      action_detaillee,
      description,
      date_action,
      id_dossier,
      id_signalement,
      utilisateur:utilisateur(nom, prenom)
    `)
    .in('id_utilisateur', ids)
    .order('date_action', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/**
 * Stats pour le dashboard admin (organisation)
 */
export async function getAdminDashboardStats(
  organisationId: string
): Promise<AdminDashboardStats> {
  const dossierIds = await getDossierIdsForOrg(organisationId);

  const [
    dossiersRes,
    usersRes,
    resolvedCountRes,
    foundAliveRes,
    signalementsRes,
  ] = await Promise.all([
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId),
    db('utilisateur')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation', organisationId),
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .in('statut_dossier', ['retrouve_vivant', 'retrouve_decede', 'classe_sans_suite']),
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .eq('statut_dossier', 'retrouve_vivant'),
    dossierIds.length > 0
      ? db('signalement').select('id', { count: 'exact', head: true }).in('id_dossier', dossierIds)
      : Promise.resolve({ count: 0 }),
  ]);

  const totalDossiers = dossiersRes.count ?? 0;
  const dossiersResolus = resolvedCountRes.count ?? 0;
  const personnesRetrouvees = foundAliveRes.count ?? 0;
  const dossiersActifs = Math.max(0, totalDossiers - dossiersResolus);
  const rapportsRecents = signalementsRes.count ?? 0;
  const utilisateurs = usersRes.count ?? 0;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [newThisMonthRes, resolvedThisMonthRes] = await Promise.all([
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .gte('created_at', startOfMonth),
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .in('statut_dossier', ['retrouve_vivant', 'retrouve_decede', 'classe_sans_suite'])
      .gte('date_resolution', startOfMonth),
  ]);
  const newDossiersThisMonth = newThisMonthRes.count ?? 0;
  const resolvedThisMonth = resolvedThisMonthRes.count ?? 0;

  return {
    totalDossiers,
    dossiersActifs,
    dossiersResolus,
    personnesRetrouvees,
    rapportsRecents,
    utilisateurs,
    newDossiersThisMonth,
    resolvedThisMonth,
  };
}

async function getDossierIdsForOrg(organisationId: string): Promise<string[]> {
  const { data } = await db('dossier_disparition')
    .select('id')
    .eq('id_organisation_responsable', organisationId);
  return (data || []).map((r: { id: string }) => r.id);
}

/** Répartition des dossiers par niveau d'urgence (pour statistiques) */
export interface AdminUrgencyCounts {
  critique: number;
  urgent: number;
  normal: number;
  faible: number;
}

export async function getAdminOrganisationUrgencyCounts(
  organisationId: string
): Promise<AdminUrgencyCounts> {
  const { data, error } = await db('dossier_disparition')
    .select('niveau_urgence')
    .eq('id_organisation_responsable', organisationId)
    .in('statut_dossier', ['en_cours', 'en_analyse']);
  if (error) throw error;
  const counts: AdminUrgencyCounts = { critique: 0, urgent: 0, normal: 0, faible: 0 };
  (data || []).forEach((r: { niveau_urgence?: string }) => {
    const k = (r.niveau_urgence || 'normal') as keyof AdminUrgencyCounts;
    if (k in counts) counts[k]++;
  });
  return counts;
}

/** Stats étendues pour la page Statistiques : durée moyenne de résolution (jours) et tendances du mois */
export interface AdminStatsExtended {
  avgResolutionDays: number;
  newDossiersThisMonth: number;
  resolvedThisMonth: number;
  foundThisMonth: number;
}

export async function getAdminStatsExtended(
  organisationId: string
): Promise<AdminStatsExtended> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [resolvedWithDateRes, newThisMonthRes, resolvedThisMonthRes, foundAliveThisMonthRes] = await Promise.all([
    db('dossier_disparition')
      .select('id, created_at, date_resolution')
      .eq('id_organisation_responsable', organisationId)
      .in('statut_dossier', ['retrouve_vivant', 'retrouve_decede', 'classe_sans_suite'])
      .not('date_resolution', 'is', null),
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .gte('created_at', startOfMonth),
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .in('statut_dossier', ['retrouve_vivant', 'retrouve_decede', 'classe_sans_suite'])
      .gte('date_resolution', startOfMonth),
    db('dossier_disparition')
      .select('id', { count: 'exact', head: true })
      .eq('id_organisation_responsable', organisationId)
      .eq('statut_dossier', 'retrouve_vivant')
      .gte('date_resolution', startOfMonth),
  ]);

  let avgResolutionDays = 0;
  const resolvedWithDate = resolvedWithDateRes as { data?: { created_at: string; date_resolution: string }[] };
  const rows: { created_at: string; date_resolution: string }[] = resolvedWithDate?.data ?? [];
  if (rows.length > 0) {
    const totalDays = rows.reduce((acc: number, r) => {
      const created = new Date(r.created_at).getTime();
      const resolved = new Date(r.date_resolution).getTime();
      return acc + Math.max(0, Math.round((resolved - created) / (24 * 60 * 60 * 1000)));
    }, 0);
    avgResolutionDays = Math.round(totalDays / rows.length);
  }

  return {
    avgResolutionDays,
    newDossiersThisMonth: (newThisMonthRes as any)?.count ?? 0,
    resolvedThisMonth: (resolvedThisMonthRes as any)?.count ?? 0,
    foundThisMonth: (foundAliveThisMonthRes as any)?.count ?? 0,
  };
}

/** Données mensuelles pour le graphique d'activité (nouveaux / résolus par mois) */
export interface AdminMonthlyActivityRow {
  month: string; // YYYY-MM
  label: string; // ex. "Janv. 2025"
  newDossiers: number;
  resolved: number;
}

/**
 * Activité mensuelle (derniers mois) pour graphique
 */
export async function getAdminMonthlyActivity(
  organisationId: string,
  lastMonths: number = 6
): Promise<AdminMonthlyActivityRow[]> {
  const result: AdminMonthlyActivityRow[] = [];
  const now = new Date();
  const monthNames = [
    'Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.',
  ];
  for (let i = lastMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString();
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;

    const [newRes, resolvedRes] = await Promise.all([
      db('dossier_disparition')
        .select('id', { count: 'exact', head: true })
        .eq('id_organisation_responsable', organisationId)
        .gte('created_at', start)
        .lt('created_at', end),
      db('dossier_disparition')
        .select('id', { count: 'exact', head: true })
        .eq('id_organisation_responsable', organisationId)
        .in('statut_dossier', ['retrouve_vivant', 'retrouve_decede', 'classe_sans_suite'])
        .not('date_resolution', 'is', null)
        .gte('date_resolution', start)
        .lt('date_resolution', end),
    ]);
    result.push({
      month: monthKey,
      label,
      newDossiers: (newRes as any)?.count ?? 0,
      resolved: (resolvedRes as any)?.count ?? 0,
    });
  }
  return result;
}

/**
 * Utilisateurs de l'organisation avec rôle
 */
export async function getAdminOrganisationUsers(
  organisationId: string,
  options?: { search?: string; role?: string; statut?: string }
): Promise<AdminUserRow[]> {
  let query = db('utilisateur')
    .select(`
      id,
      nom,
      prenom,
      email,
      telephone,
      statut_compte,
      type_compte,
      created_at,
      derniere_connexion,
      id_organisation
    `)
    .eq('id_organisation', organisationId)
    .order('created_at', { ascending: false });

  if (options?.search) {
    const term = `%${options.search}%`;
    query = query.or(`nom.ilike.${term},prenom.ilike.${term},email.ilike.${term}`);
  }
  if (options?.statut && options.statut !== 'all') {
    query = query.eq('statut_compte', options.statut);
  }

  const { data: users, error } = await query;
  if (error) throw error;
  if (!users?.length) return [];

  const withRoles = await Promise.all(
    users.map(async (u: AdminUserRow) => {
      const { data: ur } = await db('utilisateur_role')
        .select('role:role(nom_role, id)')
        .eq('id_utilisateur', u.id)
        .limit(1)
        .maybeSingle();
      const role = ur?.role;
      if (options?.role && options.role !== 'all' && role?.nom_role !== options.role) {
        return null;
      }
      return { ...u, role };
    })
  );
  return withRoles.filter(Boolean) as AdminUserRow[];
}

/**
 * Dossiers de l'organisation
 */
export async function getAdminOrganisationDossiers(
  organisationId: string,
  options?: { search?: string; statut?: string; urgence?: string }
): Promise<AdminDossierRow[]> {
  let query = db('dossier_disparition')
    .select(`
      id,
      numero_dossier,
      date_disparition,
      statut_dossier,
      niveau_urgence,
      lieu_disparition,
      ville_disparition,
      created_at,
      personne:personne(nom, prenom, nom_complet)
    `)
    .eq('id_organisation_responsable', organisationId)
    .order('created_at', { ascending: false });

  if (options?.statut && options.statut !== 'all') {
    query = query.eq('statut_dossier', options.statut);
  }
  if (options?.urgence && options.urgence !== 'all') {
    query = query.eq('niveau_urgence', options.urgence);
  }
  if (options?.search) {
    const term = `%${options.search}%`;
    query = query.or(`numero_dossier.ilike.${term},lieu_disparition.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Signalements (rapports) liés aux dossiers de l'organisation
 */
export async function getAdminOrganisationSignalements(
  organisationId: string,
  options?: { search?: string; statut?: string }
): Promise<AdminSignalementRow[]> {
  const dossierIds = await getDossierIdsForOrg(organisationId);
  if (dossierIds.length === 0) return [];

  let query = db('signalement')
    .select(`
      id,
      numero_signalement,
      description,
      date_observation,
      statut_validation,
      priorite_traitement,
      created_at,
      id_dossier,
      dossier:dossier_disparition(numero_dossier),
      utilisateur:utilisateur(nom, prenom)
    `)
    .in('id_dossier', dossierIds)
    .order('created_at', { ascending: false });

  if (options?.statut && options.statut !== 'all') {
    const statutMap: Record<string, string> = {
      approuve: 'valide',
      en_attente: 'en_attente',
      rejete: 'invalide',
    };
    const dbStatut = statutMap[options.statut] || options.statut;
    query = query.eq('statut_validation', dbStatut);
  }
  if (options?.search) {
    const term = `%${options.search}%`;
    query = query.or(`description.ilike.${term},numero_signalement.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Rôles (table role) - pour Admin Org on affiche les rôles 2-5
 */
export async function getAdminRoles(): Promise<AdminRoleRow[]> {
  const { data, error } = await db('role')
    .select('id, nom_role, niveau_accreditation, description, permissions')
    .gte('niveau_accreditation', 2)
    .lte('niveau_accreditation', 5)
    .order('niveau_accreditation', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Organisation par id
 */
export async function getAdminOrganisation(
  organisationId: string
): Promise<AdminOrganisationRow | null> {
  const { data, error } = await db('organisation')
    .select('*')
    .eq('id', organisationId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Mise à jour organisation
 */
export async function updateAdminOrganisation(
  organisationId: string,
  payload: Partial<AdminOrganisationRow>
): Promise<AdminOrganisationRow> {
  const { data, error } = await db('organisation')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', organisationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Ligne clé API (organisation_cle_api) */
export interface AdminApiKeyRow {
  id: string;
  id_organisation: string;
  nom_cle: string;
  prefix_cle: string;
  created_at: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
}

/**
 * Liste des clés API de l'organisation
 */
export async function listAdminApiKeys(
  organisationId: string
): Promise<AdminApiKeyRow[]> {
  const { data, error } = await db('organisation_cle_api')
    .select('id, id_organisation, nom_cle, prefix_cle, created_at, last_used_at, revoked_at')
    .eq('id_organisation', organisationId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Créer une clé API : le client génère le secret, on stocke uniquement le préfixe.
 * Retourne la ligne créée ; le secret complet doit être affiché une seule fois côté client.
 */
export async function createAdminApiKey(
  organisationId: string,
  nom_cle: string,
  prefix_cle: string
): Promise<AdminApiKeyRow> {
  const { data, error } = await db('organisation_cle_api')
    .insert({
      id_organisation: organisationId,
      nom_cle,
      prefix_cle,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Révoquer une clé API (met à jour revoked_at)
 */
export async function revokeAdminApiKey(
  organisationId: string,
  keyId: string
): Promise<void> {
  const { error } = await db('organisation_cle_api')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('id_organisation', organisationId);
  if (error) throw error;
}

/**
 * Journal d'activité pour les utilisateurs de l'organisation
 */
export async function getAdminAuditLogs(
  organisationId: string,
  options?: { search?: string; user?: string; action?: string; dateFilter?: string }
): Promise<AdminAuditLogRow[]> {
  const { data: userIds } = await db('utilisateur')
    .select('id')
    .eq('id_organisation', organisationId);
  const ids = (userIds || []).map((u: { id: string }) => u.id);
  if (ids.length === 0) return [];

  let query = db('journal_activite')
    .select(`
      id,
      type_action,
      action_detaillee,
      description,
      date_action,
      id_utilisateur,
      id_dossier,
      id_signalement,
      id_alerte,
      ip_utilisateur,
      utilisateur:utilisateur(nom, prenom)
    `)
    .in('id_utilisateur', ids)
    .order('date_action', { ascending: false })
    .limit(200);

  if (options?.user && options.user !== 'all') {
    query = query.eq('id_utilisateur', options.user);
  }
  if (options?.action && options.action !== 'all') {
    query = query.eq('type_action', options.action);
  }
  if (options?.dateFilter && options.dateFilter !== 'all') {
    const now = new Date();
    let from: Date;
    if (options.dateFilter === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (options.dateFilter === 'week') {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
    } else if (options.dateFilter === 'month') {
      from = new Date(now);
      from.setMonth(from.getMonth() - 1);
    } else {
      from = new Date(0);
    }
    query = query.gte('date_action', from.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Mettre à jour le statut de validation d'un signalement
 */
export async function updateSignalementValidation(
  signalementId: string,
  statut_validation: 'valide' | 'invalide' | 'spam' | 'doublonne',
  verifie_par: string,
  commentaire_verification?: string
): Promise<void> {
  const { error } = await db('signalement')
    .update({
      statut_validation,
      verifie_par,
      date_verification: new Date().toISOString(),
      commentaire_verification: commentaire_verification || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', signalementId);
  if (error) throw error;
}

/**
 * Utilisateur par id (vérifie qu'il appartient à l'organisation)
 */
export async function getAdminUserById(
  organisationId: string,
  userId: string
): Promise<AdminUserRow | null> {
  const { data, error } = await db('utilisateur')
    .select(`
      id,
      nom,
      prenom,
      email,
      telephone,
      statut_compte,
      type_compte,
      created_at,
      derniere_connexion,
      id_organisation
    `)
    .eq('id', userId)
    .eq('id_organisation', organisationId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  const { data: ur } = await db('utilisateur_role')
    .select('role:role(nom_role, id)')
    .eq('id_utilisateur', userId)
    .limit(1)
    .maybeSingle();
  return { ...data, role: ur?.role };
}

/**
 * Mise à jour utilisateur (champs éditables par admin org)
 */
export async function updateAdminUser(
  organisationId: string,
  userId: string,
  payload: Partial<Pick<AdminUserRow, 'nom' | 'prenom' | 'telephone' | 'statut_compte'>>
): Promise<void> {
  const { data: existing } = await db('utilisateur')
    .select('id')
    .eq('id', userId)
    .eq('id_organisation', organisationId)
    .single();
  if (!existing) throw new Error('User not in organisation');

  const { error } = await db('utilisateur')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

/**
 * Suspendre un utilisateur de l'organisation (statut_compte = 'suspendu')
 */
export async function suspendAdminUser(organisationId: string, userId: string): Promise<void> {
  return updateAdminUser(organisationId, userId, { statut_compte: 'suspendu' });
}

/**
 * Désactiver un utilisateur de l'organisation (statut_compte = 'desactive')
 */
export async function desactivateAdminUser(organisationId: string, userId: string): Promise<void> {
  return updateAdminUser(organisationId, userId, { statut_compte: 'desactive' });
}

/**
 * Réactiver un utilisateur (statut_compte = 'actif')
 */
export async function activateAdminUser(organisationId: string, userId: string): Promise<void> {
  return updateAdminUser(organisationId, userId, { statut_compte: 'actif' });
}

/**
 * Export des logs d'audit en CSV (données déjà chargées, formatées côté client)
 */
export function formatAuditLogsAsCsv(rows: AdminAuditLogRow[]): string {
  const header = 'id;date_action;type_action;action_detaillee;description;id_utilisateur;id_dossier;id_signalement;ip_utilisateur;utilisateur_nom\n';
  const escape = (v: unknown) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(';') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const lines = rows.map((r: any) =>
    [
      r.id,
      r.date_action,
      r.type_action,
      escape(r.action_detaillee),
      escape(r.description),
      r.id_utilisateur,
      r.id_dossier || '',
      r.id_signalement || '',
      r.ip_utilisateur || '',
      r.utilisateur ? [r.utilisateur.nom, r.utilisateur.prenom].filter(Boolean).join(' ') : '',
    ].join(';')
  );
  return '\uFEFF' + header + lines.join('\n');
}

/**
 * Dossier par id (vérifie id_organisation_responsable)
 */
export async function getAdminDossierById(
  organisationId: string,
  dossierId: string
): Promise<AdminDossierRow | null> {
  const { data, error } = await db('dossier_disparition')
    .select(`
      id,
      numero_dossier,
      date_disparition,
      date_derniere_observation,
      lieu_disparition,
      ville_disparition,
      region_disparition,
      pays_disparition,
      circonstances,
      type_disparition,
      statut_dossier,
      niveau_urgence,
      created_at,
      personne:personne(nom, prenom, nom_complet)
    `)
    .eq('id', dossierId)
    .eq('id_organisation_responsable', organisationId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/** Champs modifiables pour un dossier (admin org) */
export type AdminDossierUpdatePayload = Partial<Pick<
  AdminDossierRow,
  'date_disparition' | 'statut_dossier' | 'niveau_urgence' | 'lieu_disparition' | 'ville_disparition' | 'region_disparition' | 'circonstances'
>> & {
  date_derniere_observation?: string | null;
  pays_disparition?: string;
  type_disparition?: string;
  date_resolution?: string | null;
};

/**
 * Mise à jour d'un dossier (vérifie id_organisation_responsable)
 */
export async function updateAdminDossier(
  organisationId: string,
  dossierId: string,
  payload: AdminDossierUpdatePayload
): Promise<AdminDossierRow> {
  const clean: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.date_disparition !== undefined) clean.date_disparition = payload.date_disparition;
  if (payload.date_derniere_observation !== undefined) clean.date_derniere_observation = payload.date_derniere_observation;
  if (payload.statut_dossier !== undefined) clean.statut_dossier = payload.statut_dossier;
  if (payload.niveau_urgence !== undefined) clean.niveau_urgence = payload.niveau_urgence;
  if (payload.lieu_disparition !== undefined) clean.lieu_disparition = payload.lieu_disparition;
  if (payload.ville_disparition !== undefined) clean.ville_disparition = payload.ville_disparition;
  if (payload.region_disparition !== undefined) clean.region_disparition = payload.region_disparition;
  if (payload.pays_disparition !== undefined) clean.pays_disparition = payload.pays_disparition;
  if (payload.circonstances !== undefined) clean.circonstances = payload.circonstances;
  if (payload.type_disparition !== undefined) clean.type_disparition = payload.type_disparition;
  if (payload.date_resolution !== undefined) clean.date_resolution = payload.date_resolution;

  const { data, error } = await db('dossier_disparition')
    .update(clean)
    .eq('id', dossierId)
    .eq('id_organisation_responsable', organisationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Signalement par id (vérifie via id_dossier appartenant à l'org)
 */
export async function getAdminSignalementById(
  organisationId: string,
  signalementId: string
): Promise<AdminSignalementRow | null> {
  const { data: sig, error: sigError } = await db('signalement')
    .select(`
      id,
      numero_signalement,
      description,
      date_observation,
      statut_validation,
      priorite_traitement,
      created_at,
      id_dossier,
      dossier:dossier_disparition(numero_dossier, id_organisation_responsable),
      utilisateur:utilisateur(nom, prenom, email)
    `)
    .eq('id', signalementId)
    .single();
  if (sigError || !sig) return null;
  const dossier = (sig as any).dossier;
  if (!dossier || dossier.id_organisation_responsable !== organisationId) return null;
  return sig as AdminSignalementRow;
}
