/**
 * =====================================================
 * RETROUVONSLES - Routes Configuration
 * =====================================================
 * Application routing configuration with permissions and metadata
 */

import { NomRole } from '../@types/enums.types';

// ============================================
// ROUTE DEFINITIONS
// ============================================

export interface RouteConfig {
  path: string;
  label: string;
  description?: string;
  icon?: string;
  component?: string;
  requiredRoles?: NomRole[];
  requiredPermissions?: string[];
  isPublic?: boolean;
  isProtected?: boolean;
  layout?: 'main' | 'auth' | 'dashboard' | 'empty';
  children?: RouteConfig[];
  breadcrumb?: boolean;
  showInNav?: boolean;
  showInMobileNav?: boolean;
  order?: number;
}

// ============================================
// PUBLIC ROUTES
// ============================================

export const publicRoutes: RouteConfig[] = [
  {
    path: '/',
    label: 'Accueil',
    description: 'Page d\'accueil',
    icon: 'home',
    isPublic: true,
    layout: 'main',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/about',
    label: 'À Propos',
    description: 'À propos de RetrouvonsLes',
    icon: 'info',
    isPublic: true,
    layout: 'main',
    breadcrumb: true,
    showInNav: true,
    order: 1,
  },
  {
    path: '/search',
    label: 'Recherche',
    description: 'Rechercher une personne',
    icon: 'search',
    isPublic: true,
    layout: 'main',
    breadcrumb: true,
    showInNav: true,
    showInMobileNav: true,
    order: 2,
  },
  {
    path: '/contact',
    label: 'Contact',
    description: 'Nous contacter',
    icon: 'mail',
    isPublic: true,
    layout: 'main',
    breadcrumb: true,
    showInNav: true,
    order: 3,
  },
];

// ============================================
// AUTHENTICATION ROUTES
// ============================================

export const authRoutes: RouteConfig[] = [
  {
    path: '/auth/login',
    label: 'Connexion',
    description: 'Se connecter',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/auth/register',
    label: 'Inscription',
    description: 'Créer un compte',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/auth/forgot-password',
    label: 'Mot de passe oublié',
    description: 'Réinitialiser le mot de passe',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/auth/reset-password',
    label: 'Réinitialiser le mot de passe',
    description: 'Réinitialiser le mot de passe',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/auth/verify-email',
    label: 'Vérifier email',
    description: 'Vérifier l\'email',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/auth/callback',
    label: 'Callback OAuth',
    description: 'Traitement OAuth callback',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
  {
    path: '/auth/complete-profile',
    label: 'Compléter le profil',
    description: 'Compléter les informations du profil',
    isPublic: true,
    layout: 'auth',
    breadcrumb: false,
    showInNav: false,
  },
];

// ============================================
// PROTECTED/DASHBOARD ROUTES
// ============================================

export const dashboardRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    label: 'Tableau de bord',
    description: 'Tableau de bord principal',
    icon: 'dashboard',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: false,
    showInNav: true,
    showInMobileNav: true,
    order: 1,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.AGENT_GENDARMERIE,
      NomRole.RESPONSABLE_ONG,
      NomRole.OPERATEUR_SAISIE,
      NomRole.MODERATEUR,
      NomRole.CITOYEN_VERIFIE,
    ],
  },

  // ============ PERSONNES ============
  {
    path: '/personnes',
    label: 'Personnes',
    description: 'Gestion des personnes disparues',
    icon: 'people',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    showInMobileNav: true,
    order: 2,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.AGENT_GENDARMERIE,
      NomRole.OPERATEUR_SAISIE,
      NomRole.CITOYEN_VERIFIE,
    ],
    children: [
      {
        path: '/personnes/list',
        label: 'Liste',
        description: 'Liste des personnes',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/personnes/create',
        label: 'Créer',
        description: 'Créer une nouvelle personne',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/personnes/:id',
        label: 'Détails',
        description: 'Détails d\'une personne',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/personnes/:id/edit',
        label: 'Modifier',
        description: 'Modifier une personne',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },

  // ============ DOSSIERS ============
  {
    path: '/dossiers',
    label: 'Dossiers',
    description: 'Gestion des dossiers',
    icon: 'folder',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    showInMobileNav: true,
    order: 3,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.AGENT_GENDARMERIE,
      NomRole.RESPONSABLE_ONG,
      NomRole.OPERATEUR_SAISIE,
    ],
    children: [
      {
        path: '/dossiers/list',
        label: 'Liste',
        description: 'Liste des dossiers',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/dossiers/create',
        label: 'Créer',
        description: 'Créer un nouveau dossier',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/dossiers/:id',
        label: 'Détails',
        description: 'Détails d\'un dossier',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },

  // ============ ALERTES ============
  {
    path: '/alertes',
    label: 'Alertes',
    description: 'Gestion des alertes',
    icon: 'alert',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    showInMobileNav: true,
    order: 4,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.AGENT_GENDARMERIE,
      NomRole.RESPONSABLE_ONG,
      NomRole.OPERATEUR_SAISIE,
    ],
    children: [
      {
        path: '/alertes/list',
        label: 'Liste',
        description: 'Liste des alertes',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/alertes/create',
        label: 'Créer',
        description: 'Créer une nouvelle alerte',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },

  // ============ CARTES ============
  {
    path: '/map',
    label: 'Carte',
    description: 'Visualisation géographique',
    icon: 'map',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    showInMobileNav: true,
    order: 5,
  },

  // ============ STATISTIQUES ============
  {
    path: '/statistiques',
    label: 'Statistiques',
    description: 'Statistiques et analytiques',
    icon: 'chart',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 6,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.AGENT_GENDARMERIE,
      NomRole.MODERATEUR,
    ],
  },

  // ============ UTILISATEURS ============
  {
    path: '/utilisateurs',
    label: 'Utilisateurs',
    description: 'Gestion des utilisateurs',
    icon: 'users',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 7,
    requiredRoles: [NomRole.SUPER_ADMIN, NomRole.ADMIN_ORGANISATION, NomRole.MODERATEUR],
    children: [
      {
        path: '/utilisateurs/list',
        label: 'Liste',
        description: 'Liste des utilisateurs',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/utilisateurs/:id',
        label: 'Détails',
        description: 'Détails d\'un utilisateur',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },

  // ============ ORGANISATIONS ============
  {
    path: '/organisations',
    label: 'Organisations',
    description: 'Gestion des organisations',
    icon: 'building',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 8,
    requiredRoles: [NomRole.SUPER_ADMIN, NomRole.ADMIN_ORGANISATION],
    children: [
      {
        path: '/organisations/list',
        label: 'Liste',
        description: 'Liste des organisations',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/organisations/:id',
        label: 'Détails',
        description: 'Détails d\'une organisation',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },

  // ============ SIGNALEMENTS ============
  {
    path: '/signalements',
    label: 'Signalements',
    description: 'Gestion des signalements',
    icon: 'flag',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 9,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.MODERATEUR,
      NomRole.CITOYEN_VERIFIE,
    ],
    children: [
      {
        path: '/signalements/list',
        label: 'Liste',
        description: 'Liste des signalements',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/signalements/:id',
        label: 'Détails',
        description: 'Détails d\'un signalement',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },

  // ============ FILIATION ============
  {
    path: '/filiation',
    label: 'Filiation',
    description: 'Gestion des filiations',
    icon: 'link',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 10,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.OPERATEUR_SAISIE,
    ],
  },

  // ============ DONS ============
  {
    path: '/dons',
    label: 'Dons',
    description: 'Gestion des donations',
    icon: 'heart',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 11,
    requiredRoles: [NomRole.SUPER_ADMIN, NomRole.ADMIN_ORGANISATION],
  },

  // ============ IA/ANALYSE ============
  {
    path: '/ia-analysis',
    label: 'Analyse IA',
    description: 'Analyse par intelligence artificielle',
    icon: 'brain',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 12,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.OFFICIER_POLICE,
      NomRole.AGENT_GENDARMERIE,
    ],
  },

  // ============ CAMPAGNES ============
  {
    path: '/campagnes',
    label: 'Campagnes',
    description: 'Gestion des campagnes',
    icon: 'megaphone',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 13,
    requiredRoles: [
      NomRole.SUPER_ADMIN,
      NomRole.ADMIN_ORGANISATION,
      NomRole.RESPONSABLE_ONG,
    ],
  },

  // ============ NOTIFICATIONS ============
  {
    path: '/notifications',
    label: 'Notifications',
    description: 'Gestion des notifications',
    icon: 'bell',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: true,
    order: 14,
  },

  // ============ PROFIL ============
  {
    path: '/profile',
    label: 'Profil',
    description: 'Profil utilisateur',
    icon: 'user',
    isProtected: true,
    layout: 'dashboard',
    breadcrumb: true,
    showInNav: false,
    children: [
      {
        path: '/profile/me',
        label: 'Mon profil',
        description: 'Mon profil',
        isProtected: true,
        breadcrumb: true,
      },
      {
        path: '/profile/settings',
        label: 'Paramètres',
        description: 'Paramètres du compte',
        isProtected: true,
        breadcrumb: true,
      },
    ],
  },
];

// ============================================
// COMBINED ROUTES
// ============================================

export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...authRoutes,
  ...dashboardRoutes,
];

// ============================================
// ROUTE UTILITIES
// ============================================

/**
 * Check if a route is accessible by a user with given roles
 */
export const isRouteAccessible = (route: RouteConfig, userRoles: NomRole[]): boolean => {
  // Public routes are always accessible
  if (route.isPublic) {
    return true;
  }

  // If route requires specific roles
  if (route.requiredRoles && route.requiredRoles.length > 0) {
    return userRoles.some((role) => route.requiredRoles?.includes(role));
  }

  // Protected routes require authentication
  return !route.isPublic;
};

/**
 * Get all accessible routes for a user
 */
export const getAccessibleRoutes = (userRoles: NomRole[]): RouteConfig[] => {
  return allRoutes.filter((route) => isRouteAccessible(route, userRoles));
};

/**
 * Get navigation routes (visible in navigation menus)
 */
export const getNavigationRoutes = (
  userRoles: NomRole[],
  mobile: boolean = false
): RouteConfig[] => {
  return getAccessibleRoutes(userRoles)
    .filter((route) => (mobile ? route.showInMobileNav : route.showInNav))
    .sort((a, b) => (a.order || 999) - (b.order || 999));
};

/**
 * Find route by path
 */
export const findRouteByPath = (path: string): RouteConfig | undefined => {
  const findRoute = (routes: RouteConfig[], searchPath: string): RouteConfig | undefined => {
    for (const route of routes) {
      if (route.path === searchPath) {
        return route;
      }
      if (route.children) {
        const found = findRoute(route.children, searchPath);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  return findRoute(allRoutes, path);
};
