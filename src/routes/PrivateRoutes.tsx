/**
 * =====================================================
 * RETROUVONSLES - Private Routes Component
 * Wrapper pour les routes protégées (authentification)
 * =====================================================
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated, selectAuthLoading } from '../features/auth/store/authSelectors';
import { AUTH_ROUTES } from './routes.config';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * PrivateRoute Component
 * Vérifie l'authentification avant d'afficher le contenu
 * Redirige vers login si non authentifié
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  // Attendre le chargement de l'auth state
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

  // Vérifier l'authentification
  if (!isAuthenticated) {

    return <Navigate to={AUTH_ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;
