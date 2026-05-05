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
  const adminRoles = [NomRole.ADMIN_SYSTEME];

  return (
    <PrivateRoute>
      <Routes>
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationDashboardPage />
            </RoleBasedRoute>
          }
        />

        {/* Users - /admin/utilisateurs */}
        <Route
          path="/utilisateurs"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationUsersPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/utilisateurs/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationUserNewPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/utilisateurs/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationUserDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Dossiers */}
        <Route
          path="/dossiers"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationDossiersPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationDossierNewPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationDossierDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/dossiers/:id/edit"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationDossierEditPage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage Autorité: Alertes, Signalements, IA, Coordination, Carte */}
        <Route
          path="/alertes"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationAlertesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/alertes/new"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCreateAlertePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/alertes/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationAlerteDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/signalements"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationSignalementsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/signalements/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationSignalementDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/ia"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationIAPage />
            </RoleBasedRoute>
          }
        />
        <Route path="/ia-analysis" element={<RedirectAdminIA />} />
        <Route
          path="/coordination"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCoordinationPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/carte"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCartePage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage Modérateur: Modération photos, Vérification identité */}
        <Route
          path="/photos-moderation"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationPhotosModerationPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/verification-identite"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationVerificationIdentitePage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage Opérateur: Personnes, Photos en attente, Signalements en attente */}
        <Route
          path="/personnes"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationPersonnesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/personnes/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationPersonDetailPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/photos-en-attente"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationPhotosEnAttentePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/signalements-en-attente"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationSignalementsEnAttentePage />
            </RoleBasedRoute>
          }
        />

        {/* Héritage NGO: Campagnes, Cas, Ressources, Partenariats */}
        <Route
          path="/campagnes"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCampagnesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/campagnes/create"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCreateCampagnePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cas"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCasesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/cas/create"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationCreateCasePage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/ressources"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationRessourcesPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/partenariats"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationPartenariatsPage />
            </RoleBasedRoute>
          }
        />

        {/* Rapports */}
        <Route
          path="/rapports"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationRapportsPage />
            </RoleBasedRoute>
          }
        />
        <Route
          path="/rapports/:id"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationRapportDetailPage />
            </RoleBasedRoute>
          }
        />

        {/* Statistiques */}
        <Route
          path="/statistiques"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationStatistiquesPage />
            </RoleBasedRoute>
          }
        />

        {/* Profile - /admin/profile */}
        <Route
          path="/profile"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationProfilePage />
            </RoleBasedRoute>
          }
        />

        {/* Settings - /admin/parametres */}
        <Route
          path="/parametres"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationSettingsPage />
            </RoleBasedRoute>
          }
        />

        {/* Workflows - /admin/workflows (placeholder) */}
        <Route
          path="/workflows"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationWorkflowsPage />
            </RoleBasedRoute>
          }
        />

        {/* Roles */}
        <Route
          path="/roles"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationRolesPage />
            </RoleBasedRoute>
          }
        />

        {/* Audit Logs */}
        <Route
          path="/audit-logs"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationAuditLogsPage />
            </RoleBasedRoute>
          }
        />

        {/* Dons (tous les acteurs peuvent faire un don) */}
        <Route
          path="/donations"
          element={
            <RoleBasedRoute requiredRoles={adminRoles} organisationScope="with_organisation">
              <AdminOrganisationDonationsPage />
            </RoleBasedRoute>
          }
        />
      </Routes>
    </PrivateRoute>
  );
};

export default AdminRoutes;
