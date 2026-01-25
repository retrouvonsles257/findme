/**
 * =====================================================
 * RETROUVONSLES - Error Routes
 * Routes pour les pages d'erreur
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  NotFoundPage,
  UnauthorizedPage,
  ForbiddenPage,
  ServerErrorPage
} from '../pages/errors';

import { ERROR_ROUTES } from './routes.config';

/**
 * ErrorRoutes Component
 * Routes pour la gestion des erreurs
 * - 404 Not Found
 * - 401 Unauthorized
 * - 403 Forbidden
 * - 500 Server Error
 */
const ErrorRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Unauthorized */}
      <Route path={ERROR_ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* Forbidden */}
      <Route path={ERROR_ROUTES.FORBIDDEN} element={<ForbiddenPage />} />

      {/* Server Error */}
      <Route path={ERROR_ROUTES.SERVER_ERROR} element={<ServerErrorPage />} />

      {/* Not Found (Doit être en dernier) */}
      <Route path={ERROR_ROUTES.NOT_FOUND} element={<NotFoundPage />} />
    </Routes>
  );
};

export default ErrorRoutes;
