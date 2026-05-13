/**
 * =====================================================
 * RETROUVONSLES - Main App Routes
 * Point d'entrée principal pour le routing de l'application
 * Intègre tous les modules et leurs routes
 * =====================================================
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLoadingShell } from '../components/shell/AppLoadingShell';

// Import des composants de routes par module
import PublicRoutes from './PublicRoutes';
import AuthRoutes from './AuthRoutes';
import CitizenRoutes from './CitizenRoutes';
import AuthorityRoutes from './AuthorityRoutes';
import SuperAdminRoutes from './SuperAdminRoutes';
import ErrorRoutes from './ErrorRoutes';
import { LEGACY_SILO_BASES, LEGACY_SILO_REDIRECT_TARGET, ROUTES } from './routes.config';

/**
 * Loading Component
 * Affichage pendant le chargement des routes
 */
const LoadingComponent: React.FC = () => <AppLoadingShell variant="lazy" fixed />;

const mapLegacyAdminPath = (pathname: string): string => {
  const suffix = pathname.replace(/^\/admin/, '') || '/';
  if (suffix === '/' || suffix === '/dashboard') return '/authority/dashboard';
  if (suffix === '/utilisateurs') return '/authority/equipe';
  if (suffix === '/utilisateurs/new') return '/authority/equipe/nouveau';
  if (suffix.match(/^\/utilisateurs\/[^/]+$/)) return suffix.replace('/utilisateurs/', '/authority/equipe/');
  if (suffix === '/dossiers') return '/authority/dossiers';
  if (suffix === '/dossiers/new') return '/authority/dossiers/new';
  if (suffix.match(/^\/dossiers\/[^/]+\/edit$/)) return suffix.replace('/dossiers/', '/authority/dossiers/');
  if (suffix.match(/^\/dossiers\/[^/]+$/)) return suffix.replace('/dossiers/', '/authority/dossiers/');
  if (suffix === '/alertes') return '/authority/alertes';
  if (suffix === '/alertes/new') return '/authority/alertes/new';
  if (suffix.match(/^\/alertes\/[^/]+$/)) return suffix.replace('/alertes/', '/authority/alertes/');
  if (suffix === '/signalements') return '/authority/signalements';
  if (suffix.match(/^\/signalements\/[^/]+$/)) return suffix.replace('/signalements/', '/authority/signalements/');
  if (suffix === '/ia' || suffix === '/ia-analysis') return '/authority/ia-analysis';
  if (suffix === '/coordination') return '/authority/coordination';
  if (suffix === '/carte') return '/authority/map-view';
  if (suffix === '/photos-moderation' || suffix === '/photos-en-attente') return '/authority/photos-moderation';
  if (suffix === '/verification-identite') return '/authority/verifications-identite';
  if (suffix === '/personnes') return '/authority/personnes';
  if (suffix.match(/^\/personnes\/[^/]+$/)) return suffix.replace('/personnes/', '/authority/personnes/');
  if (suffix === '/signalements-en-attente') return '/authority/signalements?vue=traitement';
  if (suffix === '/campagnes' || suffix === '/campagnes/create') return '/authority/donations';
  if (suffix === '/cas' || suffix === '/cas/create') return '/authority/dossiers';
  if (suffix === '/ressources' || suffix === '/partenariats') return '/authority/coordination';
  if (suffix === '/rapports' || suffix.match(/^\/rapports\/[^/]+$/)) return '/authority/rapports-signalements';
  if (suffix === '/statistiques') return '/authority/statistiques';
  if (suffix === '/profile') return '/authority/profile';
  if (suffix === '/parametres') return '/authority/organisation/parametres';
  if (suffix === '/workflows') return '/authority/dashboard';
  if (suffix === '/donations') return '/authority/donations';
  if (suffix === '/roles') return '/super-admin/roles';
  if (suffix === '/audit-logs') return '/super-admin/system-logs';
  return '/authority/dashboard';
};

const LegacyAdminRedirect: React.FC = () => {
  const { pathname, search } = useLocation();
  return <Navigate to={`${mapLegacyAdminPath(pathname)}${search}`} replace />;
};

/**
 * AppRoutes Component
 * Composant principal de routing pour toute l'application
 * Structures:
 * - Public routes: / (accessibles sans auth)
 * - Auth routes: /auth/* (login, register, forgot password, etc)
 * - Citizen routes: /citizen/* (citoyens standard et vérifiés)
 * - Authority routes: /authority/* (police, gendarmerie)
 * - (Étape D5) Redirections legacy : `LEGACY_SILO_BASES` → `/authority/dashboard` (voir `routes.config.ts`).
 * - Legacy admin routes: /admin/* (redirigé vers authority/super-admin)
 * - SuperAdmin routes: /super-admin/* (super administrateur système)
 * - Error routes: /unauthorized, /forbidden, /server-error, 404
 */
const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <Routes>
        {/* ========================================
            PUBLIC MODULE - Accessible without auth
            ======================================== */}
        <Route path="/*" element={<PublicRoutes />} />

        {/* ========================================
            AUTH MODULE - Authentication pages
            ======================================== */}
        <Route path={`${ROUTES.auth.BASE}/*`} element={<AuthRoutes />} />

        {/* ========================================
            PROTECTED MODULES - Require authentication
            Ordered by route prefix for clarity
            ======================================== */}

        {/* Citizen Routes */}
        <Route path={`${ROUTES.citizen.BASE}/*`} element={<CitizenRoutes />} />

        {/* Authority Routes */}
        <Route path={`${ROUTES.authority.BASE}/*`} element={<AuthorityRoutes />} />

        {LEGACY_SILO_BASES.map((base) => (
          <Route
            key={base}
            path={`${base}/*`}
            element={<Navigate to={LEGACY_SILO_REDIRECT_TARGET} replace />}
          />
        ))}

        {/* Legacy admin prefix */}
        <Route path="/admin/*" element={<LegacyAdminRedirect />} />

        {/* SuperAdmin Routes */}
        <Route path={`${ROUTES.superAdmin.BASE}/*`} element={<SuperAdminRoutes />} />

        {/* ========================================
            ERROR ROUTES
            ======================================== */}
        <Route path={`${ROUTES.errors.UNAUTHORIZED}/*`} element={<ErrorRoutes />} />
        <Route path={`${ROUTES.errors.FORBIDDEN}/*`} element={<ErrorRoutes />} />
        <Route path={`${ROUTES.errors.SERVER_ERROR}/*`} element={<ErrorRoutes />} />

        {/* 404 - Not Found (Doit être en dernier) */}
        <Route path="*" element={<ErrorRoutes />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
