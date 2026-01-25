/**
 * =====================================================
 * RETROUVONSLES - Admin Routes Configuration
 * Routes pour le rôle admin_organisation
 * =====================================================
 */

import React, { lazy, Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { RouteObject } from 'react-router-dom';

// Pages chargées en lazy loading
const AdminDashboard = lazy(() =>
  import('@/pages/admin/DashboardPage').then(m => ({
    default: m.AdminOrganisationDashboardPage,
  }))
);

const AdminUsers = lazy(() =>
  import('@/pages/admin/UsersManagementPage').then(m => ({
    default: m.AdminOrganisationUsersPage,
  }))
);

const AdminDossiers = lazy(() =>
  import('@/pages/admin/DossiersPage').then(m => ({
    default: m.AdminOrganisationDossiersPage,
  }))
);

const AdminRapports = lazy(() =>
  import('@/pages/admin/RapportsPage').then(m => ({
    default: m.AdminOrganisationRapportsPage,
  }))
);

const AdminStatistiques = lazy(() =>
  import('@/pages/admin/StatistiquesPage').then(m => ({
    default: m.AdminOrganisationStatistiquesPage,
  }))
);

const AdminSettings = lazy(() =>
  import('@/pages/admin/OrganisationSettings').then(m => ({
    default: m.AdminOrganisationSettingsPage,
  }))
);

const AdminRoles = lazy(() =>
  import('@/pages/admin/RolesManagementPage').then(m => ({
    default: m.AdminOrganisationRolesPage,
  }))
);

const AdminAuditLogs = lazy(() =>
  import('@/pages/admin/AuditLogsPage').then(m => ({
    default: m.AdminOrganisationAuditLogsPage,
  }))
);

// Loading component
const LoadingFallback = () => React.createElement('div', null, 'Chargement...');

export interface AdminRoute {
  path: string;
  label: string;
  icon?: string;
  description?: string;
}

/**
 * Routes pour l'interface admin_organisation
 */
export const adminRouteConfigs: AdminRoute[] = [
  {
    path: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    description: 'Dashboard with key metrics and recent activities',
  },
  {
    path: 'dossiers',
    label: 'Missing Person Files',
    icon: '📁',
    description: 'Manage missing person files and cases',
  },
  {
    path: 'rapports',
    label: 'Reports',
    icon: '📋',
    description: 'Review and manage citizen reports',
  },
  {
    path: 'utilisateurs',
    label: 'Users',
    icon: '👥',
    description: 'Manage team members and their access',
  },
  {
    path: 'statistiques',
    label: 'Statistics',
    icon: '📈',
    description: 'View detailed statistics and analytics',
  },
  {
    path: 'roles',
    label: 'Roles & Permissions',
    icon: '🔐',
    description: 'Define roles and manage permissions',
  },
  {
    path: 'audit-logs',
    label: 'Audit Logs',
    icon: '📋',
    description: 'View activity logs and audit trail',
  },
  {
    path: 'parametres',
    label: 'Settings',
    icon: '⚙️',
    description: 'Configure organization settings',
  },
];

/**
 * React Router routes pour le module admin
 */
export const adminRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminDashboard />
      </Suspense>
    ),
  },
  {
    path: 'dossiers',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminDossiers />
      </Suspense>
    ),
  },
  {
    path: 'rapports',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminRapports />
      </Suspense>
    ),
  },
  {
    path: 'utilisateurs',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminUsers />
      </Suspense>
    ),
  },
  {
    path: 'statistiques',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminStatistiques />
      </Suspense>
    ),
  },
  {
    path: 'roles',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminRoles />
      </Suspense>
    ),
  },
  {
    path: 'audit-logs',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminAuditLogs />
      </Suspense>
    ),
  },
  {
    path: 'parametres',
    element: (
      <Suspense fallback={<LoadingFallback />}>
        <AdminSettings />
      </Suspense>
    ),
  },
  {
    path: '',
    element: <Navigate to="/admin/dashboard" replace />,
  },
];

/**
 * Configuration de la structure admin
 */
export const adminConfig = {
  baseUrl: '/admin',
  defaultRoute: '/admin/dashboard',
  routes: adminRouteConfigs,
  
  // Navigation items pour le sidebar
  navItems: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
    { label: 'Dossiers', href: '/admin/dossiers', icon: '📁' },
    { label: 'Rapports', href: '/admin/rapports', icon: '📋' },
    { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: '👥' },
    { label: 'Statistiques', href: '/admin/statistiques', icon: '📈' },
    { label: 'Rôles', href: '/admin/roles', icon: '🔐' },
    { label: 'Logs', href: '/admin/audit-logs', icon: '📋' },
    { label: 'Paramètres', href: '/admin/parametres', icon: '⚙️' },
  ],
};

export default adminConfig;
