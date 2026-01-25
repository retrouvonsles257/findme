/**
 * =====================================================
 * RETROUVONSLES - Moderator Routes
 * Routes pour les modérateurs
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  ModerationDashboardPage,
  SignalementsValidationPage,
  PhotosModerationPage,
  ReportsPage
} from '../pages/moderator';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { MODERATOR_ROUTES } from './routes.config';
import { NomRole } from '../@types/enums.types';

/**
 * ModeratorRoutes Component
 * Routes protégées pour les modérateurs
 * - Dashboard
 * - Photos Moderation
 * - Signalements Validation
 * - Reports
 */
const ModeratorRoutes: React.FC = () => {
  const moderatorRoles = [NomRole.MODERATEUR];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <ModerationDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Photos Moderation */}
        <Route
          path="/photos-moderation"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <PhotosModerationPage />
            </RoleBasedRoute>
          }
        />

        {/* Signalements Validation */}
        <Route
          path="/signalements-validation"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <SignalementsValidationPage />
            </RoleBasedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <ReportsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default ModeratorRoutes;
