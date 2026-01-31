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
  ReportsPage,
  IAResultsPage,
  IdentityVerificationPage,
  MapViewPage,
  NotificationsPage,
  ActivityHistoryPage,
} from '../pages/moderator';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
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

        {/* IA Results */}
        <Route
          path="/ia-results"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <IAResultsPage />
            </RoleBasedRoute>
          }
        />

        {/* Identity Verification */}
        <Route
          path="/identity-verification"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <IdentityVerificationPage />
            </RoleBasedRoute>
          }
        />

        {/* Map View */}
        <Route
          path="/map-view"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <MapViewPage />
            </RoleBasedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <NotificationsPage />
            </RoleBasedRoute>
          }
        />

        {/* Activity History */}
        <Route
          path="/activity-history"
          element={
            <RoleBasedRoute requiredRoles={moderatorRoles}>
              <ActivityHistoryPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default ModeratorRoutes;
