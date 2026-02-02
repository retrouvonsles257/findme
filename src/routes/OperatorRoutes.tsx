/**
 * =====================================================
 * RETROUVONSLES - Operator Routes
 * Routes pour les opérateurs (saisie de données)
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  OperatorDashboardPage,
  OperatorMyDossiersPage,
  CreateDossierPage,
  CreatePersonPage,
  OperatorPersonsPage,
  OperatorPersonDetailPage,
  OperatorDonationsPage,
  OperatorDossierDetailPage,
  OperatorEditDossierPage,
  SignalementsEnAttentePage,
  PhotosEnAttentePage
} from '../pages/operator';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
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

        {/* Create Person */}
        <Route
          path="/create-person"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <CreatePersonPage />
            </RoleBasedRoute>
          }
        />

        {/* Persons list */}
        <Route
          path="/personnes"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorPersonsPage />
            </RoleBasedRoute>
          }
        />

        {/* Person detail */}
        <Route
          path="/personnes/:id"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorPersonDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Donations */}
        <Route
          path="/donations"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <OperatorDonationsPage />
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

        {/* Data Entry - Redirection vers my-dossiers */}
        <Route
          path="/data-entry"
          element={<Navigate to="/operator/my-dossiers" replace />}
        />

        {/* Signalements En Attente */}
        <Route
          path="/signalements-en-attente"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <SignalementsEnAttentePage />
            </RoleBasedRoute>
          }
        />

        {/* Photos En Attente */}
        <Route
          path="/photos-en-attente"
          element={
            <RoleBasedRoute requiredRoles={operatorRoles}>
              <PhotosEnAttentePage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default OperatorRoutes;
