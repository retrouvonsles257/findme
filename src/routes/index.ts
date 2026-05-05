/**
 * =====================================================
 * RETROUVONSLES - Routes Index
 * Export centralisé de tous les modules de routes
 * =====================================================
 */

// ============================================
// MAIN ROUTES
// ============================================
export { default as AppRoutes } from './AppRoutes';

// ============================================
// MODULE ROUTES
// ============================================
export { default as PublicRoutes } from './PublicRoutes';
export { default as AuthRoutes } from './AuthRoutes';
export { default as CitizenRoutes } from './CitizenRoutes';
export { default as AuthorityRoutes } from './AuthorityRoutes';
export { default as NGORoutes } from './NGORoutes';
export { default as AdminRoutes } from './AdminRoutes';
export { default as SuperAdminRoutes } from './SuperAdminRoutes';
export { default as ErrorRoutes } from './ErrorRoutes';

// ============================================
// ROUTE GUARDS
// ============================================
export { default as PrivateRoute } from './PrivateRoutes';
export { default as RoleBasedRoute } from './RoleBasedRoute';
export { default as RouteGuard } from './RouteGuard';
export { default as ProtectedRoute } from './ProtectedRoute';

// ============================================
// ROUTE CONFIGURATIONS
// ============================================
export {
  ROUTES,
  PUBLIC_ROUTES,
  AUTH_ROUTES,
  CITIZEN_ROUTES,
  AUTHORITY_ROUTES,
  OPERATOR_ROUTES,
  MODERATOR_ROUTES,
  NGO_ROUTES,
  ADMIN_ROUTES,
  SUPER_ADMIN_ROUTES,
  ERROR_ROUTES,
  getRoute,
  LEGACY_SILO_BASES,
  LEGACY_SILO_REDIRECT_TARGET,
} from './routes.config';

export {
  adminRouteConfigs,
  adminRoutes,
  adminConfig,
  type AdminRoute
} from './adminRoutes.config';

// ============================================
// TYPES EXPORTS
// ============================================
export type { };
