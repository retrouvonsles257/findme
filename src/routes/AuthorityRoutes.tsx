/**
 * =====================================================
 * RETROUVONSLES - Authority Routes
 * Routes pour les autorités (Police, Gendarmerie)
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  DashboardPage as AuthorityDashboardPage,
  AlertesPage,
  DossiersPage,
  DossierDetailPage,
  SignalementsPage,
  InvestigationPage,
  IAAnalysisPage,
  CoordinationPage,
  StatistiquesPage
} from '../pages/authority';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { AUTHORITY_ROUTES } from './routes.config';
import { NomRole } from '../@types/enums.types';

/**
 * AuthorityRoutes Component
 * Routes protégées pour les autorités
 * - Dashboard
 * - Dossiers Management
 * - Alertes
 * - Signalements
 * - Investigation
 * - IA Analysis
 * - Coordination
 * - Statistiques
 */
const AuthorityRoutes: React.FC = () => {
  const authorityRoles = [
    NomRole.OFFICIER_POLICE,
    NomRole.AGENT_GENDARMERIE
  ];

  return (
    <PrivateRoute>
      <Routes>
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <AuthorityDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossiers List */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <DossiersPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossier Detail */}
        <Route
          path="/dossiers/:id"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <DossierDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Alertes */}
        <Route
          path="/alertes"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <AlertesPage />
            </RoleBasedRoute>
          }
        />

        {/* Signalements */}
        <Route
          path="/signalements"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <SignalementsPage />
            </RoleBasedRoute>
          }
        />

        {/* Investigation */}
        <Route
          path="/investigation"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <InvestigationPage />
            </RoleBasedRoute>
          }
        />

        {/* IA Analysis */}
        <Route
          path="/ia-analysis"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <IAAnalysisPage />
            </RoleBasedRoute>
          }
        />

        {/* Coordination */}
        <Route
          path="/coordination"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <CoordinationPage />
            </RoleBasedRoute>
          }
        />

        {/* Statistiques */}
        <Route
          path="/statistiques"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <StatistiquesPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default AuthorityRoutes;
