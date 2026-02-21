/**
 * =====================================================
 * RETROUVONSLES - Super Admin Pages Exports
 * Index pour tous les composants Super Admin
 * =====================================================
 */

// Core pages
export { SuperAdminDashboardPage } from './Dashboardpage';
export { SuperAdminGlobalStatsPage } from './GlobalStatsPage';
export { SuperAdminOrganisationsPage } from './OrganisationsPage';
export { SuperAdminSystemUsersPage } from './SystemUsersPage';
export { SuperAdminSystemLogsPage } from './SystemLogsPage';

// Configuration pages
export { SuperAdminSystemSettingsPage } from './SystemSettingsPage';

// New pages - Campagnes, Dons, Roles, Dossiers critiques, Résultats IA
export { SuperAdminCampagnesPage } from './CampagnesPage';
export { SuperAdminDonsPage } from './DonsPage';
export { SuperAdminDonatePage } from './SuperAdminDonatePage';
export { SuperAdminRolesPage } from './RolesPage';
export { SuperAdminDossiersCritiquesPage } from './DossiersCritiquesPage';
export { SuperAdminResultatsIAPage } from './ResultatsIAPage';

// Validation et Profil pages
export { SuperAdminSignalementValidationPage } from './SignalementValidationPage';
export { SuperAdminProfilePage } from './ProfilePage';

// Gestion complète Dossiers et Alertes
export { default as SuperAdminDossiersPage } from './DossiersPage';
export { SuperAdminDossierDetailPage } from './DossierDetailPage';
export { default as SuperAdminAlertesPage } from './AlertesPage';

// Nouvelles pages - Notifications, Photos, Commentaires, Documents, Liens Filiation
export { SuperAdminNotificationsSystemPage } from './NotificationsSystemPage';
export { SuperAdminPhotosPage } from './PhotosPage';
export { SuperAdminCommentairesPage } from './CommentairesPage';
export { SuperAdminDocumentsPage } from './DocumentsPage';
export { SuperAdminLiensFiliationPage } from './LiensFiliationPage';
