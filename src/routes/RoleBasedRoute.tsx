/**
 * =====================================================
 * RETROUVONSLES - Role-Based Route Component
 * Route protégée par rôle utilisateur
 * =====================================================
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectUser, selectUserRole, selectIsAuthenticated, selectAuthLoading } from '../features/auth/store/authSelectors';
import { NomRole } from '../@types/enums.types';
import { ERROR_ROUTES, AUTH_ROUTES } from './routes.config';

export type OrganisationScope = 'any' | 'with_organisation' | 'without_organisation';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles: NomRole[];
  fallbackRoute?: string;
  /**
   * Pour `admin_systeme` : portail admin org (ligne utilisateur liée à une org) vs super-admin (sans org).
   */
  organisationScope?: OrganisationScope;
}

/**
 * RoleBasedRoute Component
 * Vérifie que l'utilisateur a l'un des rôles requis
 * @param children - Contenu à afficher si autorisé
 * @param requiredRoles - Liste des rôles autorisés
 * @param fallbackRoute - Route de fallback (défaut: /forbidden)
 */
const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  requiredRoles,
  fallbackRoute = ERROR_ROUTES.FORBIDDEN,
  organisationScope = 'any',
}) => {
  const currentUser = useAppSelector(selectUser);
  const userRole = useAppSelector(selectUserRole);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  // Attendre le chargement
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Chargement...</div>
      </div>
    );
  }

  // Pas authentifié = rediriger vers login
  if (!isAuthenticated || !currentUser) {
    console.warn('[RoleBasedRoute] Not authenticated, redirecting to login');
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  // Vérifier le rôle
  if (!userRole || !requiredRoles.includes(userRole as NomRole)) {
    console.warn('[RoleBasedRoute] Access denied. User role:', userRole, 'Required:', requiredRoles);
    return <Navigate to={fallbackRoute} replace />;
  }

  const orgId = currentUser?.organisation_id ?? null;
  const hasOrg = Boolean(orgId);

  if (
    userRole === NomRole.ADMIN_SYSTEME &&
    organisationScope === 'with_organisation' &&
    !hasOrg
  ) {
    console.warn('[RoleBasedRoute] Admin org requis mais pas d\'organisation, redirection super-admin');
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  if (
    userRole === NomRole.ADMIN_SYSTEME &&
    organisationScope === 'without_organisation' &&
    hasOrg
  ) {
    console.warn('[RoleBasedRoute] Super-admin uniquement mais compte lié à une org, redirection admin org');
    return <Navigate to="/admin/dashboard" replace />;
  }

  console.log('[RoleBasedRoute] Access granted. User role:', userRole);
  return <>{children}</>;
};

export default RoleBasedRoute;
