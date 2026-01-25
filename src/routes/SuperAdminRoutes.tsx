/**
 * =====================================================
 * RETROUVONSLES - Super Admin Routes
 * Routes pour le super administrateur système
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  SuperAdminDashboardPage,
  SuperAdminGlobalStatsPage,
  SuperAdminIAConfigurationPage,
  SuperAdminOrganisationsPage,
  SuperAdminSecurityPage,
  SuperAdminSystemLogsPage,
  SuperAdminSystemSettingsPage,
  SuperAdminSystemUsersPage,
  SuperAdminCampagnesPage,
  SuperAdminDonsPage,
  SuperAdminRolesPage,
  SuperAdminDossiersCritiquesPage,
  SuperAdminResultatsIAPage,
  SuperAdminSignalementValidationPage,
  SuperAdminProfilePage
} from '../pages/super_admin';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { SUPER_ADMIN_ROUTES } from './routes.config';
import { NomRole } from '../@types/enums.types';

/**
 * SuperAdminRoutes Component
 * Routes protégées pour le super admin
 * - Dashboard
 * - Global Statistics
 * - IA Configuration
 * - Organisations Management
 * - Security
 * - System Logs
 * - System Settings
 * - System Users
 */
const SuperAdminRoutes: React.FC = () => {
  const superAdminRoles = [NomRole.SUPER_ADMIN];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Global Statistics */}
        <Route
          path="/global-stats"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminGlobalStatsPage />
            </RoleBasedRoute>
          }
        />

        {/* IA Configuration */}
        <Route
          path="/ia-configuration"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminIAConfigurationPage />
            </RoleBasedRoute>
          }
        />

        {/* Organisations */}
        <Route
          path="/organisations"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminOrganisationsPage />
            </RoleBasedRoute>
          }
        />

        {/* Security */}
        <Route
          path="/security"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminSecurityPage />
            </RoleBasedRoute>
          }
        />

        {/* System Logs */}
        <Route
          path="/system-logs"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminSystemLogsPage />
            </RoleBasedRoute>
          }
        />

        {/* System Settings */}
        <Route
          path="/system-settings"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminSystemSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* System Users */}
        <Route
          path="/system-users"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminSystemUsersPage />
            </RoleBasedRoute>
          }
        />

        {/* Campagnes de sensibilisation */}
        <Route
          path="/campagnes"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminCampagnesPage />
            </RoleBasedRoute>
          }
        />

        {/* Dons */}
        <Route
          path="/dons"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminDonsPage />
            </RoleBasedRoute>
          }
        />

        {/* Roles */}
        <Route
          path="/roles"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminRolesPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossiers critiques */}
        <Route
          path="/dossiers-critiques"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminDossiersCritiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* Résultats IA */}
        <Route
          path="/resultats-ia"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminResultatsIAPage />
            </RoleBasedRoute>
          }
        />

        {/* Validation des signalements */}
        <Route
          path="/signalement-validation"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminSignalementValidationPage />
            </RoleBasedRoute>
          }
        />

        {/* Profil */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminProfilePage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default SuperAdminRoutes;
