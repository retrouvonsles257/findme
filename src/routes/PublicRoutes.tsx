/**
 * =====================================================
 * RETROUVONSLES - Public Routes
 * Routes accessibles sans authentification
 * =====================================================
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  HomePage,
  SearchPage,
  DisparitionsPage,
  DossierDetailPage,
  MapPage,
  AboutPage,
  ContactPage,
  DonatePage,
  HowItWorksPage,
  PreventingPage
} from '../pages/public';

import { PUBLIC_ROUTES } from './routes.config';

/**
 * PublicRoutes Component
 * Contient toutes les routes publiques accessibles sans authentification
 * - Accueil (statistics, testimonials)
 * - Recherche avancée de dossiers
 * - Liste des disparitions
 * - Détail d'un dossier
 * - Carte interactive
 * - À Propos
 * - Contact
 * - Faire un don
 * - Comment ça marche
 * - Prévention
 */
const PublicRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Home Page */}
      <Route path={PUBLIC_ROUTES.HOME} element={<HomePage />} />

      {/* Search Page */}
      <Route path={PUBLIC_ROUTES.SEARCH} element={<SearchPage />} />

      {/* Disparitions List */}
      <Route path={PUBLIC_ROUTES.DISPARITIONS} element={<DisparitionsPage />} />

      {/* Dossier Detail */}
      <Route path={PUBLIC_ROUTES.DOSSIER_DETAIL} element={<DossierDetailPage />} />

      {/* Interactive Map */}
      <Route path={PUBLIC_ROUTES.MAP} element={<MapPage />} />

      {/* About Page */}
      <Route path={PUBLIC_ROUTES.ABOUT} element={<AboutPage />} />

      {/* Contact Form */}
      <Route path={PUBLIC_ROUTES.CONTACT} element={<ContactPage />} />

      {/* Donation Page */}
      <Route path={PUBLIC_ROUTES.DONATE} element={<DonatePage />} />

      {/* How It Works */}
      <Route path={PUBLIC_ROUTES.HOW_IT_WORKS} element={<HowItWorksPage />} />

      {/* Prevention Tips */}
      <Route path={PUBLIC_ROUTES.PREVENTING} element={<PreventingPage />} />
    </Routes>
  );
};

export default PublicRoutes;
