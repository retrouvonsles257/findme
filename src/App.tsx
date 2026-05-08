/**
 * =====================================================
 * RETROUVONSLES - Main Application Component
 * Point d'entrée principale de l'application
 * Intègre tous les contextes et le routage
 * =====================================================
 */

import React, { useEffect, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Redux & Store
import { Provider as ReduxProvider } from 'react-redux';
import { store } from './store/store';

// Contextes & Providers
import {
  AuthProvider,
  ThemeProvider,
  LanguageProvider,
  NotificationProvider,
  GeolocationProvider,
  WebSocketProvider,
} from './contexts';
import { I18nProvider } from './contexts/I18nProvider';

// Services
import { maptilerConfig } from './services/maptiler';
import { envConfig } from './config';

// Routes
import AppRoutes from './routes/AppRoutes';
import { AuthSessionRestorer } from './features/auth/components/AuthSessionRestorer';
import { CitizenPushGlobalSync } from './features/notifications/components';

// Styles
import './styles/index.ts';
import './App.css';
import './index.css';

/**
 * App Component - Main Application Shell
 * 
 * Provider Hierarchy:
 * 1. ReduxProvider - Application state management
 * 2. Router - URL routing
 * 3. ThemeProvider - Dark/Light theme management
 * 4. LanguageProvider - Language/i18n management
 * 5. I18nProvider - i18n provider
 * 6. AuthProvider - Authentication context
 * 7. GeolocationProvider - Geolocation services
 * 8. NotificationProvider - Toast/notification system
 * 9. WebSocketProvider - Real-time WebSocket connection
 * 10. AppRoutes - Main routing component with all routes
 */
const App: React.FC = () => {
  /**
   * Initialize application on mount
   * - Set up theme
   * - Initialize language settings
   * - Register service worker
   * - Set up error boundaries
   */
  const initializeApp = useCallback(() => {
    try {
      // Initialize theme from localStorage or system preference
      const savedTheme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', savedTheme);

      // Initialize language from localStorage or browser default
      const savedLanguage = localStorage.getItem('language') || 'fr';
      document.documentElement.setAttribute('lang', savedLanguage);

      // Initialize MapTiler with API key
      const maptilerApiKey = envConfig.REACT_APP_MAPTILER_API_KEY;
      if (maptilerApiKey) {
        maptilerConfig.initialize(maptilerApiKey);

      } else {

      }

      // FCM : public/firebase-messaging-sw.js (généré au prestart/prebuild depuis .env)
    } catch (error) {
      console.error('App initialization error:', error);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return (
    <ReduxProvider store={store}>
      <AuthSessionRestorer />
      <Router>
        <ThemeProvider>
          <LanguageProvider>
            <I18nProvider>
              <AuthProvider>
                <CitizenPushGlobalSync />
                <GeolocationProvider>
                  <NotificationProvider>
                    <WebSocketProvider>
                      <main className="app-container" role="main">
                        <AppRoutes />
                      </main>
                    </WebSocketProvider>
                  </NotificationProvider>
                </GeolocationProvider>
              </AuthProvider>
            </I18nProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Router>
    </ReduxProvider>
  );
};

export default App;
