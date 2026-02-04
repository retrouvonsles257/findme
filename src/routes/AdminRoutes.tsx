/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Routes
 * Routes pour les admin d'organisations
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  AdminOrganisationDashboardPage,
  AdminOrganisationUsersPage,
  AdminOrganisationUserDetailPage,
  AdminOrganisationUserNewPage,
  AdminOrganisationDossiersPage,
  AdminOrganisationDossierDetailPage,
  AdminOrganisationDossierEditPage,
  AdminOrganisationDossierNewPage,
  AdminOrganisationRapportsPage,
  AdminOrganisationRapportDetailPage,
  AdminOrganisationStatistiquesPage,
  AdminOrganisationSettingsPage,
  AdminOrganisationWorkflowsPage,
  AdminOrganisationRolesPage,
  AdminOrganisationAuditLogsPage,
  AdminOrganisationProfilePage,
  AdminOrganisationApiKeysPage,
} from '../pages/admin';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
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
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Users - /admin/utilisateurs */}
        <Route
          path="/utilisateurs"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUsersPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/utilisateurs/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUserNewPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/utilisateurs/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUserDetailPage />
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
        <Route
          path="/dossiers/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossierNewPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossierDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/:id/edit"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossierEditPage />
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
        <Route
          path="/rapports/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRapportDetailPage />
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

        {/* Profile - /admin/profile */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* API Keys - /admin/api-keys */}
        <Route
          path="/api-keys"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationApiKeysPage />
            </RoleBasedRoute>
          }
        />

        {/* Settings - /admin/parametres */}
        <Route
          path="/parametres"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Workflows - /admin/workflows (placeholder) */}
        <Route
          path="/workflows"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationWorkflowsPage />
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
