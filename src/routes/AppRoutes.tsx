/**
 * =====================================================
 * RETROUVONSLES - Main App Routes
 * Point d'entrée principal pour le routing de l'application
 * Intègre tous les modules et leurs routes
 * =====================================================
 */

import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import des composants de routes par module
import PublicRoutes from './PublicRoutes';
import AuthRoutes from './AuthRoutes';
import CitizenRoutes from './CitizenRoutes';
import AuthorityRoutes from './AuthorityRoutes';
import AdminRoutes from './AdminRoutes';
import SuperAdminRoutes from './SuperAdminRoutes';
import ErrorRoutes from './ErrorRoutes';
import { LEGACY_SILO_BASES, LEGACY_SILO_REDIRECT_TARGET, ROUTES } from './routes.config';

/**
 * Loading Component
 * Affichage pendant le chargement des routes
 */
const LoadingComponent: React.FC = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <div>Chargement de l'application...</div>
  </div>
);

/**
 * AppRoutes Component
 * Composant principal de routing pour toute l'application
 * Structures:
 * - Public routes: / (accessibles sans auth)
 * - Auth routes: /auth/* (login, register, forgot password, etc)
 * - Citizen routes: /citizen/* (citoyens standard et vérifiés)
 * - Authority routes: /authority/* (police, gendarmerie)
 * - (Étape D5) Redirections legacy : `LEGACY_SILO_BASES` → `/authority/dashboard` (voir `routes.config.ts`).
 * - Admin routes: /admin/* (admin d'organisations)
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

        {/* Admin Routes */}
        <Route path={`${ROUTES.admin.BASE}/*`} element={<AdminRoutes />} />

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
