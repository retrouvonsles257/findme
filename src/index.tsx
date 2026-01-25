/**
 * =====================================================
 * RETROUVONSLES - React Application Entry Point
 * Point d'entrée pour le rendu React de l'application
 * =====================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Get root element
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

/**
 * Render the application
 * App component handles all providers and routing
 */
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Performance monitoring
 * Send metrics to analytics endpoint
 */
reportWebVitals();
