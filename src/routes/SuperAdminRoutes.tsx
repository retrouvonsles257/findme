/**
 * =====================================================
 * RETROUVONSLES - Super Admin Routes
 * Routes pour le super administrateur système
 * =====================================================
 */

import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import {
  SuperAdminDashboardPage,
  SuperAdminOrganisationsPage,
  SuperAdminSystemLogsPage,
  SuperAdminSystemSettingsPage,
  SuperAdminSystemUsersPage,
  SuperAdminObservabilityPage,
  SuperAdminBackupRetentionPage,
  SuperAdminSecurityAccessPage,
  SuperAdminSystemNotificationsMonitoringPage,
  SuperAdminRolesPage,
  SuperAdminProfilePage,
} from '../pages/super_admin';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';

/**
 * SuperAdminRoutes Component
 * Routes protégées pour le super admin
 * - Dashboard système
 * - Organisations, System Users, Roles
 * - System Logs, System Settings, Profile
 */
const SuperAdminRoutes: React.FC = () => {
  const superAdminRoles = [NomRole.ADMIN_SYSTEME];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Organisations */}
        <Route
          path="/organisations"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminOrganisationsPage />
            </RoleBasedRoute>
          }
        />

        {/* Security & Access */}
        <Route
          path="/security-access"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminSecurityAccessPage />
            </RoleBasedRoute>
          }
        />

        {/* System Logs */}
        <Route
          path="/system-logs"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminSystemLogsPage />
            </RoleBasedRoute>
          }
        />

        {/* System Settings */}
        <Route
          path="/system-settings"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminSystemSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Technical Observability */}
        <Route
          path="/observability"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminObservabilityPage />
            </RoleBasedRoute>
          }
        />

        {/* Backups & Retention */}
        <Route
          path="/backup-retention"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminBackupRetentionPage />
            </RoleBasedRoute>
          }
        />

        {/* System Notifications Monitoring */}
        <Route
          path="/system-notifications"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminSystemNotificationsMonitoringPage />
            </RoleBasedRoute>
          }
        />

        {/* System Users */}
        <Route
          path="/system-users"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminSystemUsersPage />
            </RoleBasedRoute>
          }
        />

        {/* Roles */}
        <Route
          path="/roles"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminRolesPage />
            </RoleBasedRoute>
          }
        />

        {/* Profil */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles} organisationScope="without_organisation">
              <SuperAdminProfilePage />
            </RoleBasedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/super-admin/dashboard" replace />} />

      </Routes>
    </PrivateRoute>
  );
};

export default SuperAdminRoutes;
