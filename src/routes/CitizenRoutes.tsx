/**
 * =====================================================
 * RETROUVONSLES - Citizen Routes
 * Routes pour les citoyens (signalements, notifications)
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  CitizenDashboardPage,
  CitizenDossiersPage,
  CitizenMySignalementsPage,
  CitizenNewSignalementPage,
  CitizenSignalementDetailPage,
  CitizenNotificationsPage,
  CitizenProfilePage,
  CitizenAlertesPage,
  CitizenMapPage,
  CitizenDossierPublicDetailPage,
  CitizenSettingsPage,
  CitizenDonationsPage
} from '../pages/citizen';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { CITIZEN_ROUTES } from './routes.config';
import { NomRole } from '../@types/enums.types';

/**
 * CitizenRoutes Component
 * Routes protégées pour les citoyens
 * - Dashboard
 * - Map (carte interactive)
 * - Alerts (alertes de proximité)
 * - My Signalements
 * - New Signalement
 * - Notifications
 * - Profile
 * - Settings (paramètres)
 * - Dossier Detail (détail dossier public)
 * - Donations (Orange Money / MTN MoMo)
 */
const CitizenRoutes: React.FC = () => {
  const citizenRoles = [NomRole.CITOYEN];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossiers publics */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenDossiersPage />
            </RoleBasedRoute>
          }
        />

        {/* Map - Interactive Map */}
        <Route
          path="/map"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenMapPage />
            </RoleBasedRoute>
          }
        />

        {/* Alerts - Proximity Alerts */}
        <Route
          path="/alerts"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenAlertesPage />
            </RoleBasedRoute>
          }
        />

        {/* My Signalements */}
        <Route
          path="/my-signalements"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenMySignalementsPage />
            </RoleBasedRoute>
          }
        />

        {/* New Signalement */}
        <Route
          path="/new-signalement"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenNewSignalementPage />
            </RoleBasedRoute>
          }
        />

        {/* Signalement Detail */}
        <Route
          path="/signalement/:signalementId"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenSignalementDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="/notifications"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenNotificationsPage />
            </RoleBasedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Donations */}
        <Route
          path="/donations"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenDonationsPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossier Public Detail */}
        <Route
          path="/dossier/:dossierId"
          element={
            <RoleBasedRoute requiredRoles={citizenRoles}>
              <CitizenDossierPublicDetailPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default CitizenRoutes;
