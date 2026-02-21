/**
 * =====================================================
 * RETROUVONSLES - Admin Organisation Routes
 * Routes pour les admin d'organisations
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  AdminOrganisationDashboardPage,
  AdminOrganisationUsersPage,
  AdminOrganisationUserDetailPage,
  AdminOrganisationUserNewPage,
  AdminOrganisationDossiersPage,
  AdminOrganisationDossierDetailPage,
  AdminOrganisationDossierEditPage,
  AdminOrganisationDossierNewPage,
  AdminOrganisationRapportsPage,
  AdminOrganisationRapportDetailPage,
  AdminOrganisationStatistiquesPage,
  AdminOrganisationSettingsPage,
  AdminOrganisationWorkflowsPage,
  AdminOrganisationRolesPage,
  AdminOrganisationAuditLogsPage,
  AdminOrganisationProfilePage,
  AdminOrganisationAlertesPage,
  AdminOrganisationAlerteDetailPage,
  AdminOrganisationCreateAlertePage,
  AdminOrganisationSignalementsPage,
  AdminOrganisationSignalementDetailPage,
  AdminOrganisationIAPage,
  AdminOrganisationCoordinationPage,
  AdminOrganisationCartePage,
  AdminOrganisationPhotosModerationPage,
  AdminOrganisationVerificationIdentitePage,
  AdminOrganisationPersonnesPage,
  AdminOrganisationPersonDetailPage,
  AdminOrganisationPhotosEnAttentePage,
  AdminOrganisationSignalementsEnAttentePage,
  AdminOrganisationCampagnesPage,
  AdminOrganisationCreateCampagnePage,
  AdminOrganisationCasesPage,
  AdminOrganisationCreateCasePage,
  AdminOrganisationRessourcesPage,
  AdminOrganisationPartenariatsPage,
  AdminOrganisationDonationsPage,
} from '../pages/admin';

import PrivateRoute from './PrivateRoutes';
import RoleBasedRoute from './RoleBasedRoute';
import { NomRole } from '../@types/enums.types';

/** Redirige /admin/ia-analysis vers /admin/ia en conservant la query string (ex. resultId). */
const RedirectAdminIA: React.FC = () => {
  const { search } = useLocation();
  return <Navigate to={`/admin/ia${search}`} replace />;
};

/**
 * AdminRoutes Component
 * Routes protégées pour les admin d'organisations
 * - Dashboard
 * - Users Management
 * - Dossiers
 * - Rapports
 * - Statistiques
 * - Settings
 * - Roles
 * - Audit Logs
 */
const AdminRoutes: React.FC = () => {
  const adminRoles = [NomRole.ADMIN_ORGANISATION];

  return (
    <PrivateRoute>
      <Routes>
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Users - /admin/utilisateurs */}
        <Route
          path="/utilisateurs"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUsersPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/utilisateurs/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUserNewPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/utilisateurs/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationUserDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossiers */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossiersPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossierNewPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossierDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/:id/edit"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDossierEditPage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage Autorité: Alertes, Signalements, IA, Coordination, Carte */}
        <Route
          path="/alertes"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationAlertesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/alertes/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCreateAlertePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/alertes/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationAlerteDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/signalements"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationSignalementsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/signalements/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationSignalementDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/ia"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationIAPage />
            </RoleBasedRoute>
          }
        />
        <Route path="/ia-analysis" element={<RedirectAdminIA />} />
        <Route
          path="/coordination"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCoordinationPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/carte"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCartePage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage Modérateur: Modération photos, Vérification identité */}
        <Route
          path="/photos-moderation"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationPhotosModerationPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/verification-identite"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationVerificationIdentitePage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage Opérateur: Personnes, Photos en attente, Signalements en attente */}
        <Route
          path="/personnes"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationPersonnesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/personnes/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationPersonDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/photos-en-attente"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationPhotosEnAttentePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/signalements-en-attente"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationSignalementsEnAttentePage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage NGO: Campagnes, Cas, Ressources, Partenariats */}
        <Route
          path="/campagnes"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCampagnesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/campagnes/create"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCreateCampagnePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cas"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCasesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cas/create"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationCreateCasePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/ressources"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRessourcesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/partenariats"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationPartenariatsPage />
            </RoleBasedRoute>
          }
        />

        {/* Rapports */}
        <Route
          path="/rapports"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRapportsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/rapports/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRapportDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Statistiques */}
        <Route
          path="/statistiques"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationStatistiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* Profile - /admin/profile */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Settings - /admin/parametres */}
        <Route
          path="/parametres"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Workflows - /admin/workflows (placeholder) */}
        <Route
          path="/workflows"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationWorkflowsPage />
            </RoleBasedRoute>
          }
        />

        {/* Roles */}
        <Route
          path="/roles"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationRolesPage />
            </RoleBasedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationAuditLogsPage />
            </RoleBasedRoute>
          }
        />

        {/* Dons (tous les acteurs peuvent faire un don) */}
        <Route
          path="/donations"
          element={
            <RoleBasedRoute requiredRoles={adminRoles}>
              <AdminOrganisationDonationsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default AdminRoutes;
