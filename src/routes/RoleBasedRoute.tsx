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

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles: NomRole[];
  fallbackRoute?: string;
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
  fallbackRoute = ERROR_ROUTES.FORBIDDEN
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

  console.log('[RoleBasedRoute] Access granted. User role:', userRole);
  return <>{children}</>;
};

export default RoleBasedRoute;
