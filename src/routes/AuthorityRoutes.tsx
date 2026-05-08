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
  PhotosModerationPage,
  ModerationReportsPage,
  ModerationActivityHistoryPage,
  ModerationIdentityVerificationPage,
  SignalementsFileAvancePage,
  InvestigationPage,
  IAAnalysisPage,
  IAResultsCatalogAuthorityPage,
  ModerationOverviewAuthorityPage,
  OrganisationEquipeListAuthorityPage,
  OrganisationEquipeNewAuthorityPage,
  OrganisationEquipeDetailAuthorityPage,
  OrganisationParametresAuthorityPage,
  CoordinationPage,
  MapViewPage,
  DonationsPage,
  AuthorityDonatePage,
  StatistiquesPage,
  ProfilePage,
  NotificationsPage,
  PersonsPage,
  PersonDetailPage,
  CreatePersonPage,
} from '../pages/authority';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';
import { CoordinationReadProvider } from '../features/coordination/context/CoordinationReadContext';

/**
 * AuthorityRoutes Component
 * Routes protégées pour les autorités (incluant comptes rattachés à une organisation).
 * CoordinationReadProvider ici pour qu'il ne se démonte pas à chaque changement de page (badge messages de coordination persistant).
 */
const AuthorityRoutes: React.FC = () => {
  const authorityRoles = [NomRole.AUTORITE];

  return (
    <PrivateRoute>
      <CoordinationReadProvider>
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

        {/* Personnes (silo Autorité — étape D2) */}
        <Route
          path="/personnes"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <PersonsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/personnes/:id"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <PersonDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/create-person"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <CreatePersonPage />
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

        <Route
          path="/file-signalements"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <SignalementsFileAvancePage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/rapports-signalements"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ModerationReportsPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/historique-activite"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ModerationActivityHistoryPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/verifications-identite"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ModerationIdentityVerificationPage />
            </RoleBasedRoute>
          }
        />

        {/* ==================== PHOTOS MODERATION ==================== */}
        <Route
          path="/photos-moderation"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <PhotosModerationPage />
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

        <Route
          path="/ia-resultats"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <IAResultsCatalogAuthorityPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/tableau-moderation"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <ModerationOverviewAuthorityPage />
            </RoleBasedRoute>
          }
        />

        <Route
          path="/equipe/nouveau"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <OrganisationEquipeNewAuthorityPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/equipe/:id"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <OrganisationEquipeDetailAuthorityPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/equipe"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <OrganisationEquipeListAuthorityPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/organisation/parametres"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <OrganisationParametresAuthorityPage />
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

        {/* Page dédiée Faire un don (accès depuis Dons et campagnes uniquement, pas dans la sidebar) */}
        <Route
          path="/donations/faire-un-don"
          element={
            <RoleBasedRoute requiredRoles={authorityRoles}>
              <AuthorityDonatePage />
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
      </CoordinationReadProvider>
    </PrivateRoute>
  );
};

export default AuthorityRoutes;
