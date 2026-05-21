/**
 * =====================================================
 * RETROUVONSLES - Supabase Authentication Service
 * Reproduit la logique exacte de supabase.js en TypeScript
 * =====================================================
 */

import { supabase } from '../../config';
import { revokeFcmPushForLogout } from '../../features/notifications/services/fcmTokenAPI';
import { normalizeAppRole, normalizeAppRoles } from '../../utils/normalizeAppRole';

export { normalizeAppRole, normalizeAppRoles };

// ============================================
// TYPES
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface CompleteProfileData {
  userId: string;
  nom: string;
  prenom: string;
  telephone?: string;
  location?: string;
}

export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

export interface AuthResult<T> {
  data?: T;
  error?: AuthError;
}

export interface AuthUserData {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  nom_complet?: string;
  role: string;
  roles: string[];
  type_compte: string;
  statut_compte: string;
  organisation_id?: string | null;
  telephone?: string | null;
  identite_verifiee?: boolean;
  autorite_echelon?: number | null;
  is_anonymous?: boolean;
  email_confirme?: boolean;
}

export interface AuthSessionData {
  user: AuthUserData;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export interface OAuthResult {
  success: boolean;
  user?: any;
  profile?: any;
  role?: string;
  isNewUser?: boolean;
  needsProfileCompletion?: boolean;
  redirect?: string;
  emailSent?: boolean;
  error?: string;
}

/** Rôle JWT : user_metadata en priorité, puis app_metadata (souvent utilisé pour les admins). */
export function pickAuthJwtRole(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null): string | null {
  if (!user) return null;
  const um = user.user_metadata as Record<string, unknown> | undefined;
  const am = user.app_metadata as Record<string, unknown> | undefined;
  const r = um?.role ?? am?.role;
  return typeof r === 'string' && r.trim() !== '' ? r.trim() : null;
}

/** UUID organisation depuis JWT (admin org / invitations). */
export function pickOrganisationIdFromJwt(user: {
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null): string | null {
  if (!user) return null;
  const um = user.user_metadata as Record<string, unknown> | undefined;
  const am = user.app_metadata as Record<string, unknown> | undefined;
  const candidates = [
    um?.organisation_id,
    um?.id_organisation,
    um?.organisationId,
    am?.organisation_id,
    am?.id_organisation,
    am?.organisationId,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') return c.trim();
  }
  return null;
}

/**
 * Si les RPC profil/rôle ne répondent pas, lecture directe des tables (session déjà posée après signIn).
 * Corrige super-admin sans metadata.role : rôle et nom viennent de `utilisateur` + `utilisateur_role`.
 */
async function loadLoginFallbackFromDb(userId: string): Promise<{
  nom?: string | null;
  prenom?: string | null;
  statut_compte?: string | null;
  type_compte?: string | null;
  id_organisation?: string | null;
  telephone?: string | null;
  identite_verifiee?: boolean;
  autorite_echelon?: number | null;
  mainRole: string | null;
  allRoles: string[] | null;
} | null> {
  try {
    const { data: utilRow, error: uErr } = await (supabase as any)
      .from('utilisateur')
      .select('nom, prenom, statut_compte, type_compte, id_organisation, telephone, identite_verifiee, autorite_echelon')
      .eq('id', userId)
      .maybeSingle();
    if (uErr || !utilRow) return null;

    const { data: urRows, error: urErr } = await (supabase as any)
      .from('utilisateur_role')
      .select('date_expiration, role ( nom_role, niveau_accreditation )')
      .eq('id_utilisateur', userId);

    let mainRole: string | null = null;
    let allRoles: string[] | null = null;

    if (!urErr && Array.isArray(urRows) && urRows.length > 0) {
      const now = Date.now();
      type UrRow = {
        date_expiration?: string | null;
        role?: { nom_role?: string; niveau_accreditation?: number | null } | null;
      };
      const active = (urRows as UrRow[]).filter((row) => {
        if (!row.date_expiration) return true;
        return new Date(row.date_expiration).getTime() > now;
      });
      if (active.length) {
        const scored = active
          .map((row) => ({
            nom: String(row.role?.nom_role || ''),
            niv: Number(row.role?.niveau_accreditation ?? 0),
          }))
          .filter((x) => x.nom.length > 0);
        if (scored.length) {
          scored.sort((a, b) => b.niv - a.niv);
          mainRole = scored[0].nom;
          allRoles = Array.from(new Set(scored.map((s) => s.nom)));
        }
      }
    }

    return {
      ...utilRow,
      mainRole,
      allRoles,
    };
  } catch {
    return null;
  }
}

// ============================================
// HELPER FUNCTIONS (Using RPC functions to bypass RLS)
// ============================================

function isRpcUnavailableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { code?: string; message?: string; details?: string };
  const code = String(e.code || '');
  const msg = `${e.message || ''} ${e.details || ''}`;
  return (
    code === 'PGRST202' ||
    code === '42883' ||
    /404|introuvable|not find|schema cache|does not exist/i.test(msg)
  );
}

async function getUserMainRole(userId: string): Promise<string | null> {
  try {
    // Use RPC function with SECURITY DEFINER to bypass RLS
    const { data, error } = await (supabase as any)
      .rpc('get_user_main_role', { p_user_id: userId });

    if (error) {
      if (!isRpcUnavailableError(error)) {
        console.error('Error getting user role via RPC:', error);
      }
      // Fallback: JWT metadata (session locale uniquement — évite AuthSessionMissingError)
      const { data: sessionData } = await supabase.auth.getSession();
      return normalizeAppRole(pickAuthJwtRole(sessionData?.session?.user as any));
    }

    return normalizeAppRole(data as string | null);
  } catch (error) {
    console.error('Exception in getUserMainRole:', error);
    return null;
  }
}

async function getUserAllRoles(userId: string): Promise<string[]> {
  try {
    // Use RPC function with SECURITY DEFINER to bypass RLS
    const { data, error } = await (supabase as any)
      .rpc('get_user_all_roles', { p_user_id: userId });

    if (error) {
      if (!isRpcUnavailableError(error)) {
        console.error('Error getting user roles via RPC:', error);
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const role = pickAuthJwtRole(sessionData?.session?.user as any);
      return normalizeAppRoles(role ? [role] : []);
    }

    return normalizeAppRoles((data as string[] | null) || ['citoyen']);
  } catch (error) {
    console.error('Exception in getUserAllRoles:', error);
    return ['citoyen'];
  }
}

async function logActivity(activityData: {
  type_action: string;
  id_utilisateur: string;
  description: string;
}): Promise<void> {
  try {
    await (supabase as any)
      .from('journal_activite')
      .insert({
        ...activityData,
        date_action: new Date().toISOString(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
      });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

async function isProfileComplete(userId: string): Promise<boolean> {
  try {
    const { data, error } = await (supabase as any)
      .from('utilisateur')
      .select('nom, prenom, telephone')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return !!(
      data.nom &&
      data.prenom &&
      data.telephone &&
      data.nom !== 'À compléter' &&
      data.prenom !== 'À compléter' &&
      data.telephone !== '+237000000000'
    );
  } catch (error) {
    console.error('Error checking profile completeness:', error);
    return false;
  }
}

// ============================================
// MAIN AUTH SERVICE CLASS
// ============================================

class SupabaseAuthService {

  /**
   * INSCRIPTION - Exactement comme signUpCitizen dans supabase.js
   */
  async register(data: RegisterData): Promise<AuthResult<AuthSessionData>> {
    try {

      const { data: authData, error: authError } = await (supabase as any).auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            type_compte: 'grand_public'
          }
        }
      });

      if (authError) {
        console.error('Erreur inscription citoyen:', authError);

        let message = authError.message;
        if (authError.message?.includes('User already registered')) {
          message = 'Cette adresse email est déjà utilisée. Veuillez vous connecter.';
        } else if (authError.message?.includes('Invalid email')) {
          message = 'Veuillez entrer une adresse email valide';
        }

        return {
          error: {
            code: authError.code || 'SIGNUP_ERROR',
            message,
            status: authError.status,
          },
        };
      }

      if (!authData.user) {
        return {
          error: {
            code: 'NO_USER',
            message: 'Erreur lors de la création du compte',
          },
        };
      }

      // Créer le profil utilisateur (exactement comme supabase.js)
      const { error: userError } = await (supabase as any)
        .from('utilisateur')
        .insert({
          id: authData.user.id,
          email: data.email,
          nom: 'À compléter',
          prenom: 'À compléter',
          telephone: '+237000000000',
          statut_compte: 'actif',
          type_compte: 'grand_public',
          pays: 'Cameroun',
          accepte_notifications: true,
          accepte_geolocalisation: false,
          score_fiabilite: 100.00
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        // On continue quand même - le compte auth est créé
      } else {
        // Assigner le rôle citoyen par défaut
        const { data: defaultRole } = await (supabase as any)
          .from('role')
          .select('id')
          .eq('nom_role', 'citoyen')
          .single();

        if (defaultRole) {
          await (supabase as any)
            .from('utilisateur_role')
            .insert({
              id_utilisateur: authData.user.id,
              id_role: defaultRole.id,
              date_attribution: new Date().toISOString(),
              attribue_par: authData.user.id
            });
        }

        // Log de l'activité
        await logActivity({
          type_action: 'creation_compte',
          id_utilisateur: authData.user.id,
          description: 'Nouvel utilisateur citoyen créé via inscription manuelle'
        });
      }

      return {
        data: {
          user: {
            id: authData.user.id,
            email: data.email,
            nom: 'À compléter',
            prenom: 'À compléter',
            role: 'citoyen',
            roles: ['citoyen'],
            type_compte: 'grand_public',
            statut_compte: 'actif',
            is_anonymous: false,
            email_confirme: Boolean(authData.user.email_confirmed_at),
          },
          access_token: authData.session?.access_token || '',
          refresh_token: authData.session?.refresh_token || '',
          expires_at: authData.session?.expires_at || 0,
        },
      };
    } catch (error: any) {
      console.error('Exception in register:', error);
      return {
        error: {
          code: 'REGISTER_EXCEPTION',
          message: error.message || 'Une erreur est survenue lors de l\'inscription',
        },
      };
    }
  }

  /**
   * Profil + rôles après tout sign-in Supabase réussi (email, anonyme, upgrade, etc.).
   */
  private async composeAuthSessionFromSignedInUser(
    authUser: any,
    session: { access_token: string; refresh_token: string; expires_at: number | null | undefined },
  ): Promise<AuthResult<AuthSessionData>> {
    const { data: userWithRole, error: rpcError } = await (supabase as any).rpc('get_user_with_role', {
      p_user_id: authUser.id,
    });

    let userProfile = userWithRole;
    let mainRole = userWithRole?.role || null;
    let allRoles = userWithRole?.roles || ['citoyen'];

    if (rpcError || !userWithRole) {

      const metadata = authUser.user_metadata || {};
      const jwtRole = pickAuthJwtRole(authUser as any);
      mainRole = jwtRole;
      allRoles = jwtRole ? [jwtRole] : [];

      userProfile = {
        id: authUser.id,
        email: authUser.email,
        nom: metadata.nom || metadata.last_name || 'Non renseigné',
        prenom: metadata.prenom || metadata.first_name || 'Non renseigné',
        type_compte: metadata.type_compte || 'grand_public',
        statut_compte: (metadata.statut_compte as string) || 'actif',
      };

      const fromDb = await loadLoginFallbackFromDb(authUser.id);
      if (fromDb) {
        const isPlaceholder = (s: string | null | undefined) =>
          !s || s === 'Non renseigné' || s === 'À compléter';
        userProfile = {
          ...userProfile,
          nom: !isPlaceholder(fromDb.nom) ? fromDb.nom : userProfile.nom,
          prenom: !isPlaceholder(fromDb.prenom) ? fromDb.prenom : userProfile.prenom,
          type_compte: fromDb.type_compte || userProfile.type_compte,
          statut_compte: fromDb.statut_compte || userProfile.statut_compte,
          id_organisation: fromDb.id_organisation ?? (userProfile as any).id_organisation,
          telephone: fromDb.telephone ?? (userProfile as any).telephone,
          identite_verifiee: fromDb.identite_verifiee ?? (userProfile as any).identite_verifiee,
          autorite_echelon: fromDb.autorite_echelon ?? (userProfile as any).autorite_echelon,
        };
        if (fromDb.mainRole) {
          mainRole = fromDb.mainRole;
          allRoles =
            fromDb.allRoles && fromDb.allRoles.length > 0 ? fromDb.allRoles : [fromDb.mainRole];
        } else if (!mainRole) {
          mainRole = 'citoyen';
          allRoles = ['citoyen'];
        }
      } else if (!mainRole) {
        mainRole = 'citoyen';
        allRoles = ['citoyen'];
      } else {
        allRoles = [mainRole];
      }
    }

    const jwtOrgFill = pickOrganisationIdFromJwt(authUser as any);
    if (userProfile && jwtOrgFill && !(userProfile as any).id_organisation) {
      userProfile = { ...(userProfile as any), id_organisation: jwtOrgFill };
    }

    if (userProfile?.statut_compte === 'suspendu' || userProfile?.statut_compte === 'bloque') {
      return {
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Votre compte est suspendu. Contactez l\'administrateur.',
        },
      };
    }

    mainRole = normalizeAppRole(mainRole ?? 'citoyen');
    allRoles = normalizeAppRoles(allRoles);

    logActivity({
      type_action: 'connexion',
      id_utilisateur: authUser.id,
      description: 'Connexion réussie',
    }).catch(() => {});

    const isAnonymous = Boolean(authUser.is_anonymous);

    return {
      data: {
        user: {
          id: authUser.id,
          email: authUser.email || '',
          nom: userProfile?.nom || 'Non renseigné',
          prenom: userProfile?.prenom || 'Non renseigné',
          nom_complet:
            userProfile?.nom_complet ||
            `${userProfile?.prenom || ''} ${userProfile?.nom || ''}`.trim() ||
            'Utilisateur',
          role: mainRole || 'citoyen',
          roles: allRoles,
          type_compte: userProfile?.type_compte || 'grand_public',
          statut_compte: userProfile?.statut_compte || 'actif',
          organisation_id:
            userProfile?.id_organisation || pickOrganisationIdFromJwt(authUser as any) || null,
          telephone: userProfile?.telephone || null,
          identite_verifiee: userProfile?.identite_verifiee ?? false,
          autorite_echelon: userProfile?.autorite_echelon ?? null,
          is_anonymous: isAnonymous,
          email_confirme: Boolean(authUser.email_confirmed_at),
        },
        access_token: session.access_token || '',
        refresh_token: session.refresh_token || '',
        expires_at: session.expires_at ?? 0,
      },
    };
  }

  /**
   * CONNEXION - Exactement comme la logique de connexion.js
   */
  async login(credentials: LoginCredentials): Promise<AuthResult<AuthSessionData>> {
    try {

      const { data: authData, error: authError } = await (supabase as any).auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError) {
        console.error('Erreur d\'authentification:', authError);

        let message = authError.message;
        if (authError.message?.includes('Invalid login credentials')) {
          message = 'Email ou mot de passe incorrect';
        } else if (authError.message?.includes('Email not confirmed')) {
          message = 'Veuillez confirmer votre email avant de vous connecter';
        }

        return {
          error: {
            code: authError.code || 'LOGIN_ERROR',
            message,
            status: authError.status,
          },
        };
      }

      if (!authData.user) {
        return {
          error: {
            code: 'NO_USER',
            message: 'Aucun utilisateur trouvé',
          },
        };
      }

      return await this.composeAuthSessionFromSignedInUser(authData.user, {
        access_token: authData.session?.access_token || '',
        refresh_token: authData.session?.refresh_token || '',
        expires_at: authData.session?.expires_at ?? 0,
      });
    } catch (error: any) {
      console.error('Exception in login:', error);
      return {
        error: {
          code: 'LOGIN_EXCEPTION',
          message: 'Une erreur est survenue lors de la connexion',
        },
      };
    }
  }

  /**
   * Connexion anonyme (Supabase) — même user.id pour les données, upgrade possible plus tard.
   */
  async signInAnonymously(): Promise<AuthResult<AuthSessionData>> {
    try {
      const { data: authData, error: authError } = await (supabase as any).auth.signInAnonymously();

      if (authError) {
        let message = authError.message || 'Connexion sans compte impossible';
        const raw = String(authError.message || '').toLowerCase();
        if (raw.includes('anonymous') && (raw.includes('disabled') || raw.includes('not enabled'))) {
          message =
            'Les accès temporaires sans compte sont désactivés côté serveur. Activez « Anonymous sign-ins » dans le tableau Supabase.';
        }
        return {
          error: {
            code: authError.code || 'ANON_ERROR',
            message,
            status: authError.status,
          },
        };
      }

      if (!authData?.user || !authData?.session) {
        return {
          error: {
            code: 'NO_SESSION',
            message: 'Session anonyme introuvable',
          },
        };
      }

      try {
        await (supabase as any).rpc('ensure_current_user_profile');
      } catch (e) {
        console.warn('[auth] ensure_current_user_profile anonymous skipped:', e);
      }

      return await this.composeAuthSessionFromSignedInUser(authData.user, {
        access_token: authData.session.access_token || '',
        refresh_token: authData.session.refresh_token || '',
        expires_at: authData.session.expires_at ?? 0,
      });
    } catch (error: any) {
      console.error('Exception in signInAnonymously:', error);
      return {
        error: {
          code: 'ANON_EXCEPTION',
          message: error.message || 'Connexion sans compte impossible',
        },
      };
    }
  }

  /**
   * Lie email + mot de passe à un compte anonyme (même id utilisateur).
   */
  async upgradeAnonymousAccount(data: {
    email: string;
    password: string;
  }): Promise<AuthResult<AuthSessionData>> {
    try {
      const { data: updated, error } = await (supabase as any).auth.updateUser({
        email: data.email,
        password: data.password,
      });

      if (error) {
        let message = error.message || 'Impossible d\'enregistrer le compte';
        if (String(error.message || '').includes('already registered')) {
          message = 'Cette adresse e-mail est déjà utilisée. Connectez-vous ou utilisez une autre adresse.';
        }
        return {
          error: {
            code: error.code || 'UPGRADE_ERROR',
            message,
            status: error.status,
          },
        };
      }

      if (!updated?.user) {
        return {
          error: {
            code: 'NO_USER',
            message: 'Mise à jour du compte impossible',
          },
        };
      }

      const { data: sessionData } = await (supabase as any).auth.getSession();
      if (!sessionData?.session) {
        return {
          error: {
            code: 'NO_SESSION',
            message: 'Session introuvable après enregistrement du compte',
          },
        };
      }

      return await this.composeAuthSessionFromSignedInUser(updated.user, sessionData.session);
    } catch (error: any) {
      console.error('Exception in upgradeAnonymousAccount:', error);
      return {
        error: {
          code: 'UPGRADE_EXCEPTION',
          message: error.message || 'Erreur lors de l\'enregistrement du compte',
        },
      };
    }
  }

  /**
   * DÉCONNEXION
   */
  async logout(): Promise<AuthResult<void>> {
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();

      if (user?.id) {
        try {
          await revokeFcmPushForLogout(user.id);
        } catch (e) {
          console.warn('[auth] revokeFcmPushForLogout:', e);
        }
      }

      if (user) {
        await logActivity({
          type_action: 'deconnexion',
          id_utilisateur: user.id,
          description: 'Déconnexion de l\'utilisateur'
        });
      }

      const { error } = await (supabase as any).auth.signOut();

      if (error) {
        return {
          error: {
            code: 'LOGOUT_ERROR',
            message: error.message,
          },
        };
      }

      return { data: undefined };
    } catch (error: any) {
      return {
        error: {
          code: 'LOGOUT_EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * OAuth SIGNUP - Google/Facebook
   */
  async handleOAuthSignup(provider: 'google' | 'facebook'): Promise<AuthResult<any>> {
    try {
      const { data: { session } } = await (supabase as any).auth.getSession();
      if (session) {
        await (supabase as any).auth.signOut();
      }

      const options: any = {
        redirectTo: `${window.location.origin}/auth/callback?source=${provider}`,
      };

      if (provider === 'google') {
        options.queryParams = {
          access_type: 'offline',
          prompt: 'consent'
        };
      } else if (provider === 'facebook') {
        options.scopes = 'email,public_profile';
      }

      const { data, error } = await (supabase as any).auth.signInWithOAuth({
        provider,
        options
      });

      if (error) {
        console.error(`${provider} OAuth error:`, error);
        return {
          error: {
            code: 'OAUTH_ERROR',
            message: error.message,
          },
        };
      }

      return { data };
    } catch (error: any) {
      console.error(`Exception in handleOAuthSignup(${provider}):`, error);
      return {
        error: {
          code: 'OAUTH_EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * OAuth CALLBACK - Exactement comme handleOAuthCallback dans supabase.js
   */
  async handleOAuthCallback(): Promise<OAuthResult> {
    try {

      const { data: { session }, error: sessionError } = await (supabase as any).auth.getSession();

      if (sessionError || !session) {
        return {
          success: false,
          error: 'Aucune session trouvée après OAuth'
        };
      }

      const user = session.user;

      // Vérifier si le profil existe
      const { data: userProfile, error: profileError } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const userMetadata = user.user_metadata || {};

      // Si le profil n'existe pas, le créer
      if (!userProfile || profileError?.code === 'PGRST116') {

        const { data: newProfile, error: createError } = await (supabase as any)
          .from('utilisateur')
          .insert({
            id: user.id,
            email: user.email,
            nom: userMetadata.family_name || userMetadata.last_name || userMetadata.name?.split(' ')[1] || 'À compléter',
            prenom: userMetadata.given_name || userMetadata.first_name || userMetadata.name?.split(' ')[0] || 'À compléter',
            telephone: '+237000000000',
            photo_profil: userMetadata.avatar_url || userMetadata.picture,
            statut_compte: 'actif',
            type_compte: 'grand_public',
            pays: 'Cameroun',
            score_fiabilite: 100.00
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
        }

        // Assigner le rôle citoyen
        const { data: defaultRole } = await (supabase as any)
          .from('role')
          .select('id')
          .eq('nom_role', 'citoyen')
          .single();

        if (defaultRole) {
          await (supabase as any)
            .from('utilisateur_role')
            .insert({
              id_utilisateur: user.id,
              id_role: defaultRole.id,
              date_attribution: new Date().toISOString(),
              attribue_par: user.id
            });
        }

        await logActivity({
          type_action: 'creation_compte',
          id_utilisateur: user.id,
          description: 'Nouvel utilisateur créé via OAuth'
        });

        // Vérifier si le profil est complet
        const profileComplete = await isProfileComplete(user.id);

        if (!profileComplete) {

          return {
            success: true,
            user,
            profile: newProfile || null,
            isNewUser: true,
            needsProfileCompletion: true,
            redirect: '/auth/complete-profile'
          };
        }

        return {
          success: true,
          user,
          profile: newProfile || null,
          role: 'citoyen',
          isNewUser: true,
          emailSent: false
        };
      }

      // Profil existe, vérifier s'il est complet
      const profileComplete = await isProfileComplete(user.id);

      if (!profileComplete) {

        return {
          success: true,
          user,
          profile: userProfile,
          needsProfileCompletion: true,
          redirect: '/auth/complete-profile'
        };
      }

      const mainRole = await getUserMainRole(user.id);

      return {
        success: true,
        user,
        profile: userProfile,
        role: normalizeAppRole(mainRole || 'citoyen'),
        isNewUser: false
      };
    } catch (error: any) {
      console.error('Error in handleOAuthCallback:', error);
      return {
        success: false,
        error: 'Erreur lors du traitement OAuth'
      };
    }
  }

  /**
   * COMPLETE PROFILE - Exactement comme completeOAuthSignup dans supabase.js
   */
  async completeProfile(data: CompleteProfileData): Promise<AuthResult<any>> {
    try {

      const { data: existingUser, error: checkError } = await (supabase as any)
        .from('utilisateur')
        .select('id, email')
        .eq('id', data.userId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        return {
          error: {
            code: 'CHECK_ERROR',
            message: checkError.message,
          },
        };
      }

      let profileData;

      if (existingUser) {
        // Mettre à jour le profil existant
        const { data: updated, error: updateError } = await (supabase as any)
          .from('utilisateur')
          .update({
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone || null,
            ville: data.location || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.userId)
          .select()
          .single();

        if (updateError) {
          return {
            error: {
              code: 'UPDATE_ERROR',
              message: updateError.message,
            },
          };
        }

        profileData = updated;
      } else {
        // Créer un nouveau profil
        const { data: { user }, error: authError } = await (supabase as any).auth.getUser();

        if (authError || !user) {
          return {
            error: {
              code: 'NO_SESSION',
              message: 'Session expirée. Veuillez vous reconnecter.',
            },
          };
        }

        const { data: created, error: insertError } = await (supabase as any)
          .from('utilisateur')
          .insert({
            id: data.userId,
            email: user.email,
            nom: data.nom,
            prenom: data.prenom,
            telephone: data.telephone || null,
            ville: data.location || null,
            statut_compte: 'actif',
            type_compte: 'grand_public',
            pays: 'Cameroun',
            score_fiabilite: 100.00
          })
          .select()
          .single();

        if (insertError) {
          return {
            error: {
              code: 'INSERT_ERROR',
              message: insertError.message,
            },
          };
        }

        profileData = created;

        // Assigner le rôle
        const { data: defaultRole } = await (supabase as any)
          .from('role')
          .select('id')
          .eq('nom_role', 'citoyen')
          .single();

        if (defaultRole) {
          await (supabase as any)
            .from('utilisateur_role')
            .insert({
              id_utilisateur: data.userId,
              id_role: defaultRole.id,
              date_attribution: new Date().toISOString(),
              attribue_par: data.userId
            });
        }
      }

      // Mettre à jour les métadonnées auth
      await (supabase as any).auth.updateUser({
        data: {
          first_name: data.prenom,
          last_name: data.nom,
          phone: data.telephone,
          profile_completed: true
        }
      });

      await logActivity({
        type_action: 'modification_profil',
        id_utilisateur: data.userId,
        description: 'Profil complété'
      });

      return { data: profileData };
    } catch (error: any) {
      console.error('Error in completeProfile:', error);
      return {
        error: {
          code: 'COMPLETE_PROFILE_ERROR',
          message: error.message,
        },
      };
    }
  }

  /**
   * REQUEST PASSWORD RESET
   */
  async requestPasswordReset(request: { email: string }): Promise<AuthResult<void>> {
    try {
      const { error } = await (supabase as any).auth.resetPasswordForEmail(request.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return {
          error: {
            code: 'RESET_REQUEST_ERROR',
            message: error.message,
          },
        };
      }

      return { data: undefined };
    } catch (error: any) {
      return {
        error: {
          code: 'RESET_REQUEST_EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * RESET PASSWORD
   */
  async resetPassword(data: { password: string }): Promise<AuthResult<AuthSessionData>> {
    try {
      const { data: authData, error } = await (supabase as any).auth.updateUser({
        password: data.password
      });

      if (error) {
        return {
          error: {
            code: 'RESET_PASSWORD_ERROR',
            message: error.message,
          },
        };
      }

      const { data: { session } } = await (supabase as any).auth.getSession();

      return {
        data: {
          user: {
            id: authData.user?.id || '',
            email: authData.user?.email || '',
            nom: '',
            prenom: '',
            role: 'citoyen',
            roles: ['citoyen'],
            type_compte: 'grand_public',
            statut_compte: 'actif',
          },
          access_token: session?.access_token || '',
          refresh_token: session?.refresh_token || '',
          expires_at: session?.expires_at || 0,
        },
      };
    } catch (error: any) {
      return {
        error: {
          code: 'RESET_PASSWORD_EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * VERIFY EMAIL
   */
  async verifyEmail(_code: string): Promise<AuthResult<void>> {
    try {
      // Supabase gère la vérification via le lien envoyé par email
      return { data: undefined };
    } catch (error: any) {
      return {
        error: {
          code: 'VERIFY_EMAIL_ERROR',
          message: error.message,
        },
      };
    }
  }

  /**
   * RESEND VERIFICATION EMAIL
   */
  async resendVerificationEmail(email: string): Promise<AuthResult<void>> {
    try {
      const { error } = await (supabase as any).auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return {
          error: {
            code: 'RESEND_EMAIL_ERROR',
            message: error.message,
          },
        };
      }

      return { data: undefined };
    } catch (error: any) {
      return {
        error: {
          code: 'RESEND_EMAIL_EXCEPTION',
          message: error.message,
        },
      };
    }
  }

  /**
   * GET CURRENT SESSION
   */
  async getCurrentSession(): Promise<AuthResult<AuthSessionData>> {
    try {
      const { data: { session }, error } = await (supabase as any).auth.getSession();

      if (error || !session) {
        return {
          error: {
            code: 'NO_SESSION',
            message: 'Aucune session active',
          },
        };
      }

      const user = session.user;

      // Récupérer le profil
      const { data: profile } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const mainRole = await getUserMainRole(user.id);
      const allRoles = await getUserAllRoles(user.id);

      return {
        data: {
          user: {
            id: user.id,
            email: user.email || '',
            nom: profile?.nom || '',
            prenom: profile?.prenom || '',
            role: normalizeAppRole(mainRole || 'citoyen'),
            roles: normalizeAppRoles(allRoles),
            type_compte: profile?.type_compte || 'grand_public',
            statut_compte: profile?.statut_compte || 'actif',
            organisation_id:
              profile?.id_organisation ?? pickOrganisationIdFromJwt(user as any) ?? null,
            identite_verifiee: profile?.identite_verifiee ?? false,
            autorite_echelon: profile?.autorite_echelon ?? null,
            is_anonymous: Boolean((user as any).is_anonymous),
            email_confirme: Boolean(user.email_confirmed_at),
          },
          access_token: session.access_token,
          refresh_token: session.refresh_token || '',
          expires_at: session.expires_at || 0,
        },
      };
    } catch (error: any) {
      return {
        error: {
          code: 'SESSION_ERROR',
          message: error.message,
        },
      };
    }
  }

  /**
   * REFRESH TOKEN
   */
  async refreshToken(_refreshToken: string): Promise<AuthResult<AuthSessionData>> {
    try {
      const { data, error } = await (supabase as any).auth.refreshSession();

      if (error || !data.session) {
        return {
          error: {
            code: 'REFRESH_ERROR',
            message: error?.message || 'Impossible de rafraîchir la session',
          },
        };
      }

      const user = data.session.user;

      // Récupérer le profil
      const { data: profile } = await (supabase as any)
        .from('utilisateur')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const mainRole = await getUserMainRole(user.id);
      const allRoles = await getUserAllRoles(user.id);

      return {
        data: {
          user: {
            id: user.id,
            email: user.email || '',
            nom: profile?.nom || '',
            prenom: profile?.prenom || '',
            role: normalizeAppRole(mainRole || 'citoyen'),
            roles: normalizeAppRoles(allRoles),
            type_compte: profile?.type_compte || 'grand_public',
            statut_compte: profile?.statut_compte || 'actif',
            organisation_id:
              profile?.id_organisation ?? pickOrganisationIdFromJwt(user as any) ?? null,
            identite_verifiee: profile?.identite_verifiee ?? false,
            autorite_echelon: profile?.autorite_echelon ?? null,
          },
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token || '',
          expires_at: data.session.expires_at || 0,
        },
      };
    } catch (error: any) {
      return {
        error: {
          code: 'REFRESH_EXCEPTION',
          message: error.message,
        },
      };
    }
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const supabaseAuthService = new SupabaseAuthService();

// ============================================
// UTILITY EXPORTS
// ============================================

export async function getCurrentUser(): Promise<{ user: any; error: any }> {
  const { data: { user }, error } = await (supabase as any).auth.getUser();
  return { user, error };
}

export async function signOut(): Promise<{ error: any }> {
  const { user } = await getCurrentUser();
  if (user?.id) {
    try {
      await revokeFcmPushForLogout(user.id);
    } catch (e) {
      console.warn('[auth] revokeFcmPushForLogout (signOut):', e);
    }
  }
  if (user) {
    await logActivity({
      type_action: 'deconnexion',
      id_utilisateur: user.id,
      description: 'Déconnexion de l\'utilisateur'
    });
  }
  const { error } = await (supabase as any).auth.signOut();
  return { error };
}

export async function getUserAccountStatus(userId: string): Promise<string> {
  try {
    const { data, error } = await (supabase as any)
      .from('utilisateur')
      .select('statut_compte')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.statut_compte || 'en_attente_verification';
  } catch (error) {
    console.error('Erreur récupération statut compte:', error);
    return 'en_attente_verification';
  }
}

/**
 * Base URL après auth (OAuth, liens). Les comptes `admin_systeme` liés à une org
 * utilisent le silo Autorité ; sans org, ils utilisent le silo Super-admin.
 */
export const getRedirectPathByRole = (
  role: string,
  organisationId?: string | null
): string => {
  const r = normalizeAppRole(role);
  if (r === 'admin_systeme') {
    return organisationId ? '/authority' : '/super-admin';
  }
  const routes: Record<string, string> = {
    citoyen: '/citizen',
    autorite: '/authority',
  };
  return routes[r] || '/citizen';
};

/**
 * Après login : `admin_systeme` + organisation → silo Autorité ; sans org → Super-admin.
 * (La migration DB fusionne les anciens rôles sur `admin_systeme` ; seul `id_organisation` les distingue.)
 */
export function getDashboardPathAfterLogin(
  role: string,
  organisationId?: string | null
): string {
  const r = normalizeAppRole(role);
  if (r === 'admin_systeme') {
    return organisationId ? '/authority/dashboard' : '/super-admin/dashboard';
  }
  if (r === 'autorite') return '/authority/dashboard';
  return '/citizen/dashboard';
}

// Export helper functions (normalizeAppRole est exporté plus haut)
export { getUserMainRole, isProfileComplete };

// Export handleOAuthCallback as standalone function
export const handleOAuthCallback = () => supabaseAuthService.handleOAuthCallback();
