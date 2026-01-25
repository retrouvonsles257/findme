/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Routes
 * Routes pour les admin d'organisations
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  AdminOrganisationDashboardPage,
  AdminOrganisationUsersPage,
  AdminOrganisationDossiersPage,
  AdminOrganisationRapportsPage,
  AdminOrganisationStatistiquesPage,
  AdminOrganisationSettingsPage,
  AdminOrganisationRolesPage,
  AdminOrganisationAuditLogsPage
} from '../pages/admin';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { ADMIN_ROUTES } from './routes.config';
import { NomRole } from '../@types/enums.types';

/**
 * AdminRoutes Component
 * Routes protégées pour les admin d'organisations
 * - Dashboard
 * - Users Management
 * - Dossiers
 * - Rapports
 * - Statistiques
 * - Settings
 * - Roles
 * - Audit Logs
 */
const AdminRoutes: React.FC = () => {
  const adminRoles = [NomRole.ADMIN_ORGANISATION];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Users */}
        <Route
          path="/users"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUsersPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossiers */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossiersPage />
            </RoleBasedRoute>
          }
        />

        {/* Rapports */}
        <Route
          path="/rapports"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRapportsPage />
            </RoleBasedRoute>
          }
        />

        {/* Statistiques */}
        <Route
          path="/statistiques"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationStatistiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Roles */}
        <Route
          path="/roles"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRolesPage />
            </RoleBasedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationAuditLogsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default AdminRoutes;
