/**
 * =====================================================
 * RETROUVONSLES - Protected Route Component
 * Wrapper pour les routes protégées (single role)
 * =====================================================
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../features/users/store/userSelectors';
import { selectIsAuthenticated, selectAuthLoading } from '../features/auth/store/authSelectors';
import { NomRole } from '../@types/enums.types';
import { AUTH_ROUTES, ERROR_ROUTES } from './routes.config';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: NomRole;
}

/**
 * ProtectedRoute Component
 * Vérifie l'authentification et le rôle (unique) avant d'afficher le contenu
 * Pour les routes qui nécessitent un rôle exact
 *
 * @deprecated Utiliser RoleBasedRoute à la place pour une flexibilité maximale
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const userRole = currentUser?.role as NomRole | undefined;

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

  // Vérifie l'authentification
  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  // Vérifie le rôle si spécifié
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={ERROR_ROUTES.FORBIDDEN} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
