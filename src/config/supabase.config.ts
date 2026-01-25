/**
 * =====================================================
 * RETROUVONSLES - Configuration Supabase
 * Client Supabase avec authentification OAuth 2.0
 * =====================================================
 */

import { createClient, AuthChangeEvent, Session, Provider } from '@supabase/supabase-js';
import { Database } from '../@types/database.types';
import { envConfig } from './env.config';

// ============================================
// VARIABLES D'ENVIRONNEMENT
// ============================================

const SUPABASE_URL = envConfig.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = envConfig.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Variables d\'environnement Supabase manquantes. ' +
    'Assurez-vous que REACT_APP_SUPABASE_URL et REACT_APP_SUPABASE_ANON_KEY sont définis.'
  );
}

// ============================================
// CONFIGURATION OAUTH 2.0
// ============================================

const getOAuthRedirectUrl = (): string => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:3000/auth/callback'; // Fallback pour SSR
};

export const OAUTH_CONFIG = {
  google: {
    redirectTo: getOAuthRedirectUrl(),
    scopes: 'email profile',
  },
  facebook: {
    redirectTo: getOAuthRedirectUrl(),
    scopes: 'email public_profile',
  },
} as const;

// ============================================
// OPTIONS DE CONFIGURATION SUPABASE
// ============================================

const getSupabaseOptions = () => ({
  auth: {
    // Persist session in localStorage
    persistSession: typeof window !== 'undefined',
    
    // Auto refresh token before expiry
    autoRefreshToken: true,
    
    // Detect session from URL (for OAuth redirects)
    detectSessionInUrl: typeof window !== 'undefined',
    
    // Storage key for session
    storageKey: 'retrouvonsles-auth-token',
    
    // Custom storage (localStorage par défaut)
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    
    // Flow type for PKCE
    flowType: 'pkce' as const,
  },
  
  global: {
    headers: {
      'x-application-name': 'RetrouvonsLes',
      'x-api-version': '1.0',
    },
  },
  
  // Configuration realtime
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  
  // Configuration de la base de données
  db: {
    schema: 'public' as const,
  },
});

const supabaseOptions = getSupabaseOptions();

// ============================================
// CLIENT SUPABASE
// ============================================

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  supabaseOptions
);

// ============================================
// TYPES D'ÉVÉNEMENTS AUTH
// ============================================

export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export interface AuthEventCallback {
  (event: AuthChangeEvent, session: Session | null): void;
}

// ============================================
// GESTION DES ÉVÉNEMENTS AUTH
// ============================================

/**
 * Classe pour gérer les événements d'authentification
 */
class AuthEventManager {
  private listeners: Map<string, AuthEventCallback> = new Map();
  private subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null;

  /**
   * Initialise l'écoute des événements auth
   */
  initialize(): void {
    if (this.subscription) {
      return; // Déjà initialisé
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth Event]', event, session?.user?.email);
      
      // Notifier tous les listeners
      this.listeners.forEach(callback => {
        try {
          callback(event, session);
        } catch (error) {
          console.error('[Auth Event Error]', error);
        }
      });
    });

    this.subscription = data.subscription;
  }

  /**
   * Ajoute un listener pour les événements auth
   */
  addListener(id: string, callback: AuthEventCallback): void {
    this.listeners.set(id, callback);
  }

  /**
   * Retire un listener
   */
  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  /**
   * Nettoie tous les listeners et la subscription
   */
  cleanup(): void {
    this.listeners.clear();
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}

export const authEventManager = new AuthEventManager();

// ============================================
// HELPERS D'AUTHENTIFICATION
// ============================================

/**
 * Récupère la session courante
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[Get Session Error]', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[Get Session Exception]', error);
    return null;
  }
};

/**
 * Récupère l'utilisateur courant
 */
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('[Get User Error]', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('[Get User Exception]', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const session = await getCurrentSession();
  return session !== null;
};

/**
 * Connexion avec email/password
 */
export const signInWithPassword = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

/**
 * Inscription avec email/password
 */
export const signUpWithPassword = async (
  email: string,
  password: string,
  metadata?: Record<string, any>
) => {
  const redirectUrl = getOAuthRedirectUrl();
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${redirectUrl.replace('/auth/callback', '')}/auth/verify-email`,
    },
  });
};

/**
 * Connexion avec Google OAuth
 */
export const signInWithGoogle = async () => {
  const redirectUrl = getOAuthRedirectUrl();
  return await supabase.auth.signInWithOAuth({
    provider: 'google' as Provider,
    options: {
      redirectTo: redirectUrl,
      scopes: OAUTH_CONFIG.google.scopes,
    },
  });
};

/**
 * Connexion avec Facebook OAuth
 */
export const signInWithFacebook = async () => {
  const redirectUrl = getOAuthRedirectUrl();
  return await supabase.auth.signInWithOAuth({
    provider: 'facebook' as Provider,
    options: {
      redirectTo: redirectUrl,
      scopes: OAUTH_CONFIG.facebook.scopes,
    },
  });
};

/**
 * Déconnexion
 */
export const signOut = async () => {
  return await supabase.auth.signOut();
};

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (email: string) => {
  const redirectUrl = getOAuthRedirectUrl();
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${redirectUrl.replace('/auth/callback', '')}/auth/reset-password`,
  });
};

/**
 * Mise à jour du mot de passe
 */
export const updatePassword = async (newPassword: string) => {
  return await supabase.auth.updateUser({
    password: newPassword,
  });
};

/**
 * Mise à jour des métadonnées utilisateur
 */
export const updateUserMetadata = async (metadata: Record<string, any>) => {
  return await supabase.auth.updateUser({
    data: metadata,
  });
};

/**
 * Rafraîchit la session
 */
export const refreshSession = async () => {
  return await supabase.auth.refreshSession();
};

// ============================================
// HELPERS DE BASE DE DONNÉES
// ============================================

/**
 * Interface pour les réponses de requête
 */
export interface QueryResponse<T = any> {
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: any;
  } | null;
  status: number;
  statusText: string;
}

/**
 * Effectue une requête avec gestion d'erreur complète
 */
export const query = async <T = any>(
  queryBuilder: any
): Promise<QueryResponse<T>> => {
  try {
    const result = await queryBuilder;
    
    if (result.error) {
      console.error('[Supabase Query Error]', result.error);
      return {
        data: null,
        error: {
          code: result.error.code || 'UNKNOWN_ERROR',
          message: result.error.message || 'Une erreur est survenue',
          details: result.error,
        },
        status: result.status || 500,
        statusText: result.statusText || 'Internal Server Error',
      };
    }
    
    return {
      data: result.data,
      error: null,
      status: result.status || 200,
      statusText: result.statusText || 'OK',
    };
  } catch (error) {
    console.error('[Supabase Query Exception]', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      data: null,
      error: {
        code: 'EXCEPTION',
        message: errorMessage,
        details: error,
      },
      status: 500,
      statusText: 'Internal Server Error',
    };
  }
};

/**
 * Récupère le profil utilisateur complet depuis la table utilisateur
 */
export const getUserProfile = async (userId: string) => {
  return await query(
    supabase
      .from('utilisateur')
      .select('*')
      .eq('id', userId)
      .single()
  );
};

/**
 * Récupère les données d'une table avec pagination
 */
export const getTableData = async <T = any>(
  table: string,
  options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
    ascending?: boolean;
    filter?: { column: string; value: any }[];
  }
) => {
  let query_builder = supabase.from(table).select('*');
  
  if (options?.filter) {
    options.filter.forEach(f => {
      query_builder = query_builder.eq(f.column, f.value);
    });
  }
  
  if (options?.orderBy) {
    query_builder = query_builder.order(options.orderBy, {
      ascending: options?.ascending ?? false,
    });
  }
  
  if (options?.limit) {
    query_builder = query_builder.limit(options.limit);
  }
  
  if (options?.offset) {
    query_builder = query_builder.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  return await query<T[]>(query_builder);
};

/**
 * Insère des données dans une table
 */
export const insertData = async <T = any>(
  table: string,
  data: any
) => {
  return await query<T>(
    supabase
      .from(table)
      .insert(data)
      .select()
  );
};

/**
 * Met à jour des données dans une table
 */
export const updateData = async <T = any>(
  table: string,
  data: any,
  filter: { column: string; value: any }
) => {
  const queryBuilder: any = (supabase as any).from(table).update(data);
  
  return await query<T>(queryBuilder.eq(filter.column, filter.value).select());
};

/**
 * Supprime des données d'une table
 */
export const deleteData = async <T = any>(
  table: string,
  filter: { column: string; value: any }
) => {
  let query_builder: any = supabase.from(table).delete();
  query_builder = query_builder.eq(filter.column, filter.value);
  
  return await query<T>(query_builder);
};

// ============================================
// HELPERS SPÉCIALISÉS PAR DOMAINE
// ============================================

/**
 * HELPERS POUR LA TABLE PERSONNE (Personne disparue)
 */
export const personneHelpers = {
  /**
   * Crée une nouvelle personne disparue
   */
  create: async (data: any) => {
    return await insertData('personne', {
      ...data,
      created_at: new Date().toISOString(),
      status: 'active',
    });
  },

  /**
   * Met à jour une personne
   */
  update: async (id: string, data: any) => {
    return await updateData('personne', {
      ...data,
      updated_at: new Date().toISOString(),
    }, { column: 'id', value: id });
  },

  /**
   * Récupère une personne par ID
   */
  getById: async (id: string) => {
    return await query(
      supabase
        .from('personne')
        .select('*')
        .eq('id', id)
        .single()
    );
  },

  /**
   * Recherche des personnes par critères
   */
  search: async (criteria: {
    nom?: string;
    prenom?: string;
    dateNaissance?: string;
    region?: string;
    statut?: string;
  }) => {
    let q = supabase.from('personne').select('*');
    
    if (criteria.nom) q = q.ilike('nom', `%${criteria.nom}%`);
    if (criteria.prenom) q = q.ilike('prenom', `%${criteria.prenom}%`);
    if (criteria.dateNaissance) q = q.eq('date_naissance', criteria.dateNaissance);
    if (criteria.region) q = q.eq('region', criteria.region);
    if (criteria.statut) q = q.eq('statut', criteria.statut);
    
    return await query(q.order('created_at', { ascending: false }));
  },

  /**
   * Récupère les personnes avec photos
   */
  withPhotos: async (personneId: string) => {
    return await query(
      supabase
        .from('personne')
        .select('*, photos:photo(*)')
        .eq('id', personneId)
        .single()
    );
  },
};

/**
 * HELPERS POUR LA TABLE ALERTE
 */
export const alerteHelpers = {
  /**
   * Crée une nouvelle alerte
   */
  create: async (data: any) => {
    return await insertData('alerte', {
      ...data,
      created_at: new Date().toISOString(),
      status: 'active',
    });
  },

  /**
   * Récupère les alertes pour une personne
   */
  getByPersonne: async (personneId: string) => {
    return await query(
      supabase
        .from('alerte')
        .select('*')
        .eq('personne_id', personneId)
        .order('created_at', { ascending: false })
    );
  },

  /**
   * Récupère les alertes actives par région
   */
  getActiveByRegion: async (region: string) => {
    return await query(
      supabase
        .from('alerte')
        .select('*, personne:personne_id(*)')
        .eq('status', 'active')
        .eq('personne.region', region)
        .order('created_at', { ascending: false })
    );
  },

  /**
   * Ferme une alerte
   */
  close: async (alerteId: string) => {
    return await updateData('alerte', {
      status: 'closed',
      closed_at: new Date().toISOString(),
    }, { column: 'id', value: alerteId });
  },
};

/**
 * HELPERS POUR LA TABLE SIGNALEMENT
 */
export const signalementHelpers = {
  /**
   * Crée un nouveau signalement
   */
  create: async (data: any) => {
    return await insertData('signalement', {
      ...data,
      created_at: new Date().toISOString(),
      status: 'pending',
    });
  },

  /**
   * Récupère les signalements pour une personne
   */
  getByPersonne: async (personneId: string) => {
    return await query(
      supabase
        .from('signalement')
        .select('*')
        .eq('personne_id', personneId)
        .order('created_at', { ascending: false })
    );
  },

  /**
   * Récupère les signalements non traités
   */
  getPending: async (limit = 50) => {
    return await query(
      supabase
        .from('signalement')
        .select('*, personne:personne_id(*), utilisateur:user_id(*)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit)
    );
  },

  /**
   * Marque un signalement comme traité
   */
  markAsProcessed: async (signalementId: string, result: 'verified' | 'invalid') => {
    return await updateData('signalement', {
      status: 'processed',
      result,
      processed_at: new Date().toISOString(),
    }, { column: 'id', value: signalementId });
  },
};

/**
 * HELPERS POUR LA TABLE FILIATION
 */
export const filiationHelpers = {
  /**
   * Crée un lien de filiation
   */
  create: async (parent_id: string, child_id: string, metadata?: any) => {
    return await insertData('filiation', {
      parent_id,
      child_id,
      confidence_score: metadata?.score || 0.5,
      metadata: metadata || {},
      verified: false,
      created_at: new Date().toISOString(),
    });
  },

  /**
   * Récupère les liens de filiation pour une personne
   */
  getConnections: async (personneId: string) => {
    return await query(
      supabase
        .from('filiation')
        .select('*, parent:parent_id(*), child:child_id(*)')
        .or(`parent_id.eq.${personneId},child_id.eq.${personneId}`)
    );
  },

  /**
   * Vérifie un lien de filiation
   */
  verify: async (filiationId: string) => {
    return await updateData('filiation', {
      verified: true,
      verified_at: new Date().toISOString(),
    }, { column: 'id', value: filiationId });
  },
};

/**
 * HELPERS POUR LES PHOTOS
 */
export const photoHelpers = {
  /**
   * Ajoute une photo à une personne
   */
  addToPersonne: async (personneId: string, photoUrl: string, photoPath: string) => {
    return await insertData('photo', {
      personne_id: personneId,
      url: photoUrl,
      storage_path: photoPath,
      is_main: false,
      created_at: new Date().toISOString(),
    });
  },

  /**
   * Définit la photo principale
   */
  setAsMain: async (personneId: string, photoId: string) => {
    // D'abord, retire le flag main des autres photos
    await updateData('photo', { is_main: false }, { column: 'personne_id', value: personneId });
    
    // Puis, définit celle-ci comme principale
    return await updateData('photo', { is_main: true }, { column: 'id', value: photoId });
  },

  /**
   * Récupère les photos d'une personne
   */
  getByPersonne: async (personneId: string) => {
    return await query(
      supabase
        .from('photo')
        .select('*')
        .eq('personne_id', personneId)
        .order('is_main', { ascending: false })
    );
  },
};

// ============================================
// HELPERS DE STORAGE (CLOUDINARY)
// ============================================

/**
 * Même si on utilise Cloudinary, Supabase Storage peut servir de backup
 */
export const uploadToStorage = async (
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean; contentType?: string }
) => {
  return await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType ?? file.type,
    });
};

/**
 * Récupère l'URL publique d'un fichier
 */
export const getPublicUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Supprime un fichier du storage
 */
export const deleteFromStorage = async (bucket: string, paths: string[]) => {
  return await supabase.storage
    .from(bucket)
    .remove(paths);
};

// ============================================
// HELPERS REALTIME
// ============================================

/**
 * S'abonner aux changements d'une table
 */
export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`public:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        ...(filter && { filter }),
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

/**
 * S'abonner aux insertions d'une table
 */
export const subscribeToInserts = (
  table: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`public:${table}:insert`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: table,
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

/**
 * S'abonner aux mises à jour d'une table
 */
export const subscribeToUpdates = (
  table: string,
  callback: (payload: any) => void,
  filter?: string
) => {
  const channel = supabase
    .channel(`public:${table}:update`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: table,
        ...(filter && { filter }),
      },
      callback
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

// ============================================
// HELPERS RLS (ROW LEVEL SECURITY)
// ============================================

/**
 * Récupère le niveau d'accès utilisateur
 */
export const getUserAccessLevel = async (userId: string) => {
  try {
    const { data, error } = await (supabase
      .from('utilisateur')
      .select('role, organisation_id, status')
      .eq('id', userId)
      .single() as any);

    if (error) {
      console.error('[getUserAccessLevel Error]', error);
      return null;
    }

    const userData = data as any;
    return {
      role: userData?.role || 'utilisateur',
      organisationId: userData?.organisation_id,
      status: userData?.status || 'inactive',
      isAdmin: userData?.role === 'admin',
      isModerateur: userData?.role === 'moderateur',
      isOrganisationAdmin: userData?.role === 'organisation_admin',
    };
  } catch (error) {
    console.error('[getUserAccessLevel Exception]', error);
    return null;
  }
};

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export const checkUserPermission = async (
  userId: string,
  permission: 'read' | 'write' | 'delete' | 'moderate'
): Promise<boolean> => {
  try {
    const accessLevel = await getUserAccessLevel(userId);
    
    if (!accessLevel) return false;

    // Admin a toutes les permissions
    if (accessLevel.isAdmin) return true;

    // Vérifications par permission
    switch (permission) {
      case 'read':
        return ['admin', 'moderateur', 'organisation_admin', 'utilisateur'].includes(accessLevel.role);
      case 'write':
        return ['admin', 'organisation_admin', 'utilisateur'].includes(accessLevel.role);
      case 'delete':
        return ['admin', 'organisation_admin'].includes(accessLevel.role);
      case 'moderate':
        return ['admin', 'moderateur'].includes(accessLevel.role);
      default:
        return false;
    }
  } catch (error) {
    console.error('[checkUserPermission Exception]', error);
    return false;
  }
};

/**
 * Récupère le rôle de l'utilisateur
 */
export const getUserRole = async (userId: string) => {
  try {
    const { data, error } = await (supabase
      .from('utilisateur')
      .select('role')
      .eq('id', userId)
      .single() as any);

    if (error) {
      console.error('[getUserRole Error]', error);
      return 'utilisateur';
    }

    const userData = data as any;
    return userData?.role || 'utilisateur';
  } catch (error) {
    console.error('[getUserRole Exception]', error);
    return 'utilisateur';
  }
};

/**
 * Vérifie si un utilisateur peut accéder à une ressource spécifique
 */
export const canUserAccessResource = async (
  userId: string,
  resourceId: string,
  resourceType: 'personne' | 'alerte' | 'signalement' | 'organisation'
): Promise<boolean> => {
  try {
    const accessLevel = await getUserAccessLevel(userId);
    
    if (!accessLevel) return false;

    // Admin peut accéder à tout
    if (accessLevel.isAdmin) return true;

    // Vérifications par type de ressource
    switch (resourceType) {
      case 'organisation': {
        // L'utilisateur peut accéder s'il appartient à l'organisation
        const { data, error } = await (supabase
          .from('utilisateur')
          .select('organisation_id')
          .eq('id', userId)
          .single() as any);

        if (error) return false;
        const userData = data as any;
        return userData?.organisation_id === resourceId;
      }

      case 'personne': {
        // Vérifier si l'utilisateur a contribué à cette personne
        // ou si c'est public
        const { data, error } = await (supabase
          .from('personne')
          .select('created_by, is_public')
          .eq('id', resourceId)
          .single() as any);

        if (error) return false;
        
        const personneData = data as any;
        // Public ou créé par l'utilisateur
        return personneData?.is_public || personneData?.created_by === userId;
      }

      case 'alerte':
      case 'signalement': {
        // Vérifier la propriété ou l'appartenance à l'organisation
        const table = resourceType === 'alerte' ? 'alerte' : 'signalement';
        const { data, error } = await (supabase
          .from(table)
          .select('created_by, personne:personne_id(created_by)')
          .eq('id', resourceId)
          .single() as any);

        if (error) return false;
        
        const resourceData = data as any;
        // Créé par l'utilisateur ou créé par quelqu'un de son organisation
        return resourceData?.created_by === userId || 
               (accessLevel.organisationId && accessLevel.isOrganisationAdmin);
      }

      default:
        return false;
    }
  } catch (error) {
    console.error('[canUserAccessResource Exception]', error);
    return false;
  }
};

/**
 * Récupère tous les utilisateurs d'une organisation (avec restriction RLS)
 */
export const getOrganisationUsers = async (organisationId: string) => {
  try {
    const { data, error } = await (supabase
      .from('utilisateur')
      .select('id, email, nom, prenom, role, status, created_at')
      .eq('organisation_id', organisationId)
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[getOrganisationUsers Error]', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('[getOrganisationUsers Exception]', error);
    return { data: null, error };
  }
};

/**
 * Valide si l'utilisateur actuel peut effectuer une action
 */
export const validateUserAction = async (
  action: 'create_alerte' | 'modify_personne' | 'moderate_signalement' | 'manage_organisation'
): Promise<{ allowed: boolean; reason?: string }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { allowed: false, reason: 'Non authentifié' };
    }

    const accessLevel = await getUserAccessLevel(user.id);
    
    if (!accessLevel) {
      return { allowed: false, reason: 'Profil utilisateur introuvable' };
    }

    switch (action) {
      case 'create_alerte':
        return {
          allowed: ['admin', 'moderateur', 'organisation_admin', 'utilisateur'].includes(accessLevel.role),
          reason: 'Vous n\'avez pas la permission de créer des alertes',
        };

      case 'modify_personne':
        return {
          allowed: ['admin', 'organisation_admin'].includes(accessLevel.role),
          reason: 'Seuls les administrateurs peuvent modifier les fiches personnes',
        };

      case 'moderate_signalement':
        return {
          allowed: ['admin', 'moderateur'].includes(accessLevel.role),
          reason: 'Vous n\'avez pas la permission de modérer',
        };

      case 'manage_organisation':
        return {
          allowed: ['admin', 'organisation_admin'].includes(accessLevel.role),
          reason: 'Vous n\'avez pas la permission de gérer cette organisation',
        };

      default:
        return { allowed: false, reason: 'Action inconnue' };
    }
  } catch (error) {
    console.error('[validateUserAction Exception]', error);
    return { allowed: false, reason: 'Erreur lors de la validation' };
  }
};

// ============================================
// INITIALISATION
// ============================================

/**
 * Initialise le client Supabase et les événements
 */
export const initializeSupabase = (): void => {
  authEventManager.initialize();
  
  // Log de la version de Supabase
  console.log('[Supabase] Client initialisé', {
    url: SUPABASE_URL,
    version: '2.x',
  });
};

/**
 * Nettoie les ressources Supabase
 */
export const cleanupSupabase = (): void => {
  authEventManager.cleanup();
  console.log('[Supabase] Client nettoyé');
};

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default supabase;