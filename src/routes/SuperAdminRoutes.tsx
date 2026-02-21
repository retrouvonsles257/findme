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
  SuperAdminOrganisationsPage,
  SuperAdminSystemLogsPage,
  SuperAdminSystemSettingsPage,
  SuperAdminSystemUsersPage,
  SuperAdminCampagnesPage,
  SuperAdminDonsPage,
  SuperAdminDonatePage,
  SuperAdminRolesPage,
  SuperAdminDossiersCritiquesPage,
  SuperAdminResultatsIAPage,
  SuperAdminSignalementValidationPage,
  SuperAdminProfilePage,
  SuperAdminDossiersPage,
  SuperAdminDossierDetailPage,
  SuperAdminAlertesPage,
} from '../pages/super_admin';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';

/**
 * SuperAdminRoutes Component
 * Routes protégées pour le super admin
 * - Dashboard, Global Statistics
 * - Organisations, System Users, Roles
 * - System Logs, System Settings
 * - Campagnes, Dons, Dossiers, Alertes, Résultats IA, Signalement validation
 * - Profile, Documents, Photos, Commentaires, Notifications, Liens filiation
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

        {/* Organisations */}
        <Route
          path="/organisations"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminOrganisationsPage />
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
        {/* Page dédiée Faire un don (accès depuis Dons uniquement) */}
        <Route
          path="/dons/faire-un-don"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminDonatePage />
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

        {/* Gestion complète des dossiers */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminDossiersPage />
            </RoleBasedRoute>
          }
        />

        {/* Détail dossier — accès complet */}
        <Route
          path="/dossiers/:id"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminDossierDetailPage />
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

        {/* Gestion complète des alertes */}
        <Route
          path="/alertes"
          element={
            <RoleBasedRoute requiredRoles={superAdminRoles}>
              <SuperAdminAlertesPage />
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
