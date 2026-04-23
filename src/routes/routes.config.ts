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
  DOSSIER_DETAIL: '/authority/dossiers/:id',
  ALERTES: '/authority/alertes',
  SIGNALEMENTS: '/authority/signalements',
  INVESTIGATION: '/authority/investigation',
  IA_ANALYSIS: '/authority/ia-analysis',
  COORDINATION: '/authority/coordination',
  STATISTIQUES: '/authority/statistiques'
} as const;

// ============================================
// OPERATOR ROUTES (Data Entry)
// ============================================
export const OPERATOR_ROUTES = {
  BASE: '/operator',
  DASHBOARD: '/operator/dashboard',
  MY_DOSSIERS: '/operator/my-dossiers',
  CREATE_DOSSIER: '/operator/create-dossier',
  EDIT_DOSSIER: '/operator/edit-dossier/:id',
  DATA_ENTRY: '/operator/data-entry',
  DOSSIER_DETAIL: '/operator/dossiers/:id'
} as const;

// ============================================
// MODERATOR ROUTES
// ============================================
export const MODERATOR_ROUTES = {
  BASE: '/moderator',
  DASHBOARD: '/moderator/dashboard',
  PHOTOS_MODERATION: '/moderator/photos-moderation',
  SIGNALEMENT_VALIDATION: '/moderator/signalements-validation',
  REPORTS: '/moderator/reports'
} as const;

// ============================================
// NGO ROUTES
// ============================================
export const NGO_ROUTES = {
  BASE: '/ngo',
  DASHBOARD: '/ngo/dashboard',
  CASES: '/ngo/cases',
  CAMPAGNES: '/ngo/campagnes',
  RESOURCES: '/ngo/resources',
  PARTNERSHIPS: '/ngo/partnerships'
} as const;

// ============================================
// ADMIN ORGANISATION ROUTES
// ============================================
export const ADMIN_ROUTES = {
  BASE: '/admin',
  DASHBOARD: '/admin/dashboard',
  USERS: '/admin/utilisateurs',
  DOSSIERS: '/admin/dossiers',
  RAPPORTS: '/admin/rapports',
  STATISTIQUES: '/admin/statistiques',
  SETTINGS: '/admin/parametres',
  ROLES: '/admin/roles',
  AUDIT_LOGS: '/admin/audit-logs'
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
  operator: OPERATOR_ROUTES,
  moderator: MODERATOR_ROUTES,
  ngo: NGO_ROUTES,
  admin: ADMIN_ROUTES,
  superAdmin: SUPER_ADMIN_ROUTES,
  errors: ERROR_ROUTES
} as const;

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
