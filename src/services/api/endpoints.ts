/**
 * =====================================================
 * RETROUVONSLES - API Endpoints Configuration
 * Centralized API endpoint definitions for all modules
 * =====================================================
 */

export const API_ENDPOINTS = {
  // ============================================
  // AUTHENTICATION
  // ============================================
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    CURRENT_USER: '/auth/me',
    PASSWORD_RESET_REQUEST: '/auth/password-reset/request',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset/confirm',
    EMAIL_VERIFY: '/auth/email/verify',
    EMAIL_RESEND: '/auth/email/resend',
    TWO_FACTOR_ENABLE: '/auth/2fa/enable',
    TWO_FACTOR_VERIFY: '/auth/2fa/verify',
    TWO_FACTOR_DISABLE: '/auth/2fa/disable',
  } as const,

  // ============================================
  // USERS MANAGEMENT
  // ============================================
  USERS: {
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    CREATE: '/users',
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    SEARCH: '/users/search',
    FILTER: '/users/filter',
    PROFILE: '/users/profile',
    PROFILE_UPDATE: '/users/profile/update',
    ACTIVITY: (id: string) => `/users/${id}/activity`,
    STATISTICS: (id: string) => `/users/${id}/statistics`,
    PREFERENCES: (id: string) => `/users/${id}/preferences`,
    PERMISSIONS: (id: string) => `/users/${id}/permissions`,
    ROLES: '/users/roles',
    ROLES_GET: (id: string) => `/users/${id}/roles`,
    SUSPEND: (id: string) => `/users/${id}/suspend`,
    ACTIVATE: (id: string) => `/users/${id}/activate`,
  } as const,

  // ============================================
  // ORGANIZATIONS
  // ============================================
  ORGANISATIONS: {
    LIST: '/organisations',
    GET: (id: string) => `/organisations/${id}`,
    CREATE: '/organisations',
    UPDATE: (id: string) => `/organisations/${id}`,
    DELETE: (id: string) => `/organisations/${id}`,
    SEARCH: '/organisations/search',
    MEMBERS: (id: string) => `/organisations/${id}/members`,
    MEMBERS_ADD: (id: string) => `/organisations/${id}/members/add`,
    MEMBERS_REMOVE: (id: string) => `/organisations/${id}/members/remove`,
    SETTINGS: (id: string) => `/organisations/${id}/settings`,
    STATISTICS: (id: string) => `/organisations/${id}/statistics`,
    ROLES: (id: string) => `/organisations/${id}/roles`,
  } as const,

  // ============================================
  // DOSSIERS (Missing Persons Files)
  // ============================================
  DOSSIERS: {
    LIST: '/dossiers',
    GET: (id: string) => `/dossiers/${id}`,
    CREATE: '/dossiers',
    UPDATE: (id: string) => `/dossiers/${id}`,
    DELETE: (id: string) => `/dossiers/${id}`,
    SEARCH: '/dossiers/search',
    FILTER: '/dossiers/filter',
    ARCHIVE: (id: string) => `/dossiers/${id}/archive`,
    RESTORE: (id: string) => `/dossiers/${id}/restore`,
    CLOSE: (id: string) => `/dossiers/${id}/close`,
    DOCUMENTS: (id: string) => `/dossiers/${id}/documents`,
    DOCUMENTS_UPLOAD: (id: string) => `/dossiers/${id}/documents/upload`,
    DOCUMENTS_DELETE: (id: string, docId: string) => `/dossiers/${id}/documents/${docId}`,
    TIMELINE: (id: string) => `/dossiers/${id}/timeline`,
    HISTORY: (id: string) => `/dossiers/${id}/history`,
    EXPORT: (id: string) => `/dossiers/${id}/export`,
  } as const,

  // ============================================
  // SIGNALEMENTS (Reports from Citizens)
  // ============================================
  SIGNALEMENTS: {
    LIST: '/signalements',
    GET: (id: string) => `/signalements/${id}`,
    CREATE: '/signalements',
    UPDATE: (id: string) => `/signalements/${id}`,
    DELETE: (id: string) => `/signalements/${id}`,
    SEARCH: '/signalements/search',
    FILTER: '/signalements/filter',
    VALIDATE: (id: string) => `/signalements/${id}/validate`,
    REJECT: (id: string) => `/signalements/${id}/reject`,
    STATUS: (id: string) => `/signalements/${id}/status`,
    COMMENTS: (id: string) => `/signalements/${id}/comments`,
    COMMENTS_ADD: (id: string) => `/signalements/${id}/comments/add`,
    ATTACHMENTS: (id: string) => `/signalements/${id}/attachments`,
    ATTACHMENTS_UPLOAD: (id: string) => `/signalements/${id}/attachments/upload`,
  } as const,

  // ============================================
  // ALERTES (Alerts for Authorities)
  // ============================================
  ALERTES: {
    LIST: '/alertes',
    GET: (id: string) => `/alertes/${id}`,
    CREATE: '/alertes',
    UPDATE: (id: string) => `/alertes/${id}`,
    DELETE: (id: string) => `/alertes/${id}`,
    ACKNOWLEDGE: (id: string) => `/alertes/${id}/acknowledge`,
    DISMISS: (id: string) => `/alertes/${id}/dismiss`,
    ESCALATE: (id: string) => `/alertes/${id}/escalate`,
    LINKED_DOSSIERS: (id: string) => `/alertes/${id}/dossiers`,
  } as const,

  // ============================================
  // IA ANALYSIS
  // ============================================
  IA_ANALYSIS: {
    ANALYZE: '/ia/analyze',
    FACIAL_RECOGNITION: '/ia/facial-recognition',
    PATTERN_DETECTION: '/ia/pattern-detection',
    RISK_ASSESSMENT: '/ia/risk-assessment',
    PREDICT_LOCATION: '/ia/predict-location',
    RESULTS: (id: string) => `/ia/results/${id}`,
    HISTORY: '/ia/history',
  } as const,

  // ============================================
  // RAPPORTS (Reports)
  // ============================================
  RAPPORTS: {
    LIST: '/rapports',
    GET: (id: string) => `/rapports/${id}`,
    CREATE: '/rapports',
    UPDATE: (id: string) => `/rapports/${id}`,
    DELETE: (id: string) => `/rapports/${id}`,
    SEARCH: '/rapports/search',
    GENERATE: '/rapports/generate',
    EXPORT: (id: string) => `/rapports/${id}/export`,
    TEMPLATES: '/rapports/templates',
  } as const,

  // ============================================
  // STATISTIQUES (Statistics & Analytics)
  // ============================================
  STATISTIQUES: {
    DASHBOARD: '/statistiques/dashboard',
    USERS: '/statistiques/users',
    DOSSIERS: '/statistiques/dossiers',
    SIGNALEMENTS: '/statistiques/signalements',
    AUTHORITY: '/statistiques/authority',
    TRENDS: '/statistiques/trends',
    GEOGRAPHIC: '/statistiques/geographic',
    TEMPORAL: '/statistiques/temporal',
  } as const,

  // ============================================
  // MODERATION
  // ============================================
  MODERATION: {
    PHOTOS: '/moderation/photos',
    PHOTOS_GET: (id: string) => `/moderation/photos/${id}`,
    PHOTOS_APPROVE: (id: string) => `/moderation/photos/${id}/approve`,
    PHOTOS_REJECT: (id: string) => `/moderation/photos/${id}/reject`,
    CONTENT: '/moderation/content',
    CONTENT_REVIEW: (id: string) => `/moderation/content/${id}`,
    FLAGS: '/moderation/flags',
    REPORTS: '/moderation/reports',
  } as const,

  // ============================================
  // NOTIFICATIONS
  // ============================================
  NOTIFICATIONS: {
    LIST: '/notifications',
    GET: (id: string) => `/notifications/${id}`,
    MARK_READ: (id: string) => `/notifications/${id}/mark-read`,
    MARK_UNREAD: (id: string) => `/notifications/${id}/mark-unread`,
    DELETE: (id: string) => `/notifications/${id}`,
    PREFERENCES: '/notifications/preferences',
    PREFERENCES_UPDATE: '/notifications/preferences/update',
  } as const,

  // ============================================
  // AUDIT LOGS
  // ============================================
  AUDIT: {
    LIST: '/audit-logs',
    GET: (id: string) => `/audit-logs/${id}`,
    SEARCH: '/audit-logs/search',
    FILTER: '/audit-logs/filter',
    EXPORT: '/audit-logs/export',
  } as const,

  // ============================================
  // GEOLOCATION
  // ============================================
  GEOLOCATION: {
    SEARCH: '/geolocation/search',
    REVERSE_GEOCODE: '/geolocation/reverse-geocode',
    GET_COORDINATES: '/geolocation/coordinates',
    DISTANCE: '/geolocation/distance',
  } as const,

  // ============================================
  // DOCUMENTS & FILES
  // ============================================
  FILES: {
    UPLOAD: '/files/upload',
    DELETE: (id: string) => `/files/${id}`,
    GET: (id: string) => `/files/${id}`,
    DOWNLOAD: (id: string) => `/files/${id}/download`,
  } as const,

  // ============================================
  // NGO SPECIFIC
  // ============================================
  NGO: {
    CASES: '/ngo/cases',
    CASES_GET: (id: string) => `/ngo/cases/${id}`,
    CASES_CREATE: '/ngo/cases',
    CASES_UPDATE: (id: string) => `/ngo/cases/${id}`,
    CASES_DELETE: (id: string) => `/ngo/cases/${id}`,
    CAMPAIGNS: '/ngo/campaigns',
    CAMPAIGNS_GET: (id: string) => `/ngo/campaigns/${id}`,
    CAMPAIGNS_CREATE: '/ngo/campaigns',
    CAMPAIGNS_UPDATE: (id: string) => `/ngo/campaigns/${id}`,
    RESOURCES: '/ngo/resources',
    PARTNERSHIPS: '/ngo/partnerships',
    STATISTICS: '/ngo/statistics',
  } as const,
} as const;

/**
 * Get full API URL with base URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = process.env.REACT_APP_API_URL || '';
  return `${baseUrl}${endpoint}`;
};
