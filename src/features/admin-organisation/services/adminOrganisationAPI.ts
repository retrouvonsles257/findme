/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation API
 * Données Supabase pour l'admin d'organisation (filtrage par id_organisation)
 * =====================================================
 */

import { supabase, envConfig } from '../../../config';

const db = (table: string) => (supabase as any).from(table);

/**
 * Inviter un utilisateur par email (Edge Function).
 * Nom par défaut: admin-invite-user. Si sur Supabase la fonction a un autre nom (ex. hyper-responder),
 * définir REACT_APP_SUPABASE_FUNCTION_INVITE dans .env (ex. hyper-responder).
 */
const ADMIN_INVITE_FUNCTION_NAME = (typeof process !== 'undefined' && process.env?.REACT_APP_SUPABASE_FUNCTION_INVITE)
  ? String(process.env.REACT_APP_SUPABASE_FUNCTION_INVITE).trim()
  : 'admin-invite-user';

export async function inviteUserByEmail(
  organisationId: string,
  email: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { session }, error: sessionError } = await (supabase as any).auth.getSession();
  let token = session?.access_token;
  if (!token) {
    const { data: { session: refreshed } } = await (supabase as any).auth.refreshSession();
    token = refreshed?.access_token;
  }
  if (!token) {
    return { success: false, error: sessionError?.message || 'Session expirée. Veuillez vous reconnecter.' };
  }

  const url = `${envConfig.REACT_APP_SUPABASE_URL}/functions/v1/${ADMIN_INVITE_FUNCTION_NAME}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (envConfig.REACT_APP_SUPABASE_ANON_KEY) {
    headers['apikey'] = envConfig.REACT_APP_SUPABASE_ANON_KEY;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ email, role, organisationId }) });
  } catch (err: any) {
    return { success: false, error: err?.message || 'Réseau indisponible. Vérifiez votre connexion.' };
  }

  let data: { success?: boolean; error?: string; message?: string; detail?: string } = {};
  let rawText = '';
  try {
    rawText = await res.text();
    if (rawText) data = JSON.parse(rawText) as typeof data;
  } catch {
    // réponse non JSON
  }

  const errMsg = data?.error || data?.message || (rawText && rawText.length < 200 ? rawText : null) || res.statusText;
  const withDetail = (data?.detail ? `${errMsg || ''} — ${data.detail}` : errMsg) || 'Invitation impossible';
  if (!res.ok) {
    return { success: false, error: withDetail };
  }
  if (data?.error) {
    return { success: false, error: data.detail ? `${data.error} — ${data.detail}` : data.error };
  }
  return { success: true };
}

/**
 * Nom de l'Edge Function pour la création manuelle (déployer avec ce nom ou adapter ici).
 */
const ADMIN_CREATE_USER_FUNCTION_NAME = 'admin-create-user';

/**
 * Créer un utilisateur manuellement avec mot de passe temporaire (Edge Function).
 * Fallback quand l'invitation par email ne convient pas.
 */
export async function createUserManually(
  organisationId: string,
  email: string,
  role: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { session }, error: sessionError } = await (supabase as any).auth.getSession();
  let token = session?.access_token;
  if (!token) {
    const { data: { session: refreshed } } = await (supabase as any).auth.refreshSession();
    token = refreshed?.access_token;
  }
  if (!token) {
    return { success: false, error: sessionError?.message || 'Session expirée. Veuillez vous reconnecter.' };
  }

  const url = `${envConfig.REACT_APP_SUPABASE_URL}/functions/v1/${ADMIN_CREATE_USER_FUNCTION_NAME}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (envConfig.REACT_APP_SUPABASE_ANON_KEY) {
    headers['apikey'] = envConfig.REACT_APP_SUPABASE_ANON_KEY;
  }

  let res: Response;
  try {
    res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ email, role, organisationId, password }) });
  } catch (err: any) {
    return { success: false, error: err?.message || 'Réseau indisponible. Vérifiez votre connexion.' };
  }

  let data: { success?: boolean; error?: string; message?: string; detail?: string } = {};
  let rawText = '';
  try {
    rawText = await res.text();
    if (rawText) data = JSON.parse(rawText) as typeof data;
  } catch {
    // réponse non JSON
  }

  const errMsg = data?.error || data?.message || (rawText && rawText.length < 200 ? rawText : null) || res.statusText;
  const withDetail = (data?.detail ? `${errMsg || ''} — ${data.detail}` : errMsg) || 'Création impossible';
  if (!res.ok) {
    return { success: false, error: withDetail };
  }
  if (data?.error) {
    return { success: false, error: data.detail ? `${data.error} — ${data.detail}` : data.error };
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
  /** Date d'expiration du rôle (utilisateur_role.date_expiration) */
  date_expiration?: string | null;
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
  pays_disparition?: string;
  circonstances?: string;
  contact_famille_principale?: string | null;
  telephone_contact?: string | null;
  email_contact?: string | null;
  type_disparition?: string;
  date_derniere_observation?: string | null;
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
  /** Préférences équipe + notifications + zones de compétence (JSON) */
  parametres_organisation?: {
    team?: { maxMembers?: number; autoAssign?: boolean; requireApproval?: boolean };
    notifications?: {
      emailNewDossier?: boolean;
      emailNewReport?: boolean;
      emailAlerts?: boolean;
      smsUrgent?: boolean;
      slackNotifications?: boolean;
    };
    /** Zones géographiques de compétence (régions, départements, codes postaux) */
    zones_competence?: ZoneCompetence[];
    /** Certifications / accréditations de l'organisation */
    certifications?: CertificationAccreditation[];
    /** Paramètres IA pour l'organisation (surcharges optionnelles) */
    ia_config?: IAConfigOrganisation;
  };
}

export interface ZoneCompetence {
  id: string;
  nom: string;
  region?: string;
  departement?: string;
  codes_postaux?: string;
}

export interface CertificationAccreditation {
  id: string;
  nom: string;
  reference?: string;
  date_expiration?: string;
}

export interface IAConfigOrganisation {
  seuil_reconnaissance_faciale?: number;
  analyse_auto_activee?: boolean;
  priorite_analyse?: 'haute' | 'normale' | 'basse';
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
 * Rôles (table role) - tous les rôles (comme super-admin).
 * On affiche tout le référentiel ; la page admin peut masquer citoyen/super_admin côté UI si besoin.
 */
export async function getAdminRoles(): Promise<AdminRoleRow[]> {
  const { data, error } = await db('role')
    .select('id, nom_role, niveau_accreditation, description, permissions')
    .order('niveau_accreditation', { ascending: false });
  if (error) throw error;
  return data || [];
}

/** Rôle avec nombre d'utilisateurs (de l'organisation) */
export interface AdminRoleWithCountRow extends AdminRoleRow {
  nombre_utilisateurs: number;
}

/**
 * Rôles avec nombre d'utilisateurs ayant ce rôle dans l'organisation (référentiel + stats).
 */
export async function getAdminRolesWithCounts(
  organisationId: string
): Promise<AdminRoleWithCountRow[]> {
  const roles = await getAdminRoles();
  const { data: orgUsers, error: usersError } = await db('utilisateur')
    .select('id')
    .eq('id_organisation', organisationId);
  if (usersError) throw usersError;
  const orgUserIds = (orgUsers || []).map((u: { id: string }) => u.id);

  if (orgUserIds.length === 0) {
    return roles.map((r) => ({ ...r, nombre_utilisateurs: 0 }));
  }

  const withCounts: AdminRoleWithCountRow[] = [];
  for (const role of roles) {
    const { count, error: countError } = await db('utilisateur_role')
      .select('id', { count: 'exact', head: true })
      .eq('id_role', role.id)
      .in('id_utilisateur', orgUserIds);
    if (countError) throw countError;
    withCounts.push({ ...role, nombre_utilisateurs: count ?? 0 });
  }
  return withCounts;
}

/** Ligne ressource organisation (ressource_organisation) */
export interface RessourceOrganisationRow {
  id: string;
  id_organisation: string;
  titre: string;
  type: 'document' | 'tool' | 'guide' | 'training';
  description: string | null;
  url: string | null;
  ordre: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Liste des ressources de l'organisation
 */
export async function getRessourcesOrganisation(
  organisationId: string
): Promise<RessourceOrganisationRow[]> {
  const { data, error } = await db('ressource_organisation')
    .select('id, id_organisation, titre, type, description, url, ordre, created_at, updated_at')
    .eq('id_organisation', organisationId)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

/**
 * Créer une ressource
 */
export async function createRessourceOrganisation(
  organisationId: string,
  payload: { titre: string; type: RessourceOrganisationRow['type']; description?: string | null; url?: string | null; ordre?: number | null }
): Promise<RessourceOrganisationRow> {
  const { data, error } = await db('ressource_organisation')
    .insert({
      id_organisation: organisationId,
      titre: payload.titre,
      type: payload.type,
      description: payload.description ?? null,
      url: payload.url ?? null,
      ordre: payload.ordre ?? 0,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mettre à jour une ressource
 */
export async function updateRessourceOrganisation(
  organisationId: string,
  id: string,
  payload: Partial<Pick<RessourceOrganisationRow, 'titre' | 'type' | 'description' | 'url' | 'ordre'>>
): Promise<RessourceOrganisationRow> {
  const { data, error } = await db('ressource_organisation')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('id_organisation', organisationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Supprimer une ressource
 */
export async function deleteRessourceOrganisation(
  organisationId: string,
  id: string
): Promise<void> {
  const { error } = await db('ressource_organisation')
    .delete()
    .eq('id', id)
    .eq('id_organisation', organisationId);
  if (error) throw error;
}

/** Ligne étape de workflow par organisation (workflow_etape_organisation) */
export interface WorkflowEtapeOrganisationRow {
  id: string;
  id_organisation: string;
  code: string;
  libelle: string;
  ordre: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Liste des étapes de workflow de l'organisation (ordre croissant)
 */
export async function getWorkflowEtapesOrganisation(
  organisationId: string
): Promise<WorkflowEtapeOrganisationRow[]> {
  const { data, error } = await db('workflow_etape_organisation')
    .select('id, id_organisation, code, libelle, ordre, actif, created_at, updated_at')
    .eq('id_organisation', organisationId)
    .order('ordre', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Créer une étape de workflow
 */
export async function createWorkflowEtapeOrganisation(
  organisationId: string,
  payload: { code: string; libelle: string; ordre?: number; actif?: boolean }
): Promise<WorkflowEtapeOrganisationRow> {
  const { data, error } = await db('workflow_etape_organisation')
    .insert({
      id_organisation: organisationId,
      code: payload.code.trim(),
      libelle: payload.libelle.trim(),
      ordre: payload.ordre ?? 0,
      actif: payload.actif ?? true,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mettre à jour une étape de workflow
 */
export async function updateWorkflowEtapeOrganisation(
  organisationId: string,
  id: string,
  payload: Partial<Pick<WorkflowEtapeOrganisationRow, 'code' | 'libelle' | 'ordre' | 'actif'>>
): Promise<WorkflowEtapeOrganisationRow> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (payload.code !== undefined) update.code = payload.code.trim();
  if (payload.libelle !== undefined) update.libelle = payload.libelle.trim();
  if (payload.ordre !== undefined) update.ordre = payload.ordre;
  if (payload.actif !== undefined) update.actif = payload.actif;
  const { data, error } = await db('workflow_etape_organisation')
    .update(update)
    .eq('id', id)
    .eq('id_organisation', organisationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Supprimer une étape de workflow
 */
export async function deleteWorkflowEtapeOrganisation(
  organisationId: string,
  id: string
): Promise<void> {
  const { error } = await db('workflow_etape_organisation')
    .delete()
    .eq('id', id)
    .eq('id_organisation', organisationId);
  if (error) throw error;
}

/** Ligne partenariat organisation (partenariat_organisation) */
export interface PartenariatOrganisationRow {
  id: string;
  id_organisation: string;
  nom_partenaire: string;
  personne_contact: string | null;
  email: string | null;
  telephone: string | null;
  statut: 'active' | 'inactive' | 'pending';
  date_partnership: string | null;
  commentaire: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Liste des partenariats de l'organisation
 */
export async function getPartenariatsOrganisation(
  organisationId: string
): Promise<PartenariatOrganisationRow[]> {
  const { data, error } = await db('partenariat_organisation')
    .select('id, id_organisation, nom_partenaire, personne_contact, email, telephone, statut, date_partnership, commentaire, created_at, updated_at')
    .eq('id_organisation', organisationId)
    .order('nom_partenaire', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Créer un partenariat
 */
export async function createPartenariatOrganisation(
  organisationId: string,
  payload: {
    nom_partenaire: string;
    personne_contact?: string | null;
    email?: string | null;
    telephone?: string | null;
    statut?: PartenariatOrganisationRow['statut'];
    date_partnership?: string | null;
    commentaire?: string | null;
  }
): Promise<PartenariatOrganisationRow> {
  const { data, error } = await db('partenariat_organisation')
    .insert({
      id_organisation: organisationId,
      nom_partenaire: payload.nom_partenaire,
      personne_contact: payload.personne_contact ?? null,
      email: payload.email ?? null,
      telephone: payload.telephone ?? null,
      statut: payload.statut ?? 'pending',
      date_partnership: payload.date_partnership ?? null,
      commentaire: payload.commentaire ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Mettre à jour un partenariat
 */
export async function updatePartenariatOrganisation(
  organisationId: string,
  id: string,
  payload: Partial<Pick<PartenariatOrganisationRow, 'nom_partenaire' | 'personne_contact' | 'email' | 'telephone' | 'statut' | 'date_partnership' | 'commentaire'>>
): Promise<PartenariatOrganisationRow> {
  const { data, error } = await db('partenariat_organisation')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('id_organisation', organisationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Supprimer un partenariat
 */
export async function deletePartenariatOrganisation(
  organisationId: string,
  id: string
): Promise<void> {
  const { error } = await db('partenariat_organisation')
    .delete()
    .eq('id', id)
    .eq('id_organisation', organisationId);
  if (error) throw error;
}

/** Statuts demande vérification identité */
export type StatutDemandeVerification = 'en_attente' | 'approuve' | 'refuse' | 'complement_demande';

/** Ligne demande_verification_identite avec infos utilisateur (pour affichage) */
export interface DemandeVerificationIdentiteRow {
  id: string;
  id_utilisateur: string;
  id_organisation: string | null;
  statut: StatutDemandeVerification;
  type_document: string;
  url_document: string | null;
  url_selfie: string | null;
  commentaire_moderateur: string | null;
  traite_par: string | null;
  traite_le: string | null;
  created_at: string;
  updated_at: string;
  utilisateur?: {
    nom: string;
    prenom: string;
    email: string;
    telephone?: string | null;
    date_naissance?: string | null;
    ville?: string | null;
    region?: string | null;
    pays?: string | null;
    created_at: string;
    score_fiabilite?: number | null;
    nombre_signalements_valides?: number | null;
  } | null;
}

export interface DemandesVerificationFilters {
  statut?: StatutDemandeVerification | 'all';
  typeDocument?: 'cni' | 'passeport' | 'autre' | 'all';
  dateRange?: 'all' | '7days' | '30days';
  search?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Liste des demandes de vérification d'identité.
 * organisationId = null : demandes globales (id_organisation IS NULL).
 * organisationId = string : demandes de cette org ou globales selon RLS.
 */
export async function getDemandesVerificationIdentite(
  organisationId: string | null,
  filters: DemandesVerificationFilters = {}
): Promise<{ data: DemandeVerificationIdentiteRow[]; count: number }> {
  const page = filters.page ?? 1;
  const pageSize = Math.min(filters.pageSize ?? 12, 100);
  const start = (page - 1) * pageSize;

  let query = db('demande_verification_identite')
    .select('*, utilisateur:id_utilisateur(nom, prenom, email, telephone, date_naissance, ville, region, pays, created_at, score_fiabilite, nombre_signalements_valides)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (organisationId !== null) {
    query = query.or(`id_organisation.eq.${organisationId},id_organisation.is.null`);
  } else {
    query = query.is('id_organisation', null);
  }

  if (filters.statut && filters.statut !== 'all') {
    query = query.eq('statut', filters.statut);
  }

  if (filters.typeDocument && filters.typeDocument !== 'all') {
    query = query.eq('type_document', filters.typeDocument);
  }

  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    const days = filters.dateRange === '7days' ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    query = query.gte('created_at', cutoff.toISOString());
  }

  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`commentaire_moderateur.ilike.${term}`);
    // Filtre par nom/email utilisateur via une requête séparée si besoin ; ici on garde simple
  }

  const { data, error, count } = await query.range(start, start + pageSize - 1);

  if (error) throw error;
  return { data: (data || []) as DemandeVerificationIdentiteRow[], count: count ?? 0 };
}

/**
 * Récupérer une demande par id (avec infos utilisateur).
 */
export async function getDemandeVerificationIdentiteById(
  id: string
): Promise<DemandeVerificationIdentiteRow | null> {
  const { data, error } = await db('demande_verification_identite')
    .select('*, utilisateur:id_utilisateur(nom, prenom, email, telephone, date_naissance, ville, region, pays, created_at, score_fiabilite, nombre_signalements_valides)')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as DemandeVerificationIdentiteRow | null;
}

/**
 * Traiter une demande (approuver, refuser, demander complément).
 * Lors d'un approuve : met à jour utilisateur.statut_compte = 'actif' et attribue le rôle citoyen_verifie si possible.
 */
export async function traiterDemandeVerificationIdentite(
  demandeId: string,
  action: StatutDemandeVerification,
  commentaire: string | null,
  traiteParUserId: string
): Promise<void> {
  const traiteLe = new Date().toISOString();

  const { error: updateError } = await db('demande_verification_identite')
    .update({
      statut: action,
      commentaire_moderateur: commentaire,
      traite_par: traiteParUserId,
      traite_le: traiteLe,
      updated_at: traiteLe,
    })
    .eq('id', demandeId);

  if (updateError) throw updateError;

  if (action === 'approuve') {
    const { data: demande } = await db('demande_verification_identite')
      .select('id_utilisateur')
      .eq('id', demandeId)
      .single();
    if (demande?.id_utilisateur) {
      await db('utilisateur')
        .update({ statut_compte: 'actif', updated_at: traiteLe })
        .eq('id', demande.id_utilisateur);

      const { data: roleData } = await db('role')
        .select('id')
        .eq('nom_role', 'citoyen_verifie')
        .single();
      if (roleData) {
        await (db('utilisateur_role') as any).upsert({
          id_utilisateur: demande.id_utilisateur,
          id_role: roleData.id,
          date_attribution: traiteLe,
          attribue_par: traiteParUserId,
          commentaire: commentaire || 'Identité vérifiée',
        }, { onConflict: 'id_utilisateur,id_role' });
      }
    }
  }
}

/**
 * Stats des demandes (nombre par statut) pour une org ou global.
 */
export async function getDemandesVerificationIdentiteStats(
  organisationId: string | null
): Promise<{ total: number; enAttente: number; approuves: number; refuse: number; complement_demande: number }> {
  let query = db('demande_verification_identite').select('statut');
  if (organisationId !== null) {
    query = query.or(`id_organisation.eq.${organisationId},id_organisation.is.null`);
  } else {
    query = query.is('id_organisation', null);
  }
  const { data, error } = await query;
  if (error) throw error;

  const rows = (data || []) as { statut: string }[];
  const total = rows.length;
  const enAttente = rows.filter((r) => r.statut === 'en_attente').length;
  const approuves = rows.filter((r) => r.statut === 'approuve').length;
  const refuse = rows.filter((r) => r.statut === 'refuse').length;
  const complement_demande = rows.filter((r) => r.statut === 'complement_demande').length;

  return { total, enAttente, approuves, refuse, complement_demande };
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
    .select('role:role(nom_role, id), date_expiration')
    .eq('id_utilisateur', userId)
    .limit(1)
    .maybeSingle();
  const role = ur?.role;
  const date_expiration = (ur as { date_expiration?: string | null })?.date_expiration;
  return { ...data, role, date_expiration };
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
 * Attribuer ou modifier le rôle d'un utilisateur de l'organisation (rôles 2-5 uniquement).
 * Remplace les rôles de niveau 2-5 existants par le nouveau rôle.
 */
export async function updateAdminUserRole(
  organisationId: string,
  userId: string,
  nom_role: string,
  options?: { date_expiration?: string | null; attribue_par?: string }
): Promise<void> {
  const { data: userRow } = await db('utilisateur')
    .select('id')
    .eq('id', userId)
    .eq('id_organisation', organisationId)
    .single();
  if (!userRow) throw new Error('User not in organisation');

  const { data: roleRow, error: roleError } = await db('role')
    .select('id')
    .eq('nom_role', nom_role)
    .gte('niveau_accreditation', 2)
    .lte('niveau_accreditation', 5)
    .single();
  if (roleError || !roleRow) throw new Error('Invalid role for organisation admin');

  const { data: roles2to5 } = await db('role')
    .select('id')
    .gte('niveau_accreditation', 2)
    .lte('niveau_accreditation', 5);
  const ids2to5 = (roles2to5 || []).map((r: { id: string }) => r.id);
  if (ids2to5.length === 0) throw new Error('No roles 2-5 found');

  await db('utilisateur_role')
    .delete()
    .eq('id_utilisateur', userId)
    .in('id_role', ids2to5);

  const insertRow: Record<string, unknown> = {
    id_utilisateur: userId,
    id_role: roleRow.id,
    date_attribution: new Date().toISOString(),
    attribue_par: options?.attribue_par || null,
  };
  if (options?.date_expiration !== undefined) insertRow.date_expiration = options.date_expiration || null;

  const { error: insertError } = await db('utilisateur_role').insert(insertRow);
  if (insertError) throw insertError;
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
      contact_famille_principale,
      telephone_contact,
      email_contact,
      created_at,
      personne:personne(nom, prenom, nom_complet)
    `)
    .eq('id', dossierId)
    .eq('id_organisation_responsable', organisationId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/** Champs modifiables pour un dossier (admin org / ONG) */
export type AdminDossierUpdatePayload = Partial<Pick<
  AdminDossierRow,
  'date_disparition' | 'statut_dossier' | 'niveau_urgence' | 'lieu_disparition' | 'ville_disparition' | 'region_disparition' | 'pays_disparition' | 'circonstances' | 'contact_famille_principale' | 'telephone_contact' | 'email_contact' | 'type_disparition'
>> & {
  date_derniere_observation?: string | null;
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
  if (payload.contact_famille_principale !== undefined) clean.contact_famille_principale = payload.contact_famille_principale;
  if (payload.telephone_contact !== undefined) clean.telephone_contact = payload.telephone_contact;
  if (payload.email_contact !== undefined) clean.email_contact = payload.email_contact;

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
