/**
 * =====================================================
 * RETROUVONSLES - Public Routes
 * Routes accessibles sans authentification
 * =====================================================
 */

import React from 'react';
import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { PublicSiteLayout } from '../components/public';
import {
  HomePage,
  DisparitionsPage,
  DossierDetailPage,
  AboutPage,
  ContactPage,
  DonatePage,
  HowItWorksPage,
  PreventingPage,
  AppDownloadPage,
  ContributePage,
} from '../pages/public';

import { PUBLIC_ROUTES } from './routes.config';

/** Redirige /search?… vers /disparitions?… (mêmes paramètres de requête). */
const SearchToDisparitionsRedirect: React.FC = () => {
  const [params] = useSearchParams();
  const s = params.toString();
  return <Navigate to={s ? `${PUBLIC_ROUTES.DISPARITIONS}?${s}` : PUBLIC_ROUTES.DISPARITIONS} replace />;
};

/** Redirige /map vers la section carte de la home. */
const MapToHomeRedirect: React.FC = () => (
  <Navigate to={{ pathname: PUBLIC_ROUTES.HOME, hash: '#home-map' }} replace />
);

/** Ancienne URL /contribuer → /signaler (conserve ?next=…) */
const LegacyContributeRedirect: React.FC = () => {
  const [params] = useSearchParams();
  const s = params.toString();
  const target = s ? `${PUBLIC_ROUTES.CONTRIBUTE}?${s}` : PUBLIC_ROUTES.CONTRIBUTE;
  return <Navigate to={target} replace />;
};

/**
 * PublicRoutes Component
 * Contient toutes les routes publiques accessibles sans authentification
 */
const PublicRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PublicSiteLayout />}>
        <Route path={PUBLIC_ROUTES.HOME} element={<HomePage />} />
        <Route path={PUBLIC_ROUTES.SEARCH} element={<SearchToDisparitionsRedirect />} />
        <Route path={PUBLIC_ROUTES.DISPARITIONS} element={<DisparitionsPage />} />
        <Route path={PUBLIC_ROUTES.DOSSIER_DETAIL} element={<DossierDetailPage />} />
        <Route path={PUBLIC_ROUTES.MAP} element={<MapToHomeRedirect />} />
        <Route path={PUBLIC_ROUTES.ABOUT} element={<AboutPage />} />
        <Route path={PUBLIC_ROUTES.CONTACT} element={<ContactPage />} />
        <Route path={PUBLIC_ROUTES.DONATE} element={<DonatePage />} />
        <Route path={PUBLIC_ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />
        <Route path={PUBLIC_ROUTES.PREVENTING} element={<PreventingPage />} />
        <Route path={PUBLIC_ROUTES.APP} element={<AppDownloadPage />} />
        <Route path="/contribuer" element={<LegacyContributeRedirect />} />
        <Route path={PUBLIC_ROUTES.CONTRIBUTE} element={<ContributePage />} />
      </Route>
    </Routes>
  );
};

export default PublicRoutes;
