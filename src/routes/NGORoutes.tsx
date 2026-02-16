/**
 * =====================================================
 * RETROUVONSLES - NGO Routes
 * Routes pour les ONG humanitaires
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
} from '../pages/ngo';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';
import { useAppSelector } from '../store/types';
import { selectUser } from '../features/auth/store/authSelectors';
import { selectCurrentUser } from '../features/users/store/userSelectors';

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
  const ngoRoles = [NomRole.RESPONSABLE_ONG];
  const authUser = useAppSelector(selectUser) as { organisation_id?: string } | null;
  const currentUser = useAppSelector(selectCurrentUser) as { organisation_id?: string } | null;
  const organisationId = currentUser?.organisation_id ?? authUser?.organisation_id ?? null;

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGODashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Cases */}
        <Route
          path="/cases"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCasesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cases/create"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCreateCasePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cases/:id"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCaseDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cases/:id/edit"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCaseEditPage />
            </RoleBasedRoute>
          }
        />

        {/* Campagnes */}
        <Route
          path="/campagnes"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCampagnesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/campagnes/create"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCreateCampagnePage />
            </RoleBasedRoute>
          }
        />

        {/* Alertes */}
        <Route
          path="/alertes"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOAlertesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/alertes/new"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOCreateAlertePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/alertes/:id"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOAlerteDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* IA */}
        <Route
          path="/ia"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOIAAnalysisPage />
            </RoleBasedRoute>
          }
        />

        {/* Statistiques */}
        <Route
          path="/statistics"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOStatistiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* Resources */}
        <Route
          path="/resources"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOResourcesPage organisationId={organisationId} />
            </RoleBasedRoute>
          }
        />

        {/* Partnerships */}
        <Route
          path="/partnerships"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOPartnershipsPage organisationId={organisationId} />
            </RoleBasedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Settings (même flux que Authority) */}
        <Route
          path="/settings"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Security (même flux que Authority) */}
        <Route
          path="/security"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOProfilePage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default NGORoutes;
