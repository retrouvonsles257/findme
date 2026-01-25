/**
 * =====================================================
 * RETROUVONSLES - Operator Routes
 * Routes pour les opérateurs (saisie de données)
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  OperatorDashboardPage,
  OperatorMyDossiersPage,
  CreateDossierPage,
  DataEntryPage,
  OperatorDossierDetailPage,
  OperatorEditDossierPage
} from '../pages/operator';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { OPERATOR_ROUTES } from './routes.config';
import { NomRole } from '../@types/enums.types';

/**
 * OperatorRoutes Component
 * Routes protégées pour les opérateurs de saisie
 * - Dashboard
 * - My Dossiers
 * - Create Dossier
 * - Edit Dossier
 * - Data Entry
 */
const OperatorRoutes: React.FC = () => {
  const operatorRoles = [NomRole.OPERATEUR_SAISIE];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* My Dossiers */}
        <Route
          path="/my-dossiers"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorMyDossiersPage />
            </RoleBasedRoute>
          }
        />

        {/* Create Dossier */}
        <Route
          path="/create-dossier"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <CreateDossierPage />
            </RoleBasedRoute>
          }
        />

        {/* Edit Dossier */}
        <Route
          path="/edit-dossier/:id"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorEditDossierPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossier Detail */}
        <Route
          path="/dossiers/:id"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorDossierDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Data Entry */}
        <Route
          path="/data-entry"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <DataEntryPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default OperatorRoutes;
