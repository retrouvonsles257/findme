/**
 * =====================================================
 * RETROUVONSLES - Routes Configuration
 * Centralisation de tous les chemins du projet
 * =====================================================
 */

// ============================================
// PUBLIC ROUTES
// ============================================
export const PUBLIC_ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  DISPARITIONS: '/disparitions',
  DOSSIER_DETAIL: '/disparitions/:id',
  MAP: '/map',
  ABOUT: '/about',
  CONTACT: '/contact',
  DONATE: '/donate',
  HOW_IT_WORKS: '/how-it-works',
  PREVENTING: '/preventing',
  /** Page téléchargement application mobile (placeholder) */
  APP: '/app',
  /** Parcours public : connexion anonyme ou classique vers une action citoyenne (ex. signalement). */
  CONTRIBUTE: '/contribuer',
} as const;

// ============================================
// AUTH ROUTES
// ============================================
export const AUTH_ROUTES = {
  BASE: '/auth',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  COMPLETE_PROFILE: '/auth/complete-profile',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email'
} as const;

// ============================================
// CITIZEN ROUTES
// ============================================
export const CITIZEN_ROUTES = {
  BASE: '/citizen',
  DASHBOARD: '/citizen/dashboard',
  MY_SIGNALEMENTS: '/citizen/my-signalements',
  NEW_SIGNALEMENT: '/citizen/new-signalement',
  NOTIFICATIONS: '/citizen/notifications',
  PROFILE: '/citizen/profile'
} as const;

// ============================================
// AUTHORITY ROUTES (Police, Gendarmerie)
// ============================================
export const AUTHORITY_ROUTES = {
  BASE: '/authority',
  DASHBOARD: '/authority/dashboard',
  DOSSIERS: '/authority/dossiers',
  DOSSIER_NEW: '/authority/dossiers/new',
  DOSSIER_DETAIL: '/authority/dossiers/:id',
  DOSSIER_EDIT: '/authority/dossiers/:id/edit',
  ALERTES: '/authority/alertes',
  SIGNALEMENTS: '/authority/signalements',
  FILE_SIGNALEMENTS: '/authority/file-signalements',
  IA_ANALYSIS: '/authority/ia-analysis',
  IA_RESULTATS: '/authority/ia-resultats',
  TABLEAU_MODERATION: '/authority/tableau-moderation',
  INVESTIGATION: '/authority/investigation',
  COORDINATION: '/authority/coordination',
  STATISTIQUES: '/authority/statistiques',
  EQUIPE: '/authority/equipe',
  EQUIPE_NEW: '/authority/equipe/nouveau',
  ORG_PARAMETRES: '/authority/organisation/parametres',
} as const;

// ============================================
// SUPER ADMIN ROUTES
// ============================================
export const SUPER_ADMIN_ROUTES = {
  BASE: '/super-admin',
  DASHBOARD: '/super-admin/dashboard',
  GLOBAL_STATS: '/super-admin/global-stats',
  ORGANISATIONS: '/super-admin/organisations',
  SYSTEM_LOGS: '/super-admin/system-logs',
  SYSTEM_SETTINGS: '/super-admin/system-settings',
  SYSTEM_USERS: '/super-admin/system-users',
  DOSSIERS: '/super-admin/dossiers',
  ALERTES: '/super-admin/alertes',
} as const;

// ============================================
// ERROR ROUTES
// ============================================
export const ERROR_ROUTES = {
  NOT_FOUND: '*',
  UNAUTHORIZED: '/unauthorized',
  FORBIDDEN: '/forbidden',
  SERVER_ERROR: '/server-error'
} as const;

// ============================================
// EXPORT ALL ROUTES
// ============================================
export const ROUTES = {
  public: PUBLIC_ROUTES,
  auth: AUTH_ROUTES,
  citizen: CITIZEN_ROUTES,
  authority: AUTHORITY_ROUTES,
  superAdmin: SUPER_ADMIN_ROUTES,
  errors: ERROR_ROUTES
} as const;

/** Anciens préfixes `/operator`, `/moderator`, `/ngo` : redirection unique vers le silo Autorité (étape D5). */
export const LEGACY_SILO_BASES = ['/operator', '/moderator', '/ngo'] as const;

export const LEGACY_SILO_REDIRECT_TARGET = `${AUTHORITY_ROUTES.BASE}/dashboard` as const;

/**
 * Helper function to get URL params with dynamic values
 * Usage: getRoute('authority', 'DOSSIER_DETAIL', { id: '123' })
 */
export const getRoute = (
  module: keyof typeof ROUTES,
  routeName: string,
  params?: Record<string, string | number>
): string => {
  const moduleRoutes = ROUTES[module] as Record<string, string>;
  let path = moduleRoutes[routeName];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      path = path.replace(`:${key}`, String(value));
    });
  }

  return path;
};
