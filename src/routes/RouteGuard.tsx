/**
 * =====================================================
 * RETROUVONSLES - Route Guard Component
 * Validation avancée des routes
 * =====================================================
 */

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../features/users/store/userSelectors';
import { selectIsAuthenticated, selectAuthLoading } from '../features/auth/store/authSelectors';
import { AUTH_ROUTES, ERROR_ROUTES } from './routes.config';

interface GuardCondition {
  type: 'role' | 'status' | 'permission' | 'custom';
  value: any;
}

interface RouteGuardProps {
  children: React.ReactNode;
  conditions?: GuardCondition[];
  customValidator?: (user: any) => boolean;
  fallbackRoute?: string;
}

/**
 * RouteGuard Component
 * Effectue des vérifications avancées avant d'afficher une route
 * Supporte:
 * - Vérification de rôle
 * - Vérification de statut de compte
 * - Permissions personnalisées
 * - Validateurs personnalisés
 */
const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  conditions = [],
  customValidator,
  fallbackRoute
}) => {
  const currentUser = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);
  const user = currentUser;
  const userRole = currentUser?.role;
  const userStatus = currentUser?.statut_compte || 'actif';
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setIsAuthorized(false);
      return;
    }

    // Vérifier tous les conditions
    let authorized = true;

    for (const condition of conditions) {
      switch (condition.type) {
        case 'role':
          if (Array.isArray(condition.value)) {
            if (!condition.value.includes(userRole)) {
              authorized = false;
            }
          } else if (userRole !== condition.value) {
            authorized = false;
          }
          break;

        case 'status':
          if (userStatus !== condition.value) {
            authorized = false;
          }
          break;

        case 'permission':
          // À implémenter selon votre système de permissions
          if (!hasPermission(user, condition.value)) {
            authorized = false;
          }
          break;

        case 'custom':
          if (!condition.value(user)) {
            authorized = false;
          }
          break;
      }

      if (!authorized) break;
    }

    // Validateur personnalisé
    if (authorized && customValidator) {
      authorized = customValidator(user);
    }

    setIsAuthorized(authorized);
  }, [user, userRole, userStatus, isAuthenticated, loading, conditions, customValidator]);

  // En cours de chargement
  if (loading || isAuthorized === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Vérification des droits d'accès...</div>
      </div>
    );
  }

  // Non authentifié
  if (!isAuthenticated) {
    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  // Non autorisé
  if (!isAuthorized) {
    return <Navigate to={fallbackRoute || ERROR_ROUTES.FORBIDDEN} replace />;
  }

  return <>{children}</>;
};

/**
 * Vérifier les permissions de l'utilisateur
 * À adapter selon votre système de permissions
 */
function hasPermission(user: any, permission: string): boolean {
  // Implémentation à faire selon votre logique
  return user?.permissions?.includes(permission) ?? false;
}

export default RouteGuard;
