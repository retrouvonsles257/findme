/**
 * =====================================================
 * RETROUVONSLES - Authority Routes
 * Routes pour les autorités (Police, Gendarmerie)
 * Toutes les fonctionnalités connectées à Supabase
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  DashboardPage as AuthorityDashboardPage,
  AlertesPage,
  AlerteDetailPage,
  CreateAlertePage,
  DossiersPage,
  DossierDetailPage,
  CreateDossierAuthorityPage,
  EditDossierPage,
  SignalementsPage,
  SignalementDetailPage,
  InvestigationPage,
  IAAnalysisPage,
  CoordinationPage,
  MapViewPage,
  DonationsPage,
  StatistiquesPage,
  ProfilePage,
  NotificationsPage,
} from '../pages/authority';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';

/**
 * AuthorityRoutes Component
 * Routes protégées pour les autorités
 */
const AuthorityRoutes: React.FC = () => {
  const authorityRoles = [
    NomRole.OFFICIER_POLICE,
    NomRole.AGENT_GENDARMERIE,
    NomRole.OPERATEUR_SAISIE,
    NomRole.ADMIN_ORGANISATION,
  ];

  return (
    <PrivateRoute>
      <Routes>
        {/* Default redirect */}
        <Route
          path="/"
          element={<Navigate to="/authority/dashboard" replace />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <AuthorityDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== DOSSIERS ==================== */}
        
        {/* Dossiers List */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <DossiersPage />
            </RoleBasedRoute>
          }
        />

        {/* Create Dossier */}
        <Route
          path="/dossiers/new"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <CreateDossierAuthorityPage />
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

        {/* Edit Dossier */}
        <Route
          path="/dossiers/:id/edit"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <EditDossierPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== ALERTES ==================== */}
        
        {/* Alertes List */}
        <Route
          path="/alertes"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <AlertesPage />
            </RoleBasedRoute>
          }
        />

        {/* Create Alerte */}
        <Route
          path="/alertes/new"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <CreateAlertePage />
            </RoleBasedRoute>
          }
        />

        {/* Alerte Detail */}
        <Route
          path="/alertes/:id"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <AlerteDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== SIGNALEMENTS ==================== */}
        
        {/* Signalements List */}
        <Route
          path="/signalements"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <SignalementsPage />
            </RoleBasedRoute>
          }
        />

        {/* Signalement Detail */}
        <Route
          path="/signalements/:id"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <SignalementDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== INVESTIGATION ==================== */}
        
        <Route
          path="/investigation"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <InvestigationPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== IA ANALYSIS ==================== */}
        
        <Route
          path="/ia-analysis"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <IAAnalysisPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== COORDINATION ==================== */}
        
        <Route
          path="/coordination"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <CoordinationPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== MAP VIEW ==================== */}
        
        <Route
          path="/map-view"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <MapViewPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== DONATIONS & CAMPAGNES ==================== */}
        
        <Route
          path="/donations"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <DonationsPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== STATISTIQUES ==================== */}
        
        <Route
          path="/statistiques"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <StatistiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== PROFILE ==================== */}
        
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== SETTINGS ==================== */}
        
        <Route
          path="/settings"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== SECURITY ==================== */}
        
        <Route
          path="/security"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== NOTIFICATIONS ==================== */}
        
        <Route
          path="/notifications"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <NotificationsPage />
            </RoleBasedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route
          path="*"
          element={<Navigate to="/authority/dashboard" replace />}
        />
      </Routes>
    </PrivateRoute>
  );
};

export default AuthorityRoutes;
