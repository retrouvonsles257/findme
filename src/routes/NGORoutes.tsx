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
  NGOResourcesPage,
  NGOPartnershipsPage,
  NGOIAAnalysisPage,
} from '../pages/ngo';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';

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

        {/* IA */}
        <Route
          path="/ia"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOIAAnalysisPage />
            </RoleBasedRoute>
          }
        />

        {/* Resources */}
        <Route
          path="/resources"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOResourcesPage />
            </RoleBasedRoute>
          }
        />

        {/* Partnerships */}
        <Route
          path="/partnerships"
          element={
            <RoleBasedRoute requiredRoles={ngoRoles}>
              <NGOPartnershipsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default NGORoutes;
