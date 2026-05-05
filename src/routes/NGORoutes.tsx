/**
 * =====================================================
 * RETROUVONSLES - NGO Routes
 * Non monté dans AppRoutes (étape D) : `/ngo/*` redirige vers `/authority/dashboard`.
 * Les pages `src/pages/ngo/*` restent utilisées depuis **`/admin/*`** avec `basePath` admin.
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  NGODashboardPage,
  NGOCasesPage,
  NGOCampagnesPage,
  NGOCreateCasePage,
  NGOCreateCampagnePage,
  NGOCaseDetailPage,
  NGOCaseEditPage,
  NGOAlertesPage,
  NGOCreateAlertePage,
  NGOAlerteDetailPage,
  NGOResourcesPage,
  NGOPartnershipsPage,
  NGOIAAnalysisPage,
  NGOStatistiquesPage,
  NGOProfilePage,
  NGODonationsPage,
} from '../pages/ngo';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';
import { useAppSelector } from '../store/types';
import { selectUser } from '../features/auth/store/authSelectors';
import { selectCurrentUser } from '../features/users/store/userSelectors';
import { ROUTES } from './routes.config';

/**
 * NGORoutes Component
 * Routes protégées pour les ONG
 * - Dashboard
 * - Cases
 * - Campagnes
 * - Resources
 * - Partnerships
 */
const NGORoutes: React.FC = () => {
  const ngoRoles = [NomRole.AUTORITE];
  const authUser = useAppSelector(selectUser) as { organisation_id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser) as { organisation_id?: string } | null;
  const organisationId = currentUser?.organisation_id ?? authUser?.organisation_id ?? null;

  const base = ROUTES.ngo.BASE;

  return (
    <PrivateRoute>
      <Routes>
        {/* Redirection /ngo vers dashboard */}
        <Route index element={<Navigate to={`${base}/dashboard`} replace />} />

        {/* Dashboard */}
        <Route
          path="dashboard"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGODashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Cases */}
        <Route
          path="cases"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCasesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="cases/create"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCreateCasePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="cases/:id"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCaseDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="cases/:id/edit"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCaseEditPage />
            </RoleBasedRoute>
          }
        />

        {/* Campagnes */}
        <Route
          path="campagnes"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCampagnesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="campagnes/create"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCreateCampagnePage />
            </RoleBasedRoute>
          }
        />

        {/* Alertes */}
        <Route
          path="alertes"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOAlertesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="alertes/new"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCreateAlertePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="alertes/:id"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOAlerteDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* IA */}
        <Route
          path="ia"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOIAAnalysisPage />
            </RoleBasedRoute>
          }
        />

        {/* Statistiques */}
        <Route
          path="statistics"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOStatistiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* Resources */}
        <Route
          path="resources"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOResourcesPage organisationId={organisationId} />
            </RoleBasedRoute>
          }
        />

        {/* Partnerships */}
        <Route
          path="partnerships"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOPartnershipsPage organisationId={organisationId} />
            </RoleBasedRoute>
          }
        />

        {/* Profile - Modifier le profil */}
        <Route
          path="profile"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Settings (même flux que Authority) */}
        <Route
          path="settings"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Security (même flux que Authority) */}
        <Route
          path="security"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Dons (tous les acteurs peuvent faire un don) */}
        <Route
          path="donations"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGODonationsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default NGORoutes;
